const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    method: {
      type: String,
      enum: ["cash", "network", "tabby"],
      required: true,
    },
    type: {
      type: String,
      enum: ["new", "renewal", "transfer_fee", "upgrade_diff"],
      default: "new",
    },
    receiptPhoto: {
      type: String,
    },
    paidAt: {
      type: Date,
      default: () => new Date(),
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Payment", paymentSchema);
