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
      enum: ["primary", "partner", "child", "sub_adult"],
    },
    fullName: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      default: undefined,
      trim: true,
    },
    email: {
      type: String,
      default: undefined,
      lowercase: true,
      trim: true,
    },
    nationalId: {
      type: String,
      default: undefined,
      trim: true,
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

// Sparse unique indexes - allows multiple absent/undefined values
memberSchema.index({ phone: 1 }, { unique: true, sparse: true });
memberSchema.index({ nationalId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Member", memberSchema);
