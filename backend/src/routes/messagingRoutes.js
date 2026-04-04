const express = require("express");
const { protect, allowRoles } = require("../middleware/auth");
const messagingService = require("../services/messagingService");

const router = express.Router();

/**
 * POST /api/messaging/send
 * Send a message via SMS, WhatsApp, or Email
 * Body: { phone, email, message, channel: 'sms' | 'whatsapp' | 'email' }
 * Auth: admin or owner only
 */
router.post(
  "/send",
  protect,
  allowRoles("admin", "owner"),
  async (req, res) => {
    try {
      const { phone, email, message, channel = "sms" } = req.body;

      // Validate input
      if (!message || message.trim().length === 0) {
        return res.status(400).json({
          message: "الرسالة مطلوبة",
          success: false,
        });
      }

      if (message.length > 500) {
        return res.status(400).json({
          message: "يتجاوز طول الرسالة 500 حرف",
          success: false,
        });
      }

      let result;

      switch (channel) {
        case "sms":
          if (!phone) {
            return res.status(400).json({
              message: "رقم الهاتف مطلوب لـ SMS",
              success: false,
            });
          }
          result = await messagingService.sendSMS(phone, message);
          break;

        case "whatsapp":
          if (!phone) {
            return res.status(400).json({
              message: "رقم الهاتف مطلوب لـ WhatsApp",
              success: false,
            });
          }
          result = await messagingService.sendWhatsApp(phone, message);
          break;

        case "email":
          if (!email) {
            return res.status(400).json({
              message: "البريد الإلكتروني مطلوب",
              success: false,
            });
          }
          result = await messagingService.sendEmail(
            email,
            "رسالة من نادي مكة الرياضي",
            message,
          );
          break;

        default:
          return res.status(400).json({
            message: "قناة غير صحيحة. استخدم: sms, whatsapp, أو email",
            success: false,
          });
      }

      if (result.success) {
        return res.status(200).json({
          message: `تم إرسال الرسالة عبر ${channel} بنجاح`,
          success: true,
          data: result.data,
          channel: result.channel,
        });
      } else {
        return res.status(500).json({
          message: `فشل إرسال الرسالة: ${result.error}`,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Messaging error:", error);
      res.status(500).json({
        message: "حدث خطأ أثناء إرسال الرسالة",
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * POST /api/messaging/test
 * Send a test message to verify the integration
 * Body: { phone, channel: 'sms' | 'whatsapp' }
 * Auth: admin or owner only
 */
router.post(
  "/test",
  protect,
  allowRoles("admin", "owner"),
  async (req, res) => {
    try {
      const { phone, channel = "sms" } = req.body;

      if (!phone) {
        return res.status(400).json({
          message: "رقم الهاتف مطلوب للاختبار",
          success: false,
        });
      }

      if (!["sms", "whatsapp"].includes(channel)) {
        return res.status(400).json({
          message: "قناة غير صحيحة. استخدم: sms أو whatsapp",
          success: false,
        });
      }

      const result = await messagingService.sendTestMessage(phone, channel);

      if (result.success) {
        return res.status(200).json({
          message: `تم إرسال الرسالة التجريبية عبر ${channel} بنجاح`,
          success: true,
          data: result.data,
          channel: result.channel,
          testMessage: "رسالة تجريبية من نادي مكة الرياضي",
        });
      } else {
        return res.status(500).json({
          message: `فشل إرسال الرسالة التجريبية: ${result.error}`,
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Test messaging error:", error);
      res.status(500).json({
        message: "حدث خطأ أثناء إرسال الرسالة التجريبية",
        success: false,
        error: error.message,
      });
    }
  },
);

/**
 * GET /api/messaging/stats
 * Get live statistics for message templates
 * Auth: admin or owner only
 */
router.get(
  "/stats",
  protect,
  allowRoles("admin", "owner"),
  async (req, res, next) => {
    try {
      const Subscription = require("../models/Subscription");
      const AcademySubscription = require("../models/AcademySubscription");
      const Member = require("../models/Member");

      const today = new Date();

      const activeGym = await Subscription.countDocuments({ status: "active" });
      const activeAcademy = await AcademySubscription.countDocuments({
        status: "active",
      });
      const totalMembers = await Member.countDocuments({ isActive: true });

      // Expiring in 7 days
      const in7days = new Date(today);
      in7days.setDate(in7days.getDate() + 7);
      const expiringGym = await Subscription.countDocuments({
        status: "active",
        endDate: { $gte: today, $lte: in7days },
      });
      const expiringAcademy = await AcademySubscription.countDocuments({
        status: "active",
        endDate: { $gte: today, $lte: in7days },
      });

      res.json({
        success: true,
        data: {
          activeGym,
          activeAcademy,
          totalMembers,
          expiringGym,
          expiringAcademy,
          totalActive: activeGym + activeAcademy,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * GET /api/messaging/daily-report?date=2026-03-16
 * Get daily report data for message templates
 * Auth: admin or owner only
 */
router.get(
  "/daily-report",
  protect,
  allowRoles("admin", "owner"),
  async (req, res, next) => {
    try {
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      // Day range
      const dayStart = new Date(targetDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(targetDate);
      dayEnd.setHours(23, 59, 59, 999);

      // Month range
      const monthStart = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        1,
      );
      monthStart.setHours(0, 0, 0, 0);

      const Payment = require("../models/Payment");
      const Subscription = require("../models/Subscription");
      const AcademySubscription = require("../models/AcademySubscription");

      // 1. All payments today (with member + package details)
      const gymPayments = await Payment.find({
        paidAt: { $gte: dayStart, $lte: dayEnd },
      })
        .populate("memberId", "fullName role")
        .populate({
          path: "subscriptionId",
          populate: {
            path: "packageId",
            select: "name category durationMonths price",
          },
        })
        .sort({ paidAt: 1 })
        .lean();

      // 2. Academy payments today
      const academyPayments = await Payment.find({
        paidAt: { $gte: dayStart, $lte: dayEnd },
      }).populate({
        path: "subscriptionId",
        model: "AcademySubscription",
        populate: [
          { path: "sportId", select: "name gender" },
          { path: "groupId", select: "name" },
        ],
      });

      // 3. All new subscriptions today (gym)
      const gymSubs = await Subscription.find({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      })
        .populate("packageId", "name category durationMonths")
        .populate("memberId", "fullName");

      // 4. All new academy subscriptions today
      const academySubs = await AcademySubscription.find({
        createdAt: { $gte: dayStart, $lte: dayEnd },
      })
        .populate("sportId", "name gender")
        .populate("memberId", "fullName gender");

      // 5. Monthly total
      const monthlyPayments = await Payment.find({
        paidAt: { $gte: monthStart, $lte: dayEnd },
      });
      const monthlyTotal = monthlyPayments.reduce(
        (sum, p) => sum + (p.amount || 0),
        0,
      );

      // 6. Today totals
      const todayRenewals = gymPayments.filter((p) => p.type === "renewal");
      const todayNew = gymPayments.filter((p) => p.type === "new");
      const renewalTotal = todayRenewals.reduce((sum, p) => sum + p.amount, 0);
      const newTotal = todayNew.reduce((sum, p) => sum + p.amount, 0);
      const dayTotal = renewalTotal + newTotal;

      // 7. Group gym subs by package name
      const gymByPackage = {};
      gymSubs.forEach((sub) => {
        const name = sub.packageId?.name || "غير محدد";
        gymByPackage[name] = (gymByPackage[name] || 0) + 1;
      });

      // 8. Group academy subs by gender and sport
      const boysAcademy = {};
      const girlsAcademy = {};
      academySubs.forEach((sub) => {
        const sport = sub.sportId?.name || "غير محدد";
        const gender = sub.memberId?.gender;
        if (gender === "male")
          boysAcademy[sport] = (boysAcademy[sport] || 0) + 1;
        else girlsAcademy[sport] = (girlsAcademy[sport] || 0) + 1;
      });

      res.json({
        success: true,
        data: {
          date: targetDate,
          gymByPackage,
          boysAcademy,
          girlsAcademy,
          gymSubs,
          academySubs,
          renewalTotal,
          newTotal,
          dayTotal,
          monthlyTotal,
          allPaymentsToday: gymPayments,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
