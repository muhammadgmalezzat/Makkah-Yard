const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await Package.findOne({
    category: "individual",
    durationMonths: 3,
  });
  if (existing) {
    console.log("✅ موجودة بالفعل:", existing.name);
    process.exit(0);
  }

  const pkg = await Package.create({
    name: "Single 3M",
    category: "individual",
    durationMonths: 3,
    price: 1312,
    isActive: true,
    isFlexibleDuration: false,
  });

  console.log("✅ تم إضافة الباقة:", pkg.name, "| السعر:", pkg.price);
  process.exit(0);
}
run().catch(console.error);
