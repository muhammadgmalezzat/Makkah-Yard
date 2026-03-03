const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const AcademySubscription = require("../models/AcademySubscription");
const {
  createSubscriptionCtrl,
  listSubscriptionsCtrl,
  getChildProfileCtrl,
  changeSportCtrl,
  changeGroupCtrl,
  addSportCtrl,
  expiringSubscriptionsCtrl,
  activeTodayCtrl,
  dashboardCtrl,
} = require("../controllers/academyController");

// ============ SPORTS ENDPOINTS ============

// GET /api/academy/sports - list all sports with optional gender filter
router.get("/sports", async (req, res, next) => {
  try {
    const { gender } = req.query;
    const query = { isActive: true };

    if (gender) {
      query.gender = { $in: [gender, "both"] };
    }

    const sports = await Sport.find(query).sort({ name: 1 });

    // Get group counts for each sport
    const sportsWithGroupCount = await Promise.all(
      sports.map(async (sport) => {
        const groupCount = await AcademyGroup.countDocuments({
          sportId: sport._id,
          isActive: true,
        });
        return {
          ...sport.toObject(),
          activeGroupsCount: groupCount,
        };
      }),
    );

    res.json(sportsWithGroupCount);
  } catch (error) {
    next(error);
  }
});

// GET /api/academy/sports/:id - single sport with groups
router.get("/sports/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const sport = await Sport.findById(id);
    if (!sport) {
      return res.status(404).json({ message: "الرياضة غير موجودة" });
    }

    const groups = await AcademyGroup.find({
      sportId: id,
      isActive: true,
    });

    // Get live current counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const currentCount = await AcademySubscription.countDocuments({
          groupId: group._id,
          status: "active",
        });
        return {
          ...group.toObject(),
          currentCount,
          isFull: currentCount >= group.maxCapacity,
        };
      }),
    );

    res.json({
      ...sport.toObject(),
      groups: groupsWithCounts,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/academy/sports - create sport (admin/owner only)
router.post("/sports", protect, async (req, res, next) => {
  try {
    const { name, nameEn, gender, minAge, maxAge } = req.body;

    // Check auth - only admin can create
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بإنشاء رياضة" });
    }

    // Validate required fields
    if (!name || !gender) {
      return res.status(400).json({
        message: "الاسم والنوع مطلوبان",
      });
    }

    const sport = new Sport({
      name,
      nameEn: nameEn || name,
      gender,
      minAge: minAge || 4,
      maxAge: maxAge || 14,
      isActive: true,
    });

    await sport.save();

    res.status(201).json({
      message: "تم إنشاء الرياضة بنجاح",
      sport,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/academy/sports/:id - update sport (admin/owner only)
router.put("/sports/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nameEn, gender, minAge, maxAge, isActive } = req.body;

    // Check auth
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بتحديث الرياضة" });
    }

    const sport = await Sport.findById(id);
    if (!sport) {
      return res.status(404).json({ message: "الرياضة غير موجودة" });
    }

    if (name) sport.name = name;
    if (nameEn) sport.nameEn = nameEn;
    if (gender) sport.gender = gender;
    if (minAge !== undefined) sport.minAge = minAge;
    if (maxAge !== undefined) sport.maxAge = maxAge;
    if (isActive !== undefined) sport.isActive = isActive;

    await sport.save();

    res.json({
      message: "تم تحديث الرياضة بنجاح",
      sport,
    });
  } catch (error) {
    next(error);
  }
});

// ============ GROUPS ENDPOINTS ============

// GET /api/academy/groups - list groups with optional sportId filter
router.get("/groups", async (req, res, next) => {
  try {
    const { sportId } = req.query;
    const query = { isActive: true };

    if (sportId) {
      query.sportId = sportId;
    }

    const groups = await AcademyGroup.find(query)
      .populate("sportId", "name gender minAge maxAge")
      .sort({ name: 1 });

    // Get live current counts for each group
    const groupsWithCounts = await Promise.all(
      groups.map(async (group) => {
        const currentCount = await AcademySubscription.countDocuments({
          groupId: group._id,
          status: "active",
        });
        return {
          ...group.toObject(),
          currentCount,
          isFull: currentCount >= group.maxCapacity,
        };
      }),
    );

    res.json(groupsWithCounts);
  } catch (error) {
    next(error);
  }
});

// GET /api/academy/groups/:id - single group with details
router.get("/groups/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const group = await AcademyGroup.findById(id).populate(
      "sportId",
      "name gender minAge maxAge",
    );

    if (!group) {
      return res.status(404).json({ message: "المجموعة غير موجودة" });
    }

    const currentCount = await AcademySubscription.countDocuments({
      groupId: group._id,
      status: "active",
    });

    res.json({
      ...group.toObject(),
      currentCount,
      isFull: currentCount >= group.maxCapacity,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/academy/groups - create group (admin/owner only)
router.post("/groups", protect, async (req, res, next) => {
  try {
    const { sportId, name, schedule, maxCapacity } = req.body;

    // Check auth
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بإنشاء مجموعة" });
    }

    // Validate required fields
    if (!sportId || !name || !maxCapacity) {
      return res.status(400).json({
        message: "الرياضة والاسم والسعة مطلوبة",
      });
    }

    // Verify sport exists
    const sport = await Sport.findById(sportId);
    if (!sport) {
      return res.status(404).json({ message: "الرياضة غير موجودة" });
    }

    const group = new AcademyGroup({
      sportId,
      name,
      schedule: schedule || "",
      maxCapacity,
      currentCount: 0,
      isActive: true,
    });

    await group.save();

    const populatedGroup = await group.populate(
      "sportId",
      "name gender minAge maxAge",
    );

    res.status(201).json({
      message: "تم إنشاء المجموعة بنجاح",
      group: {
        ...populatedGroup.toObject(),
        currentCount: 0,
        isFull: false,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/academy/groups/:id - update group (admin/owner only)
router.put("/groups/:id", protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, schedule, maxCapacity, isActive } = req.body;

    // Check auth
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "غير مصرح بتحديث المجموعة" });
    }

    const group = await AcademyGroup.findById(id);
    if (!group) {
      return res.status(404).json({ message: "المجموعة غير موجودة" });
    }

    if (name) group.name = name;
    if (schedule) group.schedule = schedule;
    if (maxCapacity) group.maxCapacity = maxCapacity;
    if (isActive !== undefined) group.isActive = isActive;

    await group.save();

    const populatedGroup = await group.populate(
      "sportId",
      "name gender minAge maxAge",
    );

    const currentCount = await AcademySubscription.countDocuments({
      groupId: group._id,
      status: "active",
    });

    res.json({
      message: "تم تحديث المجموعة بنجاح",
      group: {
        ...populatedGroup.toObject(),
        currentCount,
        isFull: currentCount >= group.maxCapacity,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============ DASHBOARD ENDPOINT ============

// GET /api/academy/dashboard - analytics dashboard
router.get("/dashboard", dashboardCtrl);

// ============ SUBSCRIPTIONS ENDPOINTS ============

// POST /api/academy/subscriptions - create new academy subscription
router.post("/subscriptions", protect, createSubscriptionCtrl);

// GET /api/academy/subscriptions - list academy subscriptions with filters
router.get("/subscriptions", listSubscriptionsCtrl);

// GET /api/academy/subscriptions/expiring - list expiring subscriptions
router.get("/subscriptions/expiring", expiringSubscriptionsCtrl);

// GET /api/academy/subscriptions/active-today - list today's active members (coach list)
router.get("/subscriptions/active-today", activeTodayCtrl);

// GET /api/academy/members/:memberId/profile - get child profile with subscriptions
router.get("/members/:memberId/profile", getChildProfileCtrl);

// POST /api/academy/subscriptions/:id/change-sport - change child's sport
router.post("/subscriptions/:id/change-sport", protect, changeSportCtrl);

// POST /api/academy/subscriptions/:id/change-group - change child's group
router.post("/subscriptions/:id/change-group", protect, changeGroupCtrl);

// POST /api/academy/members/:memberId/add-sport - add new sport to child
router.post("/members/:memberId/add-sport", protect, addSportCtrl);

module.exports = router;
