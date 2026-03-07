const mongoose = require("mongoose");
const Account = require("../models/Account");
const Member = require("../models/Member");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const AcademySubscription = require("../models/AcademySubscription");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");

// Sanitize function: convert empty strings and null to undefined
// This prevents null values in sparse unique indexes (mongoDB sparse indexes don't allow multiple nulls)
const sanitize = (val) => {
  if (val === null || val === undefined) return undefined;
  if (typeof val === "string" && val.trim() === "") return undefined;
  return typeof val === "string" ? val.trim() : val;
};

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
  try {
    // 1. Find and validate sport
    const sport = await Sport.findById(sportId);
    if (!sport) {
      throw new Error("الرياضة غير موجودة");
    }
    if (!sport.isActive) {
      throw new Error("الرياضة غير فعالة حالياً");
    }

    // 2. Find and validate group
    const group = await AcademyGroup.findById(groupId);
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

      parentSub = await Subscription.findById(parentSubscriptionId);
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

    // 7. Create or find Member
    let child;

    // Sanitize child data to convert empty strings and null to undefined
    const sanitizedChildData = {
      ...childData,
      phone: sanitize(childData.phone),
      email: sanitize(childData.email),
      nationalId: sanitize(childData.nationalId),
      guardianName: sanitize(childData.guardianName),
      guardianPhone: sanitize(childData.guardianPhone),
    };

    if (sanitizedChildData.phone) {
      child = await Member.findOne({
        phone: sanitizedChildData.phone,
        role: "child",
      });
    }

    let childAccount = null;
    if (!child) {
      // Create a temporary account for the child
      const [newChildAccount] = await Account.create([
        {
          type: memberType === "linked" ? "family" : "academy_only",
          status: "active",
          createdBy: userId,
        },
      ]);
      childAccount = newChildAccount;

      child = new Member({
        ...sanitizedChildData,
        accountId: childAccount._id,
        role: "child",
        guardianAccountId: null,
      });
      await child.save();
    } else {
      // If child exists, get their account
      childAccount = await Account.findById(child.accountId);
    }

    // 8. Create AcademySubscription
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
    await academySubscription.save();

    // 9. Increment group currentCount
    await AcademyGroup.findByIdAndUpdate(groupId, {
      $inc: { currentCount: 1 },
    });

    // 10. Create payment record
    console.log("userId in service:", userId);
    console.log("payment data:", { amount, method: paymentData.method });
    await Payment.create([
      {
        subscriptionId: academySubscription._id,
        memberId: child._id,
        amount,
        method: paymentData.method || "cash",
        type: "new",
        paidAt: new Date(),
        createdBy: userId,
      },
    ]);
    const payment = await Payment.findOne({
      subscriptionId: academySubscription._id,
    });

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "new_subscription",
      subscriptionId: academySubscription._id,
      performedBy: userId,
      after: {
        subscription: academySubscription.toObject(),
        member: child.toObject(),
        sport: sport.toObject(),
        group: group.toObject(),
      },
    });
    await auditLog.save();

    // 12. Return properly structured response
    return {
      member: {
        _id: child._id,
        fullName: child.fullName,
        gender: child.gender,
        dateOfBirth: child.dateOfBirth,
      },
      subscription: {
        _id: academySubscription._id,
        startDate: academySubscription.startDate,
        endDate: academySubscription.endDate,
        durationMonths: academySubscription.durationMonths,
        pricePaid: academySubscription.pricePaid,
        paymentMethod: academySubscription.paymentMethod,
        status: academySubscription.status,
      },
      sport: {
        _id: sport._id,
        name: sport.name,
        nameEn: sport.nameEn,
      },
      group: {
        _id: group._id,
        name: group.name,
        schedule: group.schedule,
      },
      account: {
        _id: childAccount._id,
        type: childAccount.type,
      },
    };
  } catch (error) {
    throw error;
  }
};

// ============ CHANGE SPORT ============
const changeSport = async ({
  academySubscriptionId,
  newSportId,
  newGroupId,
  userId,
}) => {
  try {
    // 1. Get current subscription
    const oldSubscription = await AcademySubscription.findById(
      academySubscriptionId,
    );
    if (!oldSubscription) {
      throw new Error("الاشتراك غير موجود");
    }
    if (oldSubscription.status !== "active") {
      throw new Error("لا يمكن تغيير الرياضة لاشتراك غير نشط");
    }

    // 2. Get member to validate age/gender
    const member = await Member.findById(oldSubscription.memberId);
    if (!member) {
      throw new Error("الطفل غير موجود");
    }

    // 3. Validate new sport
    const newSport = await Sport.findById(newSportId);
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
    const newGroup = await AcademyGroup.findById(newGroupId);
    if (!newGroup) {
      throw new Error("المجموعة الجديدة غير موجودة");
    }
    if (newGroup.currentCount >= newGroup.maxCapacity) {
      throw new Error("المجموعة الجديدة ممتلئة");
    }

    // 7. Cancel old subscription (soft delete)
    oldSubscription.status = "cancelled";
    await oldSubscription.save();

    // 8. Decrement old group count
    await AcademyGroup.findByIdAndUpdate(oldSubscription.groupId, {
      $inc: { currentCount: -1 },
    });

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
    await newSubscription.save();

    // 10. Increment new group count
    await AcademyGroup.findByIdAndUpdate(newGroupId, {
      $inc: { currentCount: 1 },
    });

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
    await auditLog.save();

    return {
      oldSubscription,
      newSubscription,
      member,
      sport: newSport,
      group: newGroup,
    };
  } catch (error) {
    throw error;
  }
};

// ============ CHANGE GROUP ============
const changeGroup = async ({ academySubscriptionId, newGroupId, userId }) => {
  try {
    // 1. Get current subscription
    const subscription = await AcademySubscription.findById(
      academySubscriptionId,
    );
    if (!subscription) {
      throw new Error("الاشتراك غير موجود");
    }
    if (subscription.status !== "active") {
      throw new Error("لا يمكن تغيير المجموعة لاشتراك غير نشط");
    }

    // 2. Validate new group exists and is same sport
    const newGroup = await AcademyGroup.findById(newGroupId);
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
    const oldGroup = await AcademyGroup.findById(subscription.groupId);

    // 4. Update subscription
    const oldGroupId = subscription.groupId;
    subscription.groupId = newGroupId;
    await subscription.save();

    // 5. Decrement old group count
    await AcademyGroup.findByIdAndUpdate(oldGroupId, {
      $inc: { currentCount: -1 },
    });

    // 6. Increment new group count
    await AcademyGroup.findByIdAndUpdate(newGroupId, {
      $inc: { currentCount: 1 },
    });

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
    await auditLog.save();

    return {
      subscription,
      oldGroup,
      newGroup,
    };
  } catch (error) {
    throw error;
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
  try {
    // 1. Get member
    const member = await Member.findById(memberId);
    if (!member) {
      throw new Error("الطفل غير موجود");
    }

    // 2. Validate sport
    const sport = await Sport.findById(sportId);
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
    const group = await AcademyGroup.findById(groupId);
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

      const parentSub = await Subscription.findById(parentSubscriptionId);
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
    await academySubscription.save();

    // 9. Increment group currentCount
    await AcademyGroup.findByIdAndUpdate(groupId, {
      $inc: { currentCount: 1 },
    });

    // 10. Create payment record
    console.log("userId in service (addSportToChild):", userId);
    await Payment.create([
      {
        subscriptionId: academySubscription._id,
        memberId,
        amount,
        method: paymentData.method || "cash",
        type: "new",
        paidAt: new Date(),
        createdBy: userId,
      },
    ]);
    const payment = await Payment.findOne({
      subscriptionId: academySubscription._id,
    });

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
    await auditLog.save();

    return {
      subscription: academySubscription,
      member,
      sport,
      group,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAcademySubscription,
  changeSport,
  changeGroup,
  addSportToChild,
};
