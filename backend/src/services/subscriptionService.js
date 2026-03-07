const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");

// Sanitize function: convert empty strings and null to undefined
// This prevents null values in sparse unique indexes (mongoDB sparse indexes don't allow multiple nulls)
const sanitize = (val) =>
  val && val.toString().trim() !== "" ? val.trim() : undefined;

const createNewSubscription = async ({
  memberData,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    // 1. Create Account
    const account = new Account({
      type: packageData.category,
      createdBy: userId,
    });
    await account.save();

    // 2. Create Member
    const member = new Member({
      accountId: account._id,
      ...memberData,
      phone: sanitize(memberData.phone),
      email: sanitize(memberData.email),
      nationalId: sanitize(memberData.nationalId),
      role: "primary",
    });
    await member.save();

    // 3. Update Account.primaryMemberId
    account.primaryMemberId = member._id;
    await account.save();

    // 4. Calculate subscription dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + packageData.durationMonths);

    // 5. Create Subscription
    const subscription = new Subscription({
      memberId: member._id,
      accountId: account._id,
      packageId: packageData._id,
      type: packageData.sport === "general" ? "gym" : "academy",
      startDate,
      endDate,
      pricePaid: packageData.price,
      sport: packageData.sport,
      status: "active",
      createdBy: userId,
    });
    await subscription.save();

    // 6. Create Payment
    const payment = new Payment({
      subscriptionId: subscription._id,
      memberId: member._id,
      amount: packageData.price,
      method: paymentData.method,
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 7. Create AuditLog
    const auditLog = new AuditLog({
      action: "create_subscription",
      subscriptionId: subscription._id,
      performedBy: userId,
      after: {
        subscription: subscription.toObject(),
        member: member.toObject(),
        account: account.toObject(),
      },
    });
    await auditLog.save();

    return {
      subscription,
      member,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const createFriendsSubscription = async ({
  primaryData,
  partnerData,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    const Package = require("../models/Package");

    // Get the primary package first
    const primaryPackage = await Package.findById(packageData._id);
    if (!primaryPackage) throw new Error("الباقة مش موجودة");

    console.log("=== FRIENDS DEBUG ===");
    console.log("Primary package:", primaryPackage.name);
    console.log("Duration:", primaryPackage.durationMonths);
    console.log("====================");

    // 1. Create Account
    const account = new Account({
      type: "friends",
      createdBy: userId,
    });
    await account.save();

    // 2. Create Primary Member
    const primaryMember = new Member({
      accountId: account._id,
      ...primaryData,
      phone: sanitize(primaryData.phone),
      email: sanitize(primaryData.email),
      nationalId: sanitize(primaryData.nationalId),
      role: "primary",
    });
    await primaryMember.save();

    // 3. Create Partner Member
    const partnerMember = new Member({
      accountId: account._id,
      ...partnerData,
      phone: sanitize(partnerData.phone),
      email: sanitize(partnerData.email),
      nationalId: sanitize(partnerData.nationalId),
      role: "partner",
    });
    await partnerMember.save();

    // 4. Update Account.primaryMemberId
    account.primaryMemberId = primaryMember._id;
    await account.save();

    // 5. Calculate subscription dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + primaryPackage.durationMonths);

    // 6. Create Subscription for Primary
    const primarySubscription = new Subscription({
      memberId: primaryMember._id,
      accountId: account._id,
      packageId: primaryPackage._id,
      type: "gym",
      startDate,
      endDate,
      pricePaid: primaryPackage.price,
      status: "active",
      createdBy: userId,
    });
    await primarySubscription.save();

    // 7. Create Subscription for Partner - SAME package as primary
    const partnerSubscription = new Subscription({
      memberId: partnerMember._id,
      accountId: account._id,
      packageId: primaryPackage._id, // SAME package as primary
      type: "gym",
      startDate,
      endDate: primarySubscription.endDate, // SAME endDate, not recalculated
      parentSubscriptionId: primarySubscription._id,
      pricePaid: primaryPackage.price,
      status: "active",
      createdBy: userId,
    });
    await partnerSubscription.save();

    // 8. Create Payment (covers both members)
    const payment = new Payment({
      subscriptionId: primarySubscription._id,
      memberId: primaryMember._id,
      amount: primaryPackage.price,
      method: paymentData.method,
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 9. Create AuditLog
    const auditLog = new AuditLog({
      action: "create_subscription",
      subscriptionId: primarySubscription._id,
      performedBy: userId,
      after: {
        primarySubscription: primarySubscription.toObject(),
        partnerSubscription: partnerSubscription.toObject(),
        primaryMember: primaryMember.toObject(),
        partnerMember: partnerMember.toObject(),
        account: account.toObject(),
      },
    });
    await auditLog.save();

    return {
      primarySubscription,
      partnerSubscription,
      primaryMember,
      partnerMember,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const createFamilySubscription = async ({
  primaryData,
  partnerData,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    const Package = require("../models/Package");

    // Get the primary package first
    const primaryPackage = await Package.findById(packageData._id);
    if (!primaryPackage) throw new Error("الباقة الأساسية مش موجودة");

    console.log("=== FAMILY DEBUG ===");
    console.log("Primary package:", primaryPackage.name);
    console.log("Duration:", primaryPackage.durationMonths);
    console.log("====================");

    // 1. Create Account
    const account = new Account({
      type: "family",
      createdBy: userId,
    });
    await account.save();

    // 2. Create Primary Member
    const primaryMember = new Member({
      accountId: account._id,
      ...primaryData,
      phone: sanitize(primaryData.phone),
      email: sanitize(primaryData.email),
      nationalId: sanitize(primaryData.nationalId),
      role: "primary",
    });
    await primaryMember.save();

    // 3. Create Partner Member if provided
    let partnerMember = null;
    if (partnerData) {
      partnerMember = new Member({
        accountId: account._id,
        ...partnerData,
        phone: sanitize(partnerData.phone),
        email: sanitize(partnerData.email),
        nationalId: sanitize(partnerData.nationalId),
        role: "partner",
      });
      await partnerMember.save();
    }

    // 4. Update Account.primaryMemberId
    account.primaryMemberId = primaryMember._id;
    await account.save();

    // 5. Calculate subscription dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + primaryPackage.durationMonths);

    // 6. Create Main Subscription for Primary
    const primarySubscription = new Subscription({
      memberId: primaryMember._id,
      accountId: account._id,
      packageId: primaryPackage._id,
      type: "gym",
      startDate,
      endDate,
      pricePaid: primaryPackage.price,
      status: "active",
      createdBy: userId,
    });
    await primarySubscription.save();

    // 7. Create Partner Subscription if partner exists
    // Partner gets SAME package as primary (not sub_adult)
    let partnerSubscription = null;
    if (partnerMember) {
      partnerSubscription = new Subscription({
        memberId: partnerMember._id,
        accountId: account._id,
        packageId: primaryPackage._id, // SAME package as primary
        type: "gym",
        startDate,
        endDate: primarySubscription.endDate, // SAME endDate, exact copy
        parentSubscriptionId: primarySubscription._id,
        pricePaid: primaryPackage.price, // SAME price as primary
        status: "active",
        createdBy: userId,
      });
      await partnerSubscription.save();
    }

    // 8. Create Single Payment (covers whole account)
    const payment = new Payment({
      subscriptionId: primarySubscription._id,
      memberId: primaryMember._id,
      amount: primaryPackage.price,
      method: paymentData.method,
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 9. Create AuditLog
    const auditLog = new AuditLog({
      action: "create_subscription",
      subscriptionId: primarySubscription._id,
      performedBy: userId,
      after: {
        primarySubscription: primarySubscription.toObject(),
        partnerSubscription: partnerSubscription
          ? partnerSubscription.toObject()
          : null,
        primaryMember: primaryMember.toObject(),
        partnerMember: partnerMember ? partnerMember.toObject() : null,
        account: account.toObject(),
      },
    });
    await auditLog.save();

    return {
      primarySubscription,
      partnerSubscription,
      primaryMember,
      partnerMember,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const renewSubscription = async ({
  subscriptionId,
  packageData,
  paymentData,
  userId,
}) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      throw new Error("الاشتراك غير موجود");
    }

    // Store before state
    const before = subscription.toObject();

    // Calculate new dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + packageData.durationMonths);

    // Update subscription
    subscription.status = "renewed";
    subscription.startDate = startDate;
    subscription.endDate = endDate;
    subscription.packageId = packageData._id;
    subscription.pricePaid = packageData.price;
    subscription.renewalCount += 1;
    subscription.freezeCount = 0;
    subscription.isFrozen = false;
    subscription.freezeStart = null;
    subscription.freezeEnd = null;

    await subscription.save();

    // Create Payment
    const payment = new Payment({
      subscriptionId: subscription._id,
      memberId: subscription.memberId,
      amount: packageData.price,
      method: paymentData.method,
      type: "renewal",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // Create AuditLog
    const auditLog = new AuditLog({
      action: "renew_subscription",
      subscriptionId: subscription._id,
      performedBy: userId,
      before,
      after: subscription.toObject(),
    });
    await auditLog.save();

    return {
      subscription,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const createAcademyOnlySubscription = async ({
  childData,
  sport,
  months,
  paymentData,
  userId,
}) => {
  try {
    const Package = require("../models/Package");
    const mongoose = require("mongoose");

    // 1. Validate months
    const validMonths = [1, 2, 3, 4, 5, 6, 12];
    if (!validMonths.includes(months)) {
      throw new Error("المدة المتاحة: من 1 إلى 6 شهور أو سنة كاملة");
    }

    // Validate sport
    const validSports = ["football", "swimming", "combat"];
    if (!validSports.includes(sport)) {
      throw new Error("الرياضة غير صحيحة");
    }

    // Validate childData
    if (!childData.fullName) {
      throw new Error("الاسم الكامل مطلوب");
    }
    if (!childData.gender) {
      throw new Error("النوع مطلوب");
    }
    if (!childData.dateOfBirth) {
      throw new Error("تاريخ الميلاد مطلوب");
    }

    // 2. Find the correct package
    let pkg;
    if (months === 12) {
      pkg = await Package.findOne({
        category: "academy_only",
        sport: sport,
        isFlexibleDuration: false,
        durationMonths: 12,
      });
    } else {
      pkg = await Package.findOne({
        category: "academy_only",
        sport: sport,
        isFlexibleDuration: true,
      });
    }

    if (!pkg) {
      throw new Error("الباقة غير موجودة لهذه الرياضة والمدة");
    }

    // 3. Calculate price
    let price;
    if (months <= 5) {
      price = pkg.pricePerMonth * months;
    } else if (months === 6) {
      price = pkg.pricePerMonth * 5;
    } else if (months === 12) {
      price = pkg.price;
    }

    // 4. Calculate age and validate
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

    console.log(`=== ACADEMY DEBUG ===`);
    console.log(`Sport: ${sport}, Months: ${months}`);
    console.log(`Package: ${pkg.name}`);
    console.log(`Price: ${price}, Age: ${age}`);
    console.log(`====================`);

    // 5. Create Account
    const account = new Account({
      type: "academy_only",
      createdBy: userId,
    });
    await account.save();

    // 6. Create Member (child)
    const child = new Member({
      accountId: account._id,
      ...childData,
      phone: sanitize(childData.phone),
      email: sanitize(childData.email),
      nationalId: sanitize(childData.nationalId),
      role: "child",
      guardianAccountId: null,
    });
    await child.save();

    // 7. Update Account.primaryMemberId
    account.primaryMemberId = child._id;
    await account.save();

    // 8. Calculate subscription dates
    const startDate = new Date(paymentData.startDate);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + months);

    // 9. Create Subscription
    const subscription = new Subscription({
      memberId: child._id,
      accountId: account._id,
      packageId: pkg._id,
      type: "academy",
      sport: sport,
      startDate,
      endDate,
      pricePaid: price,
      status: "active",
      createdBy: userId,
    });
    await subscription.save();

    // 10. Create Payment
    const payment = new Payment({
      subscriptionId: subscription._id,
      memberId: child._id,
      amount: price,
      method: paymentData.method,
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "create_subscription",
      subscriptionId: subscription._id,
      performedBy: userId,
      before: null,
      after: subscription.toObject(),
      notes: `اشتراك أكاديمية - ${sport}`,
    });
    await auditLog.save();

    return {
      subscription,
      child,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

const addSubMemberToFamily = async ({
  accountId,
  memberData,
  packageId,
  months,
  startDate,
  paymentData,
  userId,
}) => {
  try {
    const Package = require("../models/Package");
    const mongoose = require("mongoose");

    // 1. Find and verify account is family type
    const account = await Account.findById(accountId);
    if (!account) {
      throw new Error("الحساب غير موجود");
    }
    if (account.type !== "family") {
      throw new Error("هذا الحساب ليس حساباً عائلياً");
    }

    // 2. Find primary subscription
    const primarySubscription = await Subscription.findOne({
      accountId: accountId,
      parentSubscriptionId: null,
      status: "active",
    });
    if (!primarySubscription) {
      throw new Error("مفيش اشتراك أساسي نشط لهذا الحساب");
    }

    // 3. Find package
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      throw new Error("الباقة غير موجودة");
    }
    if (!["sub_adult", "sub_child"].includes(pkg.category)) {
      throw new Error("الباقة دي مش مناسبة لعضو فرعي");
    }

    // 4. Validate sub_child age
    if (pkg.category === "sub_child") {
      if (!memberData.dateOfBirth) {
        throw new Error("تاريخ الميلاد مطلوب للأطفال");
      }
      const birthDate = new Date(memberData.dateOfBirth);
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
        throw new Error("باقة الأطفال للأعمار أقل من 15 سنة فقط");
      }
    }

    // 5. Calculate sub member end date
    const subStartDate = new Date(startDate);
    const subEndDate = new Date(subStartDate);

    if (pkg.category === "sub_adult") {
      // sub_adult uses package.durationMonths
      subEndDate.setMonth(subEndDate.getMonth() + (pkg.durationMonths || 3));
    } else if (pkg.category === "sub_child") {
      // sub_child uses provided months
      subEndDate.setMonth(subEndDate.getMonth() + months);
    }

    // 6. Validate endDate doesn't exceed primary
    if (subEndDate > primarySubscription.endDate) {
      const subEndStr = subEndDate.toLocaleDateString("ar-SA");
      const primaryEndStr =
        primarySubscription.endDate.toLocaleDateString("ar-SA");
      throw new Error(
        `تاريخ انتهاء العضو الفرعي (${subEndStr}) يتجاوز انتهاء الاشتراك الأساسي (${primaryEndStr})`,
      );
    }

    // 7. Calculate price
    let pricePaid;
    if (pkg.category === "sub_adult") {
      pricePaid = pkg.price;
    } else if (pkg.category === "sub_child") {
      const numMonths = parseInt(months, 10);
      if (numMonths <= 5) {
        pricePaid = pkg.pricePerMonth * numMonths;
      } else {
        // 6+ months gets 5-month price (discount)
        pricePaid = pkg.pricePerMonth * 5;
      }
    }

    // Validate price is a valid number
    if (!pricePaid || isNaN(pricePaid) || pricePaid <= 0) {
      console.error("Price calculation error:", {
        category: pkg.category,
        months,
        pricePerMonth: pkg.pricePerMonth,
        price: pkg.price,
        calculatedPrice: pricePaid,
      });
      throw new Error("خطأ في حساب السعر - تأكد من بيانات الباقة");
    }

    console.log(
      "Calculated pricePaid:",
      pricePaid,
      "months:",
      months,
      "pricePerMonth:",
      pkg.pricePerMonth,
    );

    console.log(`=== ADD SUB MEMBER ===`);
    console.log(`Package: ${pkg.name}, Category: ${pkg.category}`);
    console.log(`Months: ${months}, Price: ${pricePaid}`);
    console.log(`====================`);

    // 8. Create Member
    const member = new Member({
      accountId: accountId,
      ...memberData,
      phone: sanitize(memberData.phone),
      email: sanitize(memberData.email),
      nationalId: sanitize(memberData.nationalId),
      role: pkg.category === "sub_child" ? "child" : "partner",
      guardianAccountId: accountId,
    });
    await member.save();

    // 9. Create Subscription
    const sub = new Subscription({
      memberId: member._id,
      accountId: accountId,
      packageId: packageId,
      parentSubscriptionId: primarySubscription._id,
      type: pkg.category === "sub_child" ? "academy" : "gym",
      sport: pkg.sport || null,
      startDate: subStartDate,
      endDate: subEndDate,
      pricePaid: parseFloat(pricePaid),
      status: "active",
      createdBy: userId,
    });
    await sub.save();

    // 10. Create Payment
    if (isNaN(pricePaid)) {
      throw new Error("خطأ: السعر المحسوب غير صحيح - لا يمكن إنشاء سجل الدفع");
    }
    const payment = new Payment({
      subscriptionId: sub._id,
      memberId: member._id,
      amount: pricePaid,
      method: paymentData.method || "cash",
      type: "new",
      paidAt: new Date(paymentData.paidAt || new Date()),
      createdBy: userId,
    });
    await payment.save();

    // 11. Create AuditLog
    const auditLog = new AuditLog({
      action: "add_sub_member",
      subscriptionId: sub._id,
      performedBy: userId,
      before: null,
      after: sub.toObject(),
      notes: `إضافة عضو فرعي - ${pkg.category === "sub_child" ? "طفل" : "بالغ"}`,
    });
    await auditLog.save();

    return {
      subscription: sub,
      member,
      account,
      payment,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNewSubscription,
  createFriendsSubscription,
  createFamilySubscription,
  renewSubscription,
  createAcademyOnlySubscription,
  addSubMemberToFamily,
};
