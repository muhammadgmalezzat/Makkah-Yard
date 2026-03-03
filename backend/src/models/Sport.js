const mongoose = require("mongoose");

const sportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    nameEn: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "both"],
      required: true,
    },
    minAge: {
      type: Number,
      default: 4,
    },
    maxAge: {
      type: Number,
      default: 14,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Sport", sportSchema);
