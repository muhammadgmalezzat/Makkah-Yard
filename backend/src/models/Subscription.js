const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    type: {
      type: String,
      enum: ["gym", "academy"],
      default: "gym",
    },
    status: {
      type: String,
      enum: ["active", "renewed", "cancelled", "expired"],
      default: "active",
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },
    parentSubscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    renewalCount: {
      type: Number,
      default: 0,
    },
    freezeCount: {
      type: Number,
      default: 0,
    },
    transferCount: {
      type: Number,
      default: 0,
    },
    isFrozen: {
      type: Boolean,
      default: false,
    },
    freezeStart: {
      type: Date,
    },
    freezeEnd: {
      type: Date,
    },
    sport: {
      type: String,
      enum: ["general", "football", "swimming", "combat"],
      default: "general",
    },
    group: {
      type: String,
    },
    pricePaid: {
      type: Number,
      required: true,
    },
    notes: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Indexes for performance
subscriptionSchema.index({ memberId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
