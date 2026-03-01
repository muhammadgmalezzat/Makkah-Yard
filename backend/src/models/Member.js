const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    role: {
      type: String,
      enum: ["primary", "partner", "child"],
      default: "primary",
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
    },
    nationalId: {
      type: String,
      sparse: true,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    dateOfBirth: {
      type: Date,
    },
    photo: {
      type: String,
    },
    guardianAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Virtual for age
memberSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  return Math.floor(
    (new Date() - this.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000),
  );
});

module.exports = mongoose.model("Member", memberSchema);
