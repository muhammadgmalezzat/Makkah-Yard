const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const fixes = [
    {
      name: "Sub Child Combat Monthly",
      update: { pricePerMonth: 230, price: 0, isFlexibleDuration: true },
    },
    {
      name: "Sub Child Swimming Monthly",
      update: { pricePerMonth: 300, price: 0, isFlexibleDuration: true },
    },
    {
      name: "Sub Child Football Monthly",
      update: { pricePerMonth: 350, price: 0, isFlexibleDuration: true },
    },
  ];

  for (const fix of fixes) {
    const r = await Package.findOneAndUpdate(
      { name: fix.name },
      { $set: fix.update },
      { new: true },
    );
    console.log(
      r
        ? `✅ ${r.name} → pricePerMonth: ${r.pricePerMonth}, isFlexibleDuration: ${r.isFlexibleDuration}`
        : `❌ Not found: ${fix.name}`,
    );
  }

  console.log("\n✅ Done");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
