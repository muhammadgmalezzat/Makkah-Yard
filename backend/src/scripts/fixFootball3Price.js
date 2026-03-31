const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");

  const result = await Package.updateMany(
    { sport: "football3" },
    { $set: { pricePerMonth: 350 } },
  );

  console.log("Updated:", result.modifiedCount, "packages");

  // Verify
  const packages = await Package.find({ sport: "football3" });
  packages.forEach((p) => {
    console.log(
      `✅ ${p.name} | pricePerMonth: ${p.pricePerMonth} | price: ${p.price}`,
    );
  });

  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
