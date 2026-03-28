const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const users = [
  { name: "Reem", email: "reem@makkahyard.com", password: "Reem@2001" },
  { name: "Farah", email: "farah@makkahyard.com", password: "Farah@1999" },
  { name: "Alyaa", email: "alyaa@makkahyard.com", password: "Alyaa@2025" },
  {
    name: "Mahmoud",
    email: "mahmoud@makkahyard.com",
    password: "Mahmoud@2025",
  },
  {
    name: "Abdul Razzaq",
    email: "abdulrazzaq@makkahyard.com",
    password: "Abdul@2025",
  },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  for (const u of users) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      console.log(`⏭️  موجود بالفعل: ${u.name} (${u.email})`);
      continue;
    }
    await User.create({
      name: u.name,
      email: u.email,
      passwordHash: u.password,
      role: "reception",
    });
    console.log(`✅ تم إنشاء: ${u.name}`);
    console.log(`   📧 ${u.email}`);
    console.log(`   🔑 ${u.password}\n`);
  }

  console.log("==========================================");
  console.log("✅ تم إنشاء حسابات الريسبشن");
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
