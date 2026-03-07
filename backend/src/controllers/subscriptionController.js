const Subscription = require("../models/Subscription");
const Member = require("../models/Member");
const Package = require("../models/Package");
const {
  createNewSubscription,
  createFriendsSubscription,
  createFamilySubscription,
  renewSubscription,
  createAcademyOnlySubscription,
  addSubMemberToFamily,
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

    if (!q || q.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "ادخل اسم أو رقم هاتف",
      });
    }

    // Search members by name or phone
    const members = await Member.find({
      $or: [
        { fullName: { $regex: q.trim(), $options: "i" } },
        { phone: { $regex: q.trim(), $options: "i" } },
      ],
      isActive: true,
    }).limit(20);

    console.log("Members found:", members.length);

    const AcademySubscription = require("../models/AcademySubscription");

    // Get subscriptions for each member
    const results = await Promise.all(
      members.map(async (member) => {
        // Check regular subscription first
        const lastSub = await Subscription.findOne({ memberId: member._id })
          .sort({ createdAt: -1 })
          .populate("packageId", "name category durationMonths price");

        // Check academy subscription if no regular sub found
        const lastAcademySub = await AcademySubscription.findOne({
          memberId: member._id,
        })
          .sort({ createdAt: -1 })
          .populate("sportId", "name nameEn")
          .populate("groupId", "name schedule");

        return {
          member,
          lastSubscription: lastSub || null,
          lastAcademySubscription: lastAcademySub || null,
          subscriptionType: lastSub ? "gym" : lastAcademySub ? "academy" : null,
        };
      })
    );

    console.log("Results:", results.length);

    res.json({
      success: true,
      count: results.length,
      data: results,
    });
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
    const { childData, sport, months, startDate, paymentMethod, paymentDate } =
      req.body;

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

const addSubMemberHandler = async (req, res, next) => {
  try {
    const {
      accountId,
      memberData,
      packageId,
      months,
      startDate,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (!accountId) {
      return res.status(400).json({ message: "معرف الحساب مطلوب" });
    }
    if (!memberData || !memberData.fullName) {
      return res.status(400).json({ message: "الاسم الكامل مطلوب" });
    }
    if (!memberData.gender) {
      return res.status(400).json({ message: "النوع مطلوب" });
    }
    if (!packageId) {
      return res.status(400).json({ message: "الباقة مطلوبة" });
    }
    if (!startDate) {
      return res.status(400).json({ message: "تاريخ البداية مطلوب" });
    }

    // Get package to check category
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "الباقة غير موجودة" });
    }

    // Validate months for sub_child
    if (pkg.category === "sub_child" && !months) {
      return res.status(400).json({ message: "عدد الأشهر مطلوب" });
    }

    const result = await addSubMemberToFamily({
      accountId,
      memberData,
      packageId,
      months,
      startDate,
      paymentData: {
        method: paymentMethod || "cash",
      },
      userId: req.user._id,
    });

    res.status(201).json({
      message: "تم إضافة العضو الفرعي بنجاح",
      subscription: result.subscription,
      member: result.member,
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
  addSubMemberHandler,
};
