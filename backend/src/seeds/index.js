require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Package = require("../models/Package");
const Sport = require("../models/Sport");
const packagesData = require("./packages.seed");

const seed = async () => {
  await connectDB();
  console.log("Connected to MongoDB");

  // Drop member indexes to fix sparse index issues with null values
  await mongoose.connection.collection("members").dropIndexes();
  console.log("✓ Dropped member indexes - will be recreated automatically");

  // Clear existing data
  await Package.deleteMany({});
  await User.deleteMany({});
  await Sport.deleteMany({});
  console.log("Cleared existing data");

  // Insert packages
  const insertedPackages = await Package.insertMany(packagesData);
  console.log(`✓ Inserted ${insertedPackages.length} packages`);

  // Insert sports
  const sports = [
    // أولاد فقط
    {
      name: "مصارعة",
      nameEn: "wrestling",
      gender: "male",
      minAge: 4,
      maxAge: 14,
    },
    { name: "MMA", nameEn: "mma", gender: "male", minAge: 6, maxAge: 14 },
    {
      name: "جوجيتسو",
      nameEn: "jujitsu",
      gender: "male",
      minAge: 4,
      maxAge: 14,
    },
    { name: "جودو", nameEn: "judo", gender: "male", minAge: 4, maxAge: 14 },
    { name: "ملاكمة", nameEn: "boxing", gender: "male", minAge: 8, maxAge: 14 },
    {
      name: "كرة قدم 1",
      nameEn: "football1",
      gender: "male",
      minAge: 6,
      maxAge: 12,
    },
    {
      name: "كرة قدم 2",
      nameEn: "football2",
      gender: "male",
      minAge: 12,
      maxAge: 15,
    },

    // بنات فقط
    {
      name: "باليه",
      nameEn: "ballet",
      gender: "female",
      minAge: 4,
      maxAge: 14,
    },
    {
      name: "كيك بوكس",
      nameEn: "kickboxing",
      gender: "female",
      minAge: 6,
      maxAge: 14,
    },
    {
      name: "تايكوندو",
      nameEn: "taekwondo",
      gender: "female",
      minAge: 6,
      maxAge: 14,
    },
    {
      name: "لياقة",
      nameEn: "fitness",
      gender: "female",
      minAge: 10,
      maxAge: 14,
    },

    // مشترك
    {
      name: "كاراتيه",
      nameEn: "karate",
      gender: "both",
      minAge: 4,
      maxAge: 14,
    },
    {
      name: "جمباز",
      nameEn: "gymnastics",
      gender: "both",
      minAge: 4,
      maxAge: 14,
    },
    {
      name: "سباحة",
      nameEn: "swimming",
      gender: "both",
      minAge: 4,
      maxAge: 14,
    },
  ];

  await Sport.insertMany(sports);
  console.log("✓ Inserted", sports.length, "sports");

  // Create users
  const admin = new User({
    name: "Admin User",
    email: "admin@gym.com",
    passwordHash: "admin123456",
    role: "admin",
    isActive: true,
  });
  await admin.save();
  console.log("✓ Created admin user: admin@gym.com / admin123456");

  const reception = new User({
    name: "Reception",
    email: "reception@gym.com",
    passwordHash: "reception123",
    role: "reception",
    isActive: true,
  });
  await reception.save();
  console.log("✓ Created reception user: reception@gym.com / reception123");

  console.log("\n✓ Seed completed successfully!");
  process.exit(0);
};

seed();
