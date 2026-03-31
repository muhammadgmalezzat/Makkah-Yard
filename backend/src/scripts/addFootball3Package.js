const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  const admin = await User.findOne({ role: "admin" });

  const packages = [
    {
      name: "Academy Football3 Monthly",
      category: "academy_only",
      sport: "football3",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 350,
      isFlexibleDuration: true,
      isActive: true,
      createdBy: admin._id,
    },
    {
      name: "Sub Child Football3 Monthly",
      category: "sub_child",
      sport: "football3",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 350,
      isFlexibleDuration: true,
      isActive: true,
      createdBy: admin._id,
    },
    {
      name: "Academy Football3 Annual",
      category: "academy_only",
      sport: "football3",
      durationMonths: 12,
      price: 4500,
      isFlexibleDuration: false,
      isActive: true,
      createdBy: admin._id,
    },
    {
      name: "Sub Child Football3 Annual",
      category: "sub_child",
      sport: "football3",
      durationMonths: 12,
      price: 4500,
      isFlexibleDuration: false,
      isActive: true,
      createdBy: admin._id,
    },
  ];

  for (const pkg of packages) {
    const existing = await Package.findOne({
      category: pkg.category,
      sport: pkg.sport,
      durationMonths: pkg.durationMonths,
    });
    if (existing) {
      console.log(`⏭️  Already exists: ${pkg.name}`);
    } else {
      await Package.create(pkg);
      console.log(`✅ Created: ${pkg.name}`);
    }
  }

  console.log("==========================================");
  console.log("✅ Done");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
