const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  const newPassword = "MakkahYard@Admin#2025!";
  const hashed = await bcrypt.hash(newPassword, 12);

  const admin = await User.findOneAndUpdate(
    { role: "admin" },
    { passwordHash: hashed },
    { new: true },
  );

  if (!admin) {
    console.log("❌ Admin not found");
    process.exit(1);
  }

  console.log(`✅ تم تغيير باسورد الأدمن`);
  console.log(`📧 Email: ${admin.email}`);
  console.log(`🔑 Password: ${newPassword}`);
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
