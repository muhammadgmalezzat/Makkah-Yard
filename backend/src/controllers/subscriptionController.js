const Subscription = require("../models/Subscription");
const Member = require("../models/Member");
const Package = require("../models/Package");
const Account = require("../models/Account");
const Payment = require("../models/Payment");
const AcademySubscription = require("../models/AcademySubscription");
const AcademyGroup = require("../models/AcademyGroup");
const AuditLog = require("../models/AuditLog");
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
          accountId: member.accountId,
          lastSubscription: lastSub || null,
          lastAcademySubscription: lastAcademySub || null,
          subscriptionType: lastSub ? "gym" : lastAcademySub ? "academy" : null,
        };
      }),
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

const getAccountProfile = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    // Get account
    const account = await Account.findById(accountId);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "الحساب غير موجود" });
    }

    // Get ALL members in this account
    const members = await Member.find({ accountId }).sort({ role: 1 });

    // Get subscriptions for each member
    const membersWithSubs = await Promise.all(
      members.map(async (member) => {
        const gymSub = await Subscription.findOne({ memberId: member._id })
          .sort({ createdAt: -1 })
          .populate("packageId", "name category durationMonths price");

        const academySubs = await AcademySubscription.find({
          memberId: member._id,
        })
          .populate("sportId", "name nameEn")
          .populate("groupId", "name schedule")
          .sort({ createdAt: -1 });

        return {
          member,
          gymSubscription: gymSub || null,
          academySubscriptions: academySubs || [],
        };
      }),
    );

    // Get total payments for this account (excluding partner members)
    const memberIds = members.map((m) => m._id);
    const payments = await Payment.find({ memberId: { $in: memberIds } })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name");

    const partnerIds = members
      .filter((m) => m.role === "partner")
      .map((m) => m._id.toString());

    // Exclude partner payments from total
    const relevantPayments = payments.filter(
      (p) => !partnerIds.includes(p.memberId.toString()),
    );

    const totalPaid = relevantPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0,
    );

    // Get primary member's active subscription
    const primaryMember = members.find((m) => m.role === "primary");
    const primarySub = primaryMember
      ? await Subscription.findOne({
          memberId: primaryMember._id,
          status: "active",
        }).populate("packageId", "name category durationMonths price")
      : null;

    res.json({
      success: true,
      data: {
        account,
        primarySubscription: primarySub,
        members: membersWithSubs,
        payments: relevantPayments,
        totalPaid,
        stats: {
          totalMembers: members.length,
          activeMembers: members.filter((m) => m.isActive).length,
          totalPayments: relevantPayments.length,
          totalPaid,
          lastPaymentDate: relevantPayments[0]?.paidAt || null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const { startDate, endDate, status, pricePaid } = req.body;
    const sub = await Subscription.findByIdAndUpdate(
      req.params.id,
      { $set: { startDate, endDate, status, pricePaid } },
      { new: true, runValidators: true },
    );
    if (!sub) {
      return res
        .status(404)
        .json({ success: false, message: "الاشتراك غير موجود" });
    }
    res.json({ success: true, message: "تم تحديث الاشتراك", data: sub });
  } catch (error) {
    next(error);
  }
};

const getMembersDirectory = async (req, res, next) => {
  try {
    const {
      q, // search query
      packageType, // all, individual, friends, family, academy_only
      startDate, // filter by subscription start date
      endDate, // filter by subscription end date
      activeOnly, // true/false
      gender, // male, female, all
      limit = 500, // high default to get all results, frontend handles pagination
    } = req.query;

    console.log("packageType filter:", packageType);

    // Step 1: Filter accounts by type
    let accountFilter = {};
    if (packageType && packageType !== "all") {
      accountFilter.type = packageType;
    }
    const filteredAccounts = await Account.find(accountFilter).distinct("_id");
    console.log("filteredAccounts count:", filteredAccounts.length);

    // Step 2: Find ALL primary members matching filters (for counting)
    let memberFilter = {
      // role: "primary",
      isActive: true,
      accountId: { $in: filteredAccounts },
    };
    if (gender && gender !== "all") memberFilter.gender = gender;
    if (q && q.trim()) {
      memberFilter.role = {
        $in: ["primary", "partner", "sub_adult", "child"],
      };

      memberFilter.$or = [
        { fullName: { $regex: q.trim(), $options: "i" } },
        { phone: { $regex: q.trim(), $options: "i" } },
        { email: { $regex: q.trim(), $options: "i" } },
      ];
    } else {
      memberFilter.role = "primary";
    }

    // Get total count of primary members BEFORE pagination
    const totalPrimaryMembers = await Member.countDocuments(memberFilter);

    // Fetch ALL primary members (no pagination limit yet - will paginate after filtering)
    const primaryMembers = await Member.find(memberFilter).lean();

    console.log(
      "primaryMembers found:",
      primaryMembers.length,
      "total:",
      totalPrimaryMembers,
    );

    // Step 3: Academy children (only when packageType is all or academy_only)
    let academyMembers = [];
    let totalAcademyMembers = 0;
    if (
      !q?.trim() &&
      (!packageType || packageType === "all" || packageType === "academy_only")
    ) {
      const academyAccountIds = await Account.find({
        type: "academy_only",
      }).distinct("_id");
      let childFilter = {
        role: "child",
        isActive: true,
        accountId: { $in: academyAccountIds },
      };
      if (gender && gender !== "all") childFilter.gender = gender;
      if (q && q.trim()) {
        childFilter.$or = [
          { fullName: { $regex: q.trim(), $options: "i" } },
          { phone: { $regex: q.trim(), $options: "i" } },
        ];
      }
      totalAcademyMembers = await Member.countDocuments(childFilter);
      // Fetch ALL academy members (no pagination limit yet - will paginate after filtering)
      academyMembers = await Member.find(childFilter).lean();
    }

    const totalCount = totalPrimaryMembers + totalAcademyMembers;

    // Step 4: Combine all members
    const allMembers = [...primaryMembers, ...academyMembers];

    // Step 5: Bulk fetch all accounts at once (eliminate N+1 query)
    const allAccountIds = allMembers.map((m) => m.accountId.toString());
    const allAccounts = await Account.find({
      _id: { $in: allAccountIds },
    }).lean();
    const accountMap = {};
    allAccounts.forEach((acc) => {
      accountMap[acc._id.toString()] = acc;
    });

    // Step 6: Bulk fetch all gym subscriptions at once (eliminate N+1 query)
    const allMemberIds = allMembers.map((m) => m._id);
    const allGymSubs = await Subscription.find({
      memberId: { $in: allMemberIds },
    })
      .sort({ createdAt: -1 })
      .populate("packageId", "name category durationMonths")
      .lean();

    const gymSubMap = {};
    allGymSubs.forEach((sub) => {
      const key = sub.memberId.toString();
      if (!gymSubMap[key]) gymSubMap[key] = sub;
    });

    // Step 7: Bulk fetch all academy subscriptions at once (eliminate N+1 query)
    const allAcademySubs = await AcademySubscription.find({
      memberId: { $in: allMemberIds },
    })
      .populate("sportId", "name")
      .populate("groupId", "name")
      .sort({ createdAt: -1 })
      .lean();

    const academySubMap = {};
    allAcademySubs.forEach((sub) => {
      const key = sub.memberId.toString();
      if (!academySubMap[key]) academySubMap[key] = [];
      academySubMap[key].push(sub);
    });

    // Step 8: Filter members and build results array
    const filteredResults = [];
    for (const member of allMembers) {
      const account = accountMap[member.accountId.toString()];
      const gymSub = gymSubMap[member._id.toString()] || null;
      const academySubs = academySubMap[member._id.toString()] || [];

      // Apply activeOnly filter
      if (activeOnly === "true") {
        const hasActiveGym = gymSub?.status === "active";
        const hasActiveAcademy = academySubs.some((s) => s.status === "active");
        if (!hasActiveGym && !hasActiveAcademy) continue;
      }

      // Apply date range filter on gym subscription
      if (gymSub && startDate) {
        if (new Date(gymSub.startDate) < new Date(startDate)) continue;
      }
      if (gymSub && endDate) {
        if (new Date(gymSub.endDate) > new Date(endDate)) continue;
      }

      filteredResults.push({
        member,
        account: account || null,
        gymSubscription: gymSub,
        academySubscriptions: academySubs,
        accountId: member.accountId,
      });
    }

    // Step 9: Calculate total AFTER all filters applied
    const total = filteredResults.length;

    // Step 10: Apply pagination
    const page = parseInt(req.query.page) || 1;
    const pageLimit = parseInt(req.query.limit) || 50;
    const totalPages = Math.ceil(total / pageLimit);
    const startIndex = (page - 1) * pageLimit;
    const pageData = filteredResults.slice(startIndex, startIndex + pageLimit);

    res.json({
      success: true,
      count: pageData.length,
      total: total,
      totalPages: totalPages,
      currentPage: page,
      data: pageData,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;

    const member = await Member.findById(memberId);
    if (!member) {
      return res
        .status(404)
        .json({ success: false, message: "العضو غير موجود" });
    }

    // If primary → delete entire account
    if (member.role === "primary") {
      const accountId = member.accountId;
      const allMembers = await Member.find({ accountId });
      const allMemberIds = allMembers.map((m) => m._id);

      console.log("Deleting account (primary member):", accountId);
      console.log("Members to delete:", allMemberIds.length);

      // Delete all related data in order
      await Payment.deleteMany({ memberId: { $in: allMemberIds } });
      await AuditLog.deleteMany({ accountId });
      await Subscription.deleteMany({ memberId: { $in: allMemberIds } });

      const academySubs = await AcademySubscription.find({
        memberId: { $in: allMemberIds },
      });
      for (const sub of academySubs) {
        await AcademyGroup.findByIdAndUpdate(
          sub.groupId,
          { $inc: { currentCount: -1 } },
          { new: true },
        );
      }
      await AcademySubscription.deleteMany({
        memberId: { $in: allMemberIds },
      });

      await Member.deleteMany({ accountId });
      await Account.findByIdAndDelete(accountId);

      console.log("Account deleted successfully:", accountId);

      return res.json({
        success: true,
        message: "تم حذف الحساب وجميع البيانات المرتبطة به",
        deletedType: "account",
        deleted: {
          membersCount: allMemberIds.length,
        },
      });
    }

    // If not primary → delete only this member + their data
    console.log("Deleting member:", memberId);

    await Payment.deleteMany({ memberId: member._id });
    await Subscription.deleteMany({ memberId: member._id });

    const academySubs = await AcademySubscription.find({
      memberId: member._id,
    });
    for (const sub of academySubs) {
      await AcademyGroup.findByIdAndUpdate(
        sub.groupId,
        { $inc: { currentCount: -1 } },
        { new: true },
      );
    }
    await AcademySubscription.deleteMany({ memberId: member._id });
    await Member.findByIdAndDelete(member._id);

    console.log("Member deleted successfully:", memberId);

    return res.json({
      success: true,
      message: "تم حذف العضو وبياناته",
      deletedType: "member",
    });
  } catch (error) {
    next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const { accountId } = req.params;

    const account = await Account.findById(accountId);
    if (!account) {
      return res
        .status(404)
        .json({ success: false, message: "الحساب غير موجود" });
    }

    // Find all members in this account
    const members = await Member.find({ accountId });
    const memberIds = members.map((m) => m._id);

    console.log("Deleting account:", accountId);
    console.log("Members to delete:", memberIds.length);

    // Delete all related data in order
    // 1. Payments
    await Payment.deleteMany({ memberId: { $in: memberIds } });

    // 2. AuditLogs
    await AuditLog.deleteMany({ accountId });

    // 3. Gym Subscriptions
    await Subscription.deleteMany({ memberId: { $in: memberIds } });

    // 4. Academy Subscriptions - update group counts
    const academySubs = await AcademySubscription.find({
      memberId: { $in: memberIds },
    });
    for (const sub of academySubs) {
      await AcademyGroup.findByIdAndUpdate(
        sub.groupId,
        { $inc: { currentCount: -1 } },
        { new: true },
      );
    }
    await AcademySubscription.deleteMany({
      memberId: { $in: memberIds },
    });

    // 5. Members
    await Member.deleteMany({ accountId });

    // 6. Account
    await Account.findByIdAndDelete(accountId);

    console.log("Account deleted successfully:", accountId);

    res.json({
      success: true,
      message: "تم حذف الحساب وجميع البيانات المرتبطة به",
      deleted: {
        membersCount: memberIds.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getClubDashboard = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(today.getDate() + 7);

    // ── Active Subscriptions by Package Type ──
    const activeGymSubs = await Subscription.find({ status: "active" })
      .populate("packageId", "name category durationMonths")
      .populate("memberId", "fullName role")
      .lean();

    // Count by package category
    const byCategory = {
      individual: 0,
      friends: 0,
      family_essential: 0,
      sub_adult: 0,
      academy_only: 0,
    };
    activeGymSubs.forEach((sub) => {
      const cat = sub.packageId?.category;
      if (cat && byCategory[cat] !== undefined) byCategory[cat]++;
    });

    // Count by duration
    const byDuration = { 1: 0, 3: 0, 6: 0, 12: 0, 24: 0 };
    activeGymSubs.forEach((sub) => {
      const d = sub.packageId?.durationMonths;
      if (d && byDuration[d] !== undefined) byDuration[d]++;
    });

    // ── Total Active Members ──
    const totalActiveMembers = await Member.countDocuments({ isActive: true });
    const activeMaleMembers = await Member.countDocuments({
      isActive: true,
      gender: "male",
    });
    const activeFemaleMembers = await Member.countDocuments({
      isActive: true,
      gender: "female",
    });

    // ── Active Accounts by Type ──
    const activeAccounts = await Account.countDocuments({ status: "active" });
    const individualAccounts = await Account.countDocuments({
      type: "individual",
      status: "active",
    });
    const friendsAccounts = await Account.countDocuments({
      type: "friends",
      status: "active",
    });
    const familyAccounts = await Account.countDocuments({
      type: "family",
      status: "active",
    });
    const academyAccounts = await Account.countDocuments({
      type: "academy_only",
      status: "active",
    });

    // ── Revenue This Month ──
    const thisMonthPayments = await Payment.find({
      paidAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
    }).lean();
    const thisMonthRevenue = thisMonthPayments.reduce(
      (sum, p) => sum + p.amount,
      0,
    );

    // ── Expiring Soon ──
    const expiringThisWeek = await Subscription.countDocuments({
      status: "active",
      endDate: { $gte: today, $lte: weekFromNow },
    });
    const expiringThisMonth = await Subscription.countDocuments({
      status: "active",
      endDate: { $gte: today, $lte: thisMonthEnd },
    });

    // Expiring subscriptions details
    const expiringSubs = await Subscription.find({
      status: "active",
      endDate: { $gte: today, $lte: weekFromNow },
    })
      .populate("memberId", "fullName phone")
      .populate("packageId", "name category")
      .sort({ endDate: 1 })
      .limit(20)
      .lean();

    // ── New Subscriptions This Month ──
    const newThisMonth = await Subscription.countDocuments({
      createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
    });

    // ── Expired Accounts ──
    const expiredAccounts = await Account.countDocuments({ status: "expired" });

    // ── Frozen Accounts ──
    const frozenAccounts = await Account.countDocuments({ status: "frozen" });

    // ── Academy Stats ──
    const academyActiveSubs = await AcademySubscription.find({
      status: "active",
    })
      .populate("sportId", "name nameEn")
      .populate("groupId", "name maxCapacity currentCount")
      .populate("memberId", "fullName gender")
      .lean();

    const activeAcademyChildren = new Set(
      academyActiveSubs.map((s) => s.memberId?._id?.toString()),
    ).size;

    // Sport distribution
    const sportDistribution = {};
    academyActiveSubs.forEach((sub) => {
      const sport = sub.sportId?.name || "أخرى";
      sportDistribution[sport] = (sportDistribution[sport] || 0) + 1;
    });

    // Gender distribution academy
    let academyBoys = 0,
      academyGirls = 0;
    academyActiveSubs.forEach((sub) => {
      if (sub.memberId?.gender === "male") academyBoys++;
      else academyGirls++;
    });

    // Groups fill rate
    const allGroups = await AcademyGroup.find({ isActive: true })
      .populate("sportId", "name")
      .lean();

    const groupStats = allGroups.map((g) => ({
      name: g.name,
      sport: g.sportId?.name || "غير محدد",
      currentCount: g.currentCount,
      maxCapacity: g.maxCapacity,
      fillRate:
        g.maxCapacity > 0
          ? Math.round((g.currentCount / g.maxCapacity) * 100)
          : 0,
      isFull: g.currentCount >= g.maxCapacity,
    }));

    const fullGroups = groupStats.filter((g) => g.isFull).length;

    // Academy revenue this month
    const academyRevenueThisMonth = await Payment.aggregate([
      { $match: { paidAt: { $gte: thisMonthStart, $lte: thisMonthEnd } } },
      {
        $lookup: {
          from: "academysubscriptions",
          localField: "subscriptionId",
          foreignField: "_id",
          as: "academySub",
        },
      },
      { $match: { "academySub.0": { $exists: true } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const academyRevenue = academyRevenueThisMonth[0]?.total || 0;

    // Expiring academy subs this week
    const expiringAcademyThisWeek = await AcademySubscription.countDocuments({
      status: "active",
      endDate: { $gte: today, $lte: weekFromNow },
    });

    res.json({
      success: true,
      data: {
        // Overall
        totalActiveMembers,
        activeMaleMembers,
        activeFemaleMembers,
        activeAccounts,
        expiredAccounts,
        frozenAccounts,
        newThisMonth,

        // By account type
        accountsByType: {
          individual: individualAccounts,
          friends: friendsAccounts,
          family: familyAccounts,
          academy: academyAccounts,
        },

        // Subscriptions by package type
        gymSubsByCategory: byCategory,
        gymSubsByDuration: byDuration,

        // Revenue
        thisMonthRevenue,
        academyRevenue,
        gymRevenue: thisMonthRevenue - academyRevenue,

        // Expiring
        expiringThisWeek,
        expiringThisMonth,
        expiringAcademyThisWeek,
        expiringSubs: expiringSubs.map((s) => ({
          memberName: s.memberId?.fullName,
          phone: s.memberId?.phone,
          packageName: s.packageId?.name,
          endDate: s.endDate,
          daysLeft: Math.ceil(
            (new Date(s.endDate) - today) / (1000 * 60 * 60 * 24),
          ),
        })),

        // Academy
        activeAcademyChildren,
        academyBoys,
        academyGirls,
        sportDistribution,
        groupStats: groupStats.sort((a, b) => b.fillRate - a.fillRate),
        fullGroups,
      },
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
  getAccountProfile,
  updateSubscription,
  getMembersDirectory,
  deleteMember,
  deleteAccount,
  getClubDashboard,
};
