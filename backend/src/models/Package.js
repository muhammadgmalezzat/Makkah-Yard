const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "individual",
        "friends",
        "family_essential",
        "sub_adult",
        "sub_child",
        "academy_only",
      ],
      required: true,
    },
    sport: {
      type: String,
      enum: [
        "general",
        "football",
        "football1",
        "football2",
        "football3",
        "swimming",
        "combat",
        "mma",
        "wrestling",
        "jujitsu",
        "judo",
        "boxing",
        "ballet",
        "kickboxing",
        "taekwondo",
        "fitness",
        "karate",
        "gymnastics",
      ],
      default: "general",
    },
    durationMonths: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isFlexibleDuration: {
      type: Boolean,
      default: false,
    },
    pricePerMonth: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Package", packageSchema);
