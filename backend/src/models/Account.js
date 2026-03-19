const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["individual", "friends", "family", "academy_only"],
      required: true,
    },
    primaryMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Member",
    },
    status: {
      type: String,
      enum: ["active", "frozen", "cancelled", "expired"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Account", accountSchema);
