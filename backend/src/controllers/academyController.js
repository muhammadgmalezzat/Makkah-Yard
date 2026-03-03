const Member = require("../models/Member");
const AcademySubscription = require("../models/AcademySubscription");
const {
  createAcademySubscription,
  changeSport,
  changeGroup,
  addSportToChild,
} = require("../services/academyService");

// POST /api/academy/subscriptions - create new academy subscription
const createSubscriptionCtrl = async (req, res, next) => {
  try {
    const {
      childData,
      sportId,
      groupId,
      memberType,
      parentSubscriptionId,
      durationMonths,
      startDate,
      paymentData,
    } = req.body;

    // Validate required fields
    if (!childData || !childData.fullName) {
      return res.status(400).json({ message: "الاسم الكامل للطفل مطلوب" });
    }
    if (!childData.gender) {
      return res.status(400).json({ message: "نوع الطفل مطلوب" });
    }
    if (!childData.dateOfBirth) {
      return res.status(400).json({ message: "تاريخ ميلاد الطفل مطلوب" });
    }
    if (!sportId) {
      return res.status(400).json({ message: "الرياضة مطلوبة" });
    }
    if (!groupId) {
      return res.status(400).json({ message: "المجموعة مطلوبة" });
    }
    if (!memberType) {
      return res.status(400).json({ message: "نوع العضوية مطلوب" });
    }
    if (!durationMonths) {
      return res.status(400).json({ message: "المدة مطلوبة" });
    }
    if (!startDate) {
      return res.status(400).json({ message: "تاريخ البداية مطلوب" });
    }
    if (!paymentData || !paymentData.amount) {
      return res.status(400).json({ message: "بيانات الدفع غير صحيحة" });
    }

    const result = await createAcademySubscription({
      childData,
      sportId,
      groupId,
      memberType,
      parentSubscriptionId:
        memberType === "linked" ? parentSubscriptionId : null,
      durationMonths: parseInt(durationMonths),
      startDate,
      paymentData,
      userId: req.user._id,
    });

    res.status(201).json({
      message: "تم إنشاء الاشتراك بنجاح",
      subscription: result.subscription,
      child: result.child,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/academy/subscriptions - list academy subscriptions with filters
const listSubscriptionsCtrl = async (req, res, next) => {
  try {
    const { status, sportId, groupId, gender, expiringInDays } = req.query;
    const query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }
    if (sportId) {
      query.sportId = sportId;
    }
    if (groupId) {
      query.groupId = groupId;
    }

    // Expiring in -  days filter
    if (expiringInDays) {
      const today = new Date();
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + parseInt(expiringInDays));

      query.endDate = {
        $gte: today,
        $lte: expiryDate,
      };
    }

    // Fetch subscriptions and populate references
    let subscriptions = await AcademySubscription.find(query)
      .populate("memberId", "fullName phone dateOfBirth gender")
      .populate("sportId", "name gender")
      .populate("groupId", "name schedule maxCapacity currentCount")
      .sort({ createdAt: -1 });

    // Apply gender filter if needed (filter by member's gender, not sport)
    if (gender) {
      subscriptions = subscriptions.filter(
        (sub) => sub.memberId && sub.memberId.gender === gender,
      );
    }

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// GET /api/academy/members/:memberId/profile - get child profile with all subscriptions
const getChildProfileCtrl = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    // Get member info
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: "الطفل غير موجود" });
    }

    // Get all academy subscriptions for this member
    const subscriptions = await AcademySubscription.find({
      memberId: memberId,
    })
      .populate("sportId", "name nameEn")
      .populate("groupId", "name schedule")
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalPaid = subscriptions.reduce(
      (sum, sub) => sum + (sub.pricePaid || 0),
      0,
    );
    const activeCount = subscriptions.filter(
      (sub) => sub.status === "active",
    ).length;

    // Calculate age from dateOfBirth
    const calculateAge = (dob) => {
      if (!dob) return null;
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < dob.getDate())
      ) {
        age--;
      }
      return age;
    };

    res.json({
      member: {
        _id: member._id,
        fullName: member.fullName,
        gender: member.gender,
        dateOfBirth: member.dateOfBirth,
        age: calculateAge(member.dateOfBirth),
        phone: member.phone,
        guardianName: member.guardianName,
        guardianPhone: member.guardianPhone,
      },
      subscriptions: subscriptions.map((sub) => ({
        _id: sub._id,
        sport: {
          _id: sub.sportId?._id,
          name: sub.sportId?.name,
          nameEn: sub.sportId?.nameEn,
        },
        group: {
          _id: sub.groupId?._id,
          name: sub.groupId?.name,
          schedule: sub.groupId?.schedule,
        },
        status: sub.status,
        startDate: sub.startDate,
        endDate: sub.endDate,
        durationMonths: sub.durationMonths,
        pricePaid: sub.pricePaid,
        paymentMethod: sub.paymentMethod,
        memberType: sub.memberType,
        renewalCount: sub.renewalCount,
      })),
      totalPaid,
      activeCount,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/academy/subscriptions/:id/change-sport - change child's sport
const changeSportCtrl = async (req, res, next) => {
  try {
    const { id: academySubscriptionId } = req.params;
    const { newSportId, newGroupId } = req.body;

    if (!newSportId || !newGroupId) {
      return res
        .status(400)
        .json({ message: "الرياضة والمجموعة الجديدة مطلوبة" });
    }

    const result = await changeSport({
      academySubscriptionId,
      newSportId,
      newGroupId,
      userId: req.user._id,
    });

    res.json({
      message: "تم تغيير الرياضة بنجاح",
      oldSubscription: result.oldSubscription,
      newSubscription: result.newSubscription,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/academy/subscriptions/:id/change-group - change child's group (same sport)
const changeGroupCtrl = async (req, res, next) => {
  try {
    const { id: academySubscriptionId } = req.params;
    const { newGroupId } = req.body;

    if (!newGroupId) {
      return res.status(400).json({ message: "المجموعة الجديدة مطلوبة" });
    }

    const result = await changeGroup({
      academySubscriptionId,
      newGroupId,
      userId: req.user._id,
    });

    res.json({
      message: "تم تغيير المجموعة بنجاح",
      subscription: result.subscription,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/academy/members/:memberId/add-sport - add new sport to existing child
const addSportCtrl = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const {
      sportId,
      groupId,
      durationMonths,
      startDate,
      paymentData,
      memberType,
      parentSubscriptionId,
    } = req.body;

    // Validate required fields
    if (!sportId) {
      return res.status(400).json({ message: "الرياضة مطلوبة" });
    }
    if (!groupId) {
      return res.status(400).json({ message: "المجموعة مطلوبة" });
    }
    if (!durationMonths) {
      return res.status(400).json({ message: "المدة مطلوبة" });
    }
    if (!startDate) {
      return res.status(400).json({ message: "تاريخ البداية مطلوب" });
    }
    if (!paymentData || !paymentData.amount) {
      return res.status(400).json({ message: "بيانات الدفع غير صحيحة" });
    }
    if (!memberType) {
      return res.status(400).json({ message: "نوع العضوية مطلوب" });
    }

    const result = await addSportToChild({
      memberId,
      sportId,
      groupId,
      durationMonths: parseInt(durationMonths),
      startDate,
      paymentData,
      memberType,
      parentSubscriptionId:
        memberType === "linked" ? parentSubscriptionId : null,
      userId: req.user._id,
    });

    res.status(201).json({
      message: "تم إضافة الرياضة بنجاح",
      subscription: result.subscription,
      payment: result.payment,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/academy/subscriptions/expiring - list expiring subscriptions
const expiringSubscriptionsCtrl = async (req, res, next) => {
  try {
    const { days = 5, sportId, gender, groupId } = req.query;

    const query = {
      status: "active",
    };

    // Calculate date range: today to today + days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + parseInt(days));

    query.endDate = {
      $gte: today,
      $lte: expiryDate,
    };

    if (sportId) {
      query.sportId = sportId;
    }
    if (groupId) {
      query.groupId = groupId;
    }

    let subscriptions = await AcademySubscription.find(query)
      .populate("memberId", "fullName phone guardianPhone dateOfBirth gender")
      .populate("sportId", "name")
      .populate("groupId", "name schedule")
      .sort({ endDate: 1 });

    // Apply gender filter if provided
    if (gender) {
      subscriptions = subscriptions.filter(
        (sub) => sub.memberId?.gender === gender,
      );
    }

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// GET /api/academy/subscriptions/active-today - list today's active members for coach
const activeTodayCtrl = async (req, res, next) => {
  try {
    const { sportId, groupId } = req.query;

    if (!sportId) {
      return res
        .status(400)
        .json({ message: "معرف الرياضة مطلوب للحصول على قائمة المدرب" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      sportId,
      status: "active",
      startDate: { $lte: today },
      endDate: { $gte: today },
    };

    if (groupId) {
      query.groupId = groupId;
    }

    const subscriptions = await AcademySubscription.find(query)
      .populate("memberId", "fullName phone")
      .populate("groupId", "name schedule")
      .sort({ "groupId.name": 1, "memberId.fullName": 1 });

    res.json(subscriptions);
  } catch (error) {
    next(error);
  }
};

// GET /api/academy/dashboard - analytics dashboard
const dashboardCtrl = async (req, res, next) => {
  try {
    // 1. Total active children (unique members with active academy subscriptions)
    const activeSubscriptions = await AcademySubscription.find({
      status: "active",
    }).distinct("memberId");
    const totalChildren = activeSubscriptions.length;

    // 2. Count by sport
    const bySportAgg = await AcademySubscription.aggregate([
      { $match: { status: "active" } },
      { $group: { _id: "$sportId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const bySport = await Promise.all(
      bySportAgg.map(async (item) => {
        const sport = await require("../models/Sport").findById(item._id);
        return {
          sportName: sport?.name || "Unknown",
          count: item.count,
        };
      }),
    );

    // 3. Count by gender
    const byGenderRaw = await Member.aggregate([
      {
        $group: {
          _id: "$gender",
          count: { $sum: 1 },
        },
      },
    ]);

    const byGender = { male: 0, female: 0 };
    byGenderRaw.forEach((item) => {
      if (item._id === "male") byGender.male = item.count;
      if (item._id === "female") byGender.female = item.count;
    });

    // 4. Count by group with capacity info
    const groups = await require("../models/AcademyGroup")
      .find({ isActive: true })
      .populate("sportId", "name");

    const byGroup = await Promise.all(
      groups.map(async (group) => {
        const count = await AcademySubscription.countDocuments({
          groupId: group._id,
          status: "active",
        });
        return {
          groupName: group.name,
          sportName: group.sportId?.name || "Unknown",
          count,
          maxCapacity: group.maxCapacity,
          isFull: count >= group.maxCapacity,
        };
      }),
    );

    // 5. Expiring this week (7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const expiringThisWeek = await AcademySubscription.countDocuments({
      status: "active",
      endDate: { $gte: today, $lte: nextWeek },
    });

    // 6. Monthly revenue (this month only)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();

    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

    const monthlyRevenueAgg = await AcademySubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$pricePaid" },
        },
      },
    ]);

    const monthlyRevenue =
      monthlyRevenueAgg.length > 0 ? monthlyRevenueAgg[0].total : 0;

    // 7. Revenue by month (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const revenueByMonthAgg = await AcademySubscription.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          total: { $sum: "$pricePaid" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const revenueByMonth = revenueByMonthAgg.map((item) => ({
      month: new Date(item._id.year, item._id.month - 1).toLocaleDateString(
        "ar-SA",
        { month: "short", year: "numeric" },
      ),
      revenue: item.total,
    }));

    // 8. Total full groups
    const fullGroups = byGroup.filter((g) => g.isFull).length;

    res.json({
      totalChildren,
      bySport,
      byGender,
      byGroup,
      expiringThisWeek,
      monthlyRevenue,
      revenueByMonth,
      fullGroups,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSubscriptionCtrl,
  listSubscriptionsCtrl,
  getChildProfileCtrl,
  changeSportCtrl,
  changeGroupCtrl,
  addSportCtrl,
  expiringSubscriptionsCtrl,
  activeTodayCtrl,
  dashboardCtrl,
};
