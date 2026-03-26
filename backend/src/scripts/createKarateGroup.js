const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const admin = await User.findOne({ role: "admin" });
  const sport = await Sport.findOne({ nameEn: "karate" });

  if (!sport) {
    console.log("karate sport not found");
    process.exit(1);
  }

  const existing = await AcademyGroup.findOne({
    sportId: sport._id,
    name: "B - Girls",
  });
  if (existing) {
    console.log("Already exists");
    process.exit(0);
  }

  await AcademyGroup.create({
    sportId: sport._id,
    name: "B - Girls",
    schedule: "يحدد لاحقاً",
    maxCapacity: 15,
    currentCount: 0,
    isActive: true,
    createdBy: admin._id,
  });

  console.log("✅ Created B - Girls for karate");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
