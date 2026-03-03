const mongoose = require("mongoose");

const academySubscriptionSchema = new mongoose.Schema(
  {
    // الطفل
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },

    // الرياضة والمجموعة
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
      index: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademyGroup",
      required: true,
      index: true,
    },

    // نوع العضوية
    memberType: {
      type: String,
      enum: ["linked", "standalone"],
      required: true,
      // linked = ابن مشترك (أ.م)
      // standalone = غير مرتبط (أ.غ.م)
    },

    // الاشتراك الأب (لو linked فقط)
    parentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
    },

    // التواريخ
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    durationMonths: {
      type: Number,
      required: true,
    },

    // المالي
    pricePaid: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "network", "tabby", "tamara", "transfer"],
      required: true,
    },

    // الحالة
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
      index: true,
    },

    // للتتبع
    renewalCount: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "AcademySubscription",
  academySubscriptionSchema,
);
