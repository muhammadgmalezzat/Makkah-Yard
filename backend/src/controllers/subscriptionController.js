const Subscription = require("../models/Subscription");
const Member = require("../models/Member");
const Package = require("../models/Package");
const {
  createNewSubscription,
  renewSubscription,
} = require("../services/subscriptionService");

const createSubscription = async (req, res, next) => {
  try {
    const { memberData, packageId, startDate, paymentMethod, paymentDate } =
      req.body;

    // Validate package exists
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ message: "الحزمة غير موجودة" });
    }

    // Create subscription using transaction
    const result = await createNewSubscription({
      memberData,
      packageData: pkg,
      paymentData: {
        startDate,
        method: paymentMethod,
        paidAt: paymentDate,
      },
      userId: req.user._id,
    });

    res.status(201).json({
      message: "تم إنشاء الاشتراك بنجاح",
      subscription: result.subscription,
      member: result.member,
    });
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

    // Renew subscription using transaction
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

module.exports = {
  createSubscription,
  renewSubscriptionCtrl,
  searchSubscriptions,
  getSubscriptionDetails,
};
