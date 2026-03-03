const mongoose = require("mongoose");
const Account = require("../models/Account");
const Member = require("../models/Member");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const AcademySubscription = require("../models/AcademySubscription");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");

const createAcademySubscription = async ({
  childData,
  sportId,
  groupId,
  memberType,
  parentSubscriptionId,
  durationMonths,
  startDate,
  paymentData,
  userId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find and validate sport
    const sport = await Sport.findById(sportId).session(session);
    if (!sport) {
      throw new Error("الرياضة غير موجودة");
    }
    if (!sport.isActive) {
      throw new Error("الرياضة غير فعالة حالياً");
    }

    // 2. Find and validate group
    const group = await AcademyGroup.findById(groupId).session(session);
    if (!group) {
      throw new Error("المجموعة غير موجودة");
    }
    if (group.currentCount >= group.maxCapacity) {
      throw new Error("المجموعة ممتلئة، اختر مجموعة أخرى");
    }

    // 3. Validate gender match
    if (sport.gender === "male" && childData.gender === "female") {
      throw new Error("هذه الرياضة للأولاد فقط");
    }
    if (sport.gender === "female" && childData.gender === "male") {
      throw new Error("هذه الرياضة للبنات فقط");
    }

    // 4. Validate age from dateOfBirth
    const birthDate = new Date(childData.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age >= 15) {
      throw new Error("الأكاديمية للأطفال أقل من 15 سنة فقط");
    }
    if (age < sport.minAge) {
      throw new Error(
        `السن أقل من الحد المسموح لهذه الرياضة (الحد الأدنى: ${sport.minAge} سنوات)`,
      );
    }

    // 5. Handle linked membership validation
    let parentSub = null;
    if (memberType === "linked") {
      if (!parentSubscriptionId) {
        throw new Error("معرف الاشتراك الأب مطلوب للأعضاء المرتبطين");
      }

      parentSub =
        await Subscription.findById(parentSubscriptionId).session(session);
      if (!parentSub) {
        throw new Error("اشتراك ولي الأمر غير موجود");
      }
      if (parentSub.status !== "active") {
        throw new Error("اشتراك ولي الأمر غير فعال");
      }

      // Calculate endDate and check if it exceeds parent
      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + durationMonths);

      if (calculatedEndDate > parentSub.endDate) {
        throw new Error("تاريخ الانتهاء يتجاوز اشتراك ولي الأمر");
      }
    }

    // 6. Calculate price (already calculated on frontend, validate it's a number)
    const amount = paymentData.amount || 0;
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("السعر غير صحيح");
    }

    // 8. Create or find Member
    let child;
    if (childData.phone) {
      child = await Member.findOne({
        phone: childData.phone,
        role: "child",
      }).session(session);
    }

    if (!child) {
      child = new Member({
        ...childData,
        role: "child",
        guardianAccountId: null,
      });
      await child.save({ session });
    }

    // 9. Create AcademySubscription
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + durationMonths);

    const academySubscription = new AcademySubscription({
      memberId: child._id,
      sportId,
      groupId,
      memberType,
      parentSubscriptionId:
        memberType === "linked" ? parentSubscriptionId : null,
      startDate: startDateObj,
      endDate: endDateObj,
      durationMonths,
      pricePaid: amount,
      paymentMethod: paymentData.method || "cash",
      status: "active",
      renewalCount: 0,
      createdBy: userId,
    });
    await academySubscription.save({ session });

    // 10. Increment group currentCount
    await AcademyGroup.findByIdAndUpdate(
      groupId,
      { $inc: { currentCount: 1 } },
      { session },
    );

    // Create payment record
    const payment = new Payment({
      subscriptionId: academySubscription._id,
      memberId: child._id,
      amount,
      method: paymentData.method || "cash",
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save({ session });

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "new_subscription",
      subscriptionId: academySubscription._id,
      performedBy: userId,
      after: {
        subscription: academySubscription.toObject(),
        child: child.toObject(),
        sport: sport.toObject(),
        group: group.toObject(),
      },
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    return {
      subscription: academySubscription,
      child,
      sport,
      group,
      payment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ CHANGE SPORT ============
const changeSport = async ({
  academySubscriptionId,
  newSportId,
  newGroupId,
  userId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get current subscription
    const oldSubscription = await AcademySubscription.findById(
      academySubscriptionId,
    ).session(session);
    if (!oldSubscription) {
      throw new Error("الاشتراك غير موجود");
    }
    if (oldSubscription.status !== "active") {
      throw new Error("لا يمكن تغيير الرياضة لاشتراك غير نشط");
    }

    // 2. Get member to validate age/gender
    const member = await Member.findById(oldSubscription.memberId).session(
      session,
    );
    if (!member) {
      throw new Error("الطفل غير موجود");
    }

    // 3. Validate new sport
    const newSport = await Sport.findById(newSportId).session(session);
    if (!newSport) {
      throw new Error("الرياضة الجديدة غير موجودة");
    }
    if (!newSport.isActive) {
      throw new Error("الرياضة الجديدة غير فعالة");
    }

    // 4. Validate gender match with new sport
    if (newSport.gender === "male" && member.gender === "female") {
      throw new Error("الرياضة الجديدة للأولاد فقط");
    }
    if (newSport.gender === "female" && member.gender === "male") {
      throw new Error("الرياضة الجديدة للبنات فقط");
    }

    // 5. Calculate and validate age
    const birthDate = new Date(member.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < newSport.minAge) {
      throw new Error(
        `السن أقل من الحد المسموح للرياضة الجديدة (الحد الأدنى: ${newSport.minAge})`,
      );
    }

    // 6. Validate new group
    const newGroup = await AcademyGroup.findById(newGroupId).session(session);
    if (!newGroup) {
      throw new Error("المجموعة الجديدة غير موجودة");
    }
    if (newGroup.currentCount >= newGroup.maxCapacity) {
      throw new Error("المجموعة الجديدة ممتلئة");
    }

    // 7. Cancel old subscription (soft delete)
    oldSubscription.status = "cancelled";
    await oldSubscription.save({ session });

    // 8. Decrement old group count
    await AcademyGroup.findByIdAndUpdate(
      oldSubscription.groupId,
      { $inc: { currentCount: -1 } },
      { session },
    );

    // 9. Create new subscription with same dates and duration
    const newSubscription = new AcademySubscription({
      memberId: oldSubscription.memberId,
      sportId: newSportId,
      groupId: newGroupId,
      memberType: oldSubscription.memberType,
      parentSubscriptionId: oldSubscription.parentSubscriptionId,
      startDate: oldSubscription.startDate,
      endDate: oldSubscription.endDate,
      durationMonths: oldSubscription.durationMonths,
      pricePaid: 0, // No additional charge for change
      paymentMethod: oldSubscription.paymentMethod,
      status: "active",
      renewalCount: oldSubscription.renewalCount,
      createdBy: userId,
    });
    await newSubscription.save({ session });

    // 10. Increment new group count
    await AcademyGroup.findByIdAndUpdate(
      newGroupId,
      { $inc: { currentCount: 1 } },
      { session },
    );

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "change_package",
      subscriptionId: newSubscription._id,
      performedBy: userId,
      notes: "تغيير رياضة",
      before: {
        sportId: oldSubscription.sportId,
        groupId: oldSubscription.groupId,
      },
      after: {
        sportId: newSportId,
        groupId: newGroupId,
      },
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    return {
      oldSubscription,
      newSubscription,
      member,
      sport: newSport,
      group: newGroup,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ CHANGE GROUP ============
const changeGroup = async ({ academySubscriptionId, newGroupId, userId }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get current subscription
    const subscription = await AcademySubscription.findById(
      academySubscriptionId,
    ).session(session);
    if (!subscription) {
      throw new Error("الاشتراك غير موجود");
    }
    if (subscription.status !== "active") {
      throw new Error("لا يمكن تغيير المجموعة لاشتراك غير نشط");
    }

    // 2. Validate new group exists and is same sport
    const newGroup = await AcademyGroup.findById(newGroupId).session(session);
    if (!newGroup) {
      throw new Error("المجموعة الجديدة غير موجودة");
    }
    if (newGroup.sportId.toString() !== subscription.sportId.toString()) {
      throw new Error("المجموعة الجديدة يجب أن تكون لنفس الرياضة");
    }
    if (newGroup.currentCount >= newGroup.maxCapacity) {
      throw new Error("المجموعة الجديدة ممتلئة");
    }

    // 3. Get old group
    const oldGroup = await AcademyGroup.findById(subscription.groupId).session(
      session,
    );

    // 4. Update subscription
    const oldGroupId = subscription.groupId;
    subscription.groupId = newGroupId;
    await subscription.save({ session });

    // 5. Decrement old group count
    await AcademyGroup.findByIdAndUpdate(
      oldGroupId,
      { $inc: { currentCount: -1 } },
      { session },
    );

    // 6. Increment new group count
    await AcademyGroup.findByIdAndUpdate(
      newGroupId,
      { $inc: { currentCount: 1 } },
      { session },
    );

    // 7. Create AuditLog
    const auditLog = new AuditLog({
      action: "change_package",
      subscriptionId: subscription._id,
      performedBy: userId,
      notes: "تغيير مجموعة",
      before: {
        groupId: oldGroupId,
      },
      after: {
        groupId: newGroupId,
      },
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    return {
      subscription,
      oldGroup,
      newGroup,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// ============ ADD SPORT TO CHILD ============
const addSportToChild = async ({
  memberId,
  sportId,
  groupId,
  durationMonths,
  startDate,
  paymentData,
  memberType,
  parentSubscriptionId,
  userId,
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get member
    const member = await Member.findById(memberId).session(session);
    if (!member) {
      throw new Error("الطفل غير موجود");
    }

    // 2. Validate sport
    const sport = await Sport.findById(sportId).session(session);
    if (!sport) {
      throw new Error("الرياضة غير موجودة");
    }
    if (!sport.isActive) {
      throw new Error("الرياضة غير فعالة");
    }

    // 3. Validate gender match
    if (sport.gender === "male" && member.gender === "female") {
      throw new Error("هذه الرياضة للأولاد فقط");
    }
    if (sport.gender === "female" && member.gender === "male") {
      throw new Error("هذه الرياضة للبنات فقط");
    }

    // 4. Validate age
    const birthDate = new Date(member.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age >= 15) {
      throw new Error("الأكاديمية للأطفال أقل من 15 سنة فقط");
    }
    if (age < sport.minAge) {
      throw new Error(
        `السن أقل من الحد المسموح لهذه الرياضة (الحد الأدنى: ${sport.minAge})`,
      );
    }

    // 5. Validate group
    const group = await AcademyGroup.findById(groupId).session(session);
    if (!group) {
      throw new Error("المجموعة غير موجودة");
    }
    if (group.currentCount >= group.maxCapacity) {
      throw new Error("المجموعة ممتلئة");
    }

    // 6. Validate parent subscription if linked
    if (memberType === "linked") {
      if (!parentSubscriptionId) {
        throw new Error("معرف الاشتراك الأب مطلوب للأعضاء المرتبطين");
      }

      const parentSub =
        await Subscription.findById(parentSubscriptionId).session(session);
      if (!parentSub) {
        throw new Error("اشتراك ولي الأمر غير موجود");
      }
      if (parentSub.status !== "active") {
        throw new Error("اشتراك ولي الأمر غير فعال");
      }

      const calculatedEndDate = new Date(startDate);
      calculatedEndDate.setMonth(calculatedEndDate.getMonth() + durationMonths);

      if (calculatedEndDate > parentSub.endDate) {
        throw new Error("تاريخ الانتهاء يتجاوز اشتراك ولي الأمر");
      }
    }

    // 7. Validate price
    const amount = paymentData.amount || 0;
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error("السعر غير صحيح");
    }

    // 8. Create new AcademySubscription (no existing subscriptions closed)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(startDateObj);
    endDateObj.setMonth(endDateObj.getMonth() + durationMonths);

    const academySubscription = new AcademySubscription({
      memberId,
      sportId,
      groupId,
      memberType,
      parentSubscriptionId:
        memberType === "linked" ? parentSubscriptionId : null,
      startDate: startDateObj,
      endDate: endDateObj,
      durationMonths,
      pricePaid: amount,
      paymentMethod: paymentData.method || "cash",
      status: "active",
      renewalCount: 0,
      createdBy: userId,
    });
    await academySubscription.save({ session });

    // 9. Increment group currentCount
    await AcademyGroup.findByIdAndUpdate(
      groupId,
      { $inc: { currentCount: 1 } },
      { session },
    );

    // 10. Create payment record
    const payment = new Payment({
      subscriptionId: academySubscription._id,
      memberId,
      amount,
      method: paymentData.method || "cash",
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save({ session });

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "new_subscription",
      subscriptionId: academySubscription._id,
      performedBy: userId,
      notes: "إضافة رياضة جديدة لطفل موجود",
      after: {
        subscription: academySubscription.toObject(),
        member: member.toObject(),
        sport: sport.toObject(),
        group: group.toObject(),
      },
    });
    await auditLog.save({ session });

    await session.commitTransaction();

    return {
      subscription: academySubscription,
      member,
      sport,
      group,
      payment,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  createAcademySubscription,
  changeSport,
  changeGroup,
  addSportToChild,
};
