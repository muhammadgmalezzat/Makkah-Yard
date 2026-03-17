const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  // Update pricePerMonth to 300 for these monthly packages
  const monthly300 = [
    "Academy Fitness Monthly",
    "Academy Ballet Monthly",
    "Academy Gymnastics Monthly",
  ];

  for (const name of monthly300) {
    const r = await Package.findOneAndUpdate(
      { name },
      { $set: { pricePerMonth: 300 } },
      { new: true },
    );
    console.log(
      r
        ? `✅ ${r.name} → pricePerMonth: ${r.pricePerMonth}`
        : `❌ Not found: ${name}`,
    );
  }

  // Update price to 2300 for these annual packages
  const annual2300 = [
    "Academy Karate Annual",
    "Academy Taekwondo Annual",
    "Academy Kickboxing Annual",
    "Academy Boxing Annual",
    "Academy Judo Annual",
    "Academy Jujitsu Annual",
    "Academy Combat Annual",
    "Academy MMA Annual",
    "Academy Wrestling Annual",
  ];

  for (const name of annual2300) {
    const r = await Package.findOneAndUpdate(
      { name },
      { $set: { price: 2300 } },
      { new: true },
    );
    console.log(
      r ? `✅ ${r.name} → price: ${r.price}` : `❌ Not found: ${name}`,
    );
  }

  // Update price to 3000 for these annual packages
  const annual3000 = [
    "Academy Fitness Annual",
    "Academy Ballet Annual",
    "Academy Gymnastics Annual",
  ];

  for (const name of annual3000) {
    const r = await Package.findOneAndUpdate(
      { name },
      { $set: { price: 3000 } },
      { new: true },
    );
    console.log(
      r ? `✅ ${r.name} → price: ${r.price}` : `❌ Not found: ${name}`,
    );
  }

  console.log("\n✅ Done");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
