const mongoose = require("mongoose");

const academyGroupSchema = new mongoose.Schema(
  {
    sportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Sport",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    schedule: {
      type: String,
    },
    maxCapacity: {
      type: Number,
      required: true,
    },
    currentCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Virtual field for isFull
academyGroupSchema.virtual("isFull").get(function () {
  return this.currentCount >= this.maxCapacity;
});

module.exports = mongoose.model("AcademyGroup", academyGroupSchema);
