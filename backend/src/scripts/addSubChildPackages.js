const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function addPackages() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const newPackages = [
    {
      name: "Sub Child Wrestling Monthly",
      category: "sub_child",
      sport: "wrestling",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child MMA Monthly",
      category: "sub_child",
      sport: "mma",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Jujitsu Monthly",
      category: "sub_child",
      sport: "jujitsu",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Judo Monthly",
      category: "sub_child",
      sport: "judo",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Boxing Monthly",
      category: "sub_child",
      sport: "boxing",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Kickboxing Monthly",
      category: "sub_child",
      sport: "kickboxing",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Taekwondo Monthly",
      category: "sub_child",
      sport: "taekwondo",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Karate Monthly",
      category: "sub_child",
      sport: "karate",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Gymnastics Monthly",
      category: "sub_child",
      sport: "gymnastics",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Ballet Monthly",
      category: "sub_child",
      sport: "ballet",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Fitness Monthly",
      category: "sub_child",
      sport: "fitness",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 230,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Football1 Monthly",
      category: "sub_child",
      sport: "football1",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 350,
      isFlexibleDuration: true,
      isActive: true,
    },
    {
      name: "Sub Child Football2 Monthly",
      category: "sub_child",
      sport: "football2",
      durationMonths: 1,
      price: 0,
      pricePerMonth: 350,
      isFlexibleDuration: true,
      isActive: true,
    },
  ];

  for (const pkg of newPackages) {
    const exists = await Package.findOne({ name: pkg.name });
    if (exists) {
      console.log(`⏭️  Already exists: ${pkg.name}`);
      continue;
    }
    await Package.create(pkg);
    console.log(`✅ Created: ${pkg.name}`);
  }

  console.log("Done");
  process.exit(0);
}

addPackages().catch((err) => {
  console.error(err);
  process.exit(1);
});
