const Subscription = require("../models/Subscription");
const Member = require("../models/Member");
const Package = require("../models/Package");
const {
  createNewSubscription,
  createFriendsSubscription,
  createFamilySubscription,
  renewSubscription,
  createAcademyOnlySubscription,
} = require("../services/subscriptionService");

const createSubscription = async (req, res, next) => {
  try {
    const {
      accountType,
      memberData,
      primaryData,
      partnerData,
      packageId,
      startDate,
      paymentMethod,
      paymentDate,
    } = req.body;

    // Validate package exists
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "الحزمة غير موجودة" });
    }

    let result;

    // Route based on account type
    if (accountType === "individual") {
      result = await createNewSubscription({
        memberData,
        packageData: pkg,
        paymentData: {
          startDate,
          method: paymentMethod,
          paidAt: paymentDate,
        },
        userId: req.user._id,
      });

      return res.status(201).json({
        message: "تم إنشاء الاشتراك بنجاح",
        subscription: result.subscription,
        member: result.member,
      });
    } else if (accountType === "friends") {
      if (!primaryData || !partnerData) {
        return res.status(400).json({
          message: "يجب إدخال بيانات الشخص الأول والثاني",
        });
      }

      result = await createFriendsSubscription({
        primaryData,
        partnerData,
        packageData: pkg,
        paymentData: {
          startDate,
          method: paymentMethod,
          paidAt: paymentDate,
        },
        userId: req.user._id,
      });

      return res.status(201).json({
        message: "تم إنشاء الاشتراك بنجاح",
        subscription: result.subscription,
        primaryMember: result.primaryMember,
        partnerMember: result.partnerMember,
      });
    } else if (accountType === "family") {
      if (!primaryData) {
        return res.status(400).json({
          message: "يجب إدخال بيانات العضو الأساسي",
        });
      }

      result = await createFamilySubscription({
        primaryData,
        partnerData: partnerData || null,
        packageData: pkg,
        paymentData: {
          startDate,
          method: paymentMethod,
          paidAt: paymentDate,
        },
        userId: req.user._id,
      });

      return res.status(201).json({
        message: "تم إنشاء الاشتراك بنجاح",
        subscription: result.primarySubscription,
        primaryMember: result.primaryMember,
        partnerMember: result.partnerMember,
      });
    } else {
      return res.status(400).json({
        message: "نوع الحساب غير صحيح",
      });
    }
  } catch (error) {
    next(error);
  }
};

const renewSubscriptionCtrl = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;
    const { packageId, startDate, paymentMethod, paymentDate } = req.body;

    // Validate package exists
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "الحزمة غير موجودة" });
    }

    // Renew subscription
    const result = await renewSubscription({
      subscriptionId,
      packageData: pkg,
      paymentData: {
        startDate,
        method: paymentMethod,
        paidAt: paymentDate,
      },
      userId: req.user._id,
    });

    res.json({
      message: "تم تجديد الاشتراك بنجاح",
      subscription: result.subscription,
    });
  } catch (error) {
    next(error);
  }
};

const searchSubscriptions = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json([]);
    }

    // Search members by name or phone
    const members = await Member.find({
      $or: [
        { fullName: { $regex: q, $options: "i" } },
        { phone: { $regex: q, $options: "i" } },
      ],
    });

    // Get subscriptions for these members
    const memberIds = members.map((m) => m._id);
    const subscriptions = await Subscription.find({
      memberId: { $in: memberIds },
    })
      .populate("memberId", "fullName phone")
      .populate("packageId", "name price durationMonths")
      .sort({ createdAt: -1 })
      .limit(20);

    // Format results
    const results = subscriptions.map((sub) => ({
      id: sub._id,
      memberName: sub.memberId.fullName,
      phone: sub.memberId.phone,
      packageName: sub.packageId.name,
      status: sub.status,
      endDate: sub.endDate,
      subscriptionId: sub._id,
    }));

    res.json(results);
  } catch (error) {
    next(error);
  }
};

const getSubscriptionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id)
      .populate("memberId")
      .populate("packageId")
      .populate("accountId")
      .populate("createdBy", "name");

    if (!subscription) {
      return res.status(404).json({ message: "الاشتراك غير موجود" });
    }

    res.json(subscription);
  } catch (error) {
    next(error);
  }
};

const newAcademyOnlySubscription = async (req, res, next) => {
  try {
    const {
      childData,
      sport,
      months,
      startDate,
      paymentMethod,
      paymentDate,
    } = req.body;

    // Validate required fields
    if (!childData || !childData.fullName) {
      return res.status(400).json({ message: "الاسم الكامل مطلوب" });
    }
    if (!childData.gender) {
      return res.status(400).json({ message: "النوع مطلوب" });
    }
    if (!childData.dateOfBirth) {
      return res.status(400).json({ message: "تاريخ الميلاد مطلوب" });
    }
    if (!sport || !["football", "swimming", "combat"].includes(sport)) {
      return res.status(400).json({ message: "الرياضة غير صحيحة" });
    }
    if (!months || ![1, 2, 3, 4, 5, 6, 12].includes(months)) {
      return res
        .status(400)
        .json({ message: "المدة المتاحة: من 1 إلى 6 شهور أو سنة كاملة" });
    }
    if (!startDate) {
      return res.status(400).json({ message: "تاريخ البداية مطلوب" });
    }

    const result = await createAcademyOnlySubscription({
      childData,
      sport,
      months,
      paymentData: {
        startDate,
        method: paymentMethod || "cash",
        paidAt: paymentDate,
      },
      userId: req.user._id,
    });

    res.status(201).json({
      message: "تم إنشاء اشتراك الأكاديمية بنجاح",
      subscription: result.subscription,
      child: result.child,
      account: result.account,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscription,
  renewSubscriptionCtrl,
  searchSubscriptions,
  getSubscriptionDetails,
  newAcademyOnlySubscription,
};
