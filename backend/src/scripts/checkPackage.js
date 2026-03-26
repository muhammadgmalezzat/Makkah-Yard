const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const pkg = await Package.findOne({
    category: "individual",
    durationMonths: 3,
  });
  console.log(
    pkg
      ? "✅ موجودة: " + pkg.name + " | السعر: " + pkg.price
      : "❌ باقة individual 3 أشهر مش موجودة",
  );
  process.exit(0);
}
run().catch(console.error);
