const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: [
        "create_subscription",
        "renew_subscription",
        "transfer_subscription",
        "freeze_subscription",
        "cancel_subscription",
        "change_package",
        "add_sub_member",
      ],
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    before: {
      type: mongoose.Schema.Types.Mixed,
    },
    after: {
      type: mongoose.Schema.Types.Mixed,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
