const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  try {
    await mongoose.connection.collection("members").dropIndex("phone_1");
    console.log("✅ Dropped phone_1 unique index");
  } catch (err) {
    console.log("⚠️  Index may not exist:", err.message);
  }

  process.exit(0);
}
run().catch(console.error);
