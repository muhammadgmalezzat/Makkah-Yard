const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");
  if (isDryRun) console.log("🔍 DRY RUN\n");

  // Get all sub_child monthly packages
  const monthlyPackages = await Package.find({
    category: "sub_child",
    isFlexibleDuration: true,
    isActive: true,
  }).lean();

  let created = 0;
  let skipped = 0;

  for (const monthly of monthlyPackages) {
    // Check if annual package already exists
    const existingAnnual = await Package.findOne({
      category: "sub_child",
      sport: monthly.sport,
      durationMonths: 12,
      isFlexibleDuration: false,
    });

    if (existingAnnual) {
      console.log(`⏭️  Already exists: ${monthly.sport} (sub_child annual)`);
      skipped++;
      continue;
    }

    const annualPrice = (monthly.pricePerMonth || 0) * 10;
    const packageData = {
      name: `Sub Child ${monthly.sport} Annual`,
      category: "sub_child",
      sport: monthly.sport,
      durationMonths: 12,
      price: annualPrice,
      isFlexibleDuration: false,
      isActive: true,
    };

    console.log(
      `${isDryRun ? "🔍" : "✅"} ${monthly.sport} | sub_child | ${annualPrice} ريال`,
    );

    if (!isDryRun) {
      await Package.create(packageData);
    }
    created++;
  }

  console.log("\n==========================================");
  console.log(`${isDryRun ? "سيتم إنشاء" : "تم إنشاء"}: ${created} باقة`);
  if (skipped > 0) console.log(`تم تخطي: ${skipped} باقة (موجودة بالفعل)`);
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
