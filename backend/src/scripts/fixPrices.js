const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  const fixes = [
    // Monthly → pricePerMonth: 330
    { name: "Academy Fitness Monthly", field: "pricePerMonth", value: 330 },
    { name: "Academy Ballet Monthly", field: "pricePerMonth", value: 330 },
    { name: "Academy Gymnastics Monthly", field: "pricePerMonth", value: 330 },

    // Annual → price: 3300
    { name: "Academy Karate Annual", field: "price", value: 3300 },
    { name: "Academy Taekwondo Annual", field: "price", value: 3300 },
    { name: "Academy Kickboxing Annual", field: "price", value: 3300 },
    { name: "Academy Boxing Annual", field: "price", value: 3300 },
    { name: "Academy Judo Annual", field: "price", value: 3300 },
    { name: "Academy Jujitsu Annual", field: "price", value: 3300 },
    { name: "Academy Combat Annual", field: "price", value: 3300 },
    { name: "Academy MMA Annual", field: "price", value: 3300 },
    { name: "Academy Wrestling Annual", field: "price", value: 3300 },
    { name: "Academy Fitness Annual", field: "price", value: 3300 },
    { name: "Academy Ballet Annual", field: "price", value: 3300 },
    { name: "Academy Gymnastics Annual", field: "price", value: 3300 },
  ];

  for (const fix of fixes) {
    const r = await Package.findOneAndUpdate(
      { name: fix.name },
      { $set: { [fix.field]: fix.value } },
      { new: true },
    );
    if (r) {
      console.log(
        `✅ ${r.name} → ${fix.field}: ${fix.field === "price" ? r.price : r.pricePerMonth}`,
      );
    } else {
      console.log(`❌ Not found: ${fix.name}`);
    }
  }

  console.log("\n✅ Done");
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
