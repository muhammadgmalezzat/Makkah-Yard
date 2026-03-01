require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Package = require("../models/Package");
const packagesData = require("./packages.seed");

const seed = async () => {
  await connectDB();
  console.log("Connected to MongoDB");

  // Clear existing data
  await Package.deleteMany({});
  await User.deleteMany({});
  console.log("Cleared existing data");

  // Insert packages
  await Package.insertMany(packagesData);
  console.log("✓ Inserted 20 packages");

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
