const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");
  if (isDryRun) console.log("🔍 DRY RUN\n");

  const packages = await Package.find({
    category: { $in: ["sub_child", "academy_only"] },
    isActive: true,
  }).lean();

  const monthlyPackages = packages.filter((p) => p.isFlexibleDuration);
  const annualPackages = packages.filter(
    (p) => !p.isFlexibleDuration && p.durationMonths === 12,
  );

  let fixed = 0;

  for (const monthly of monthlyPackages) {
    const expectedAnnualPrice = monthly.pricePerMonth * 10;
    const annual = annualPackages.find(
      (p) => p.sport === monthly.sport && p.category === monthly.category,
    );

    if (annual && annual.price !== expectedAnnualPrice) {
      console.log(
        `${isDryRun ? "🔍" : "✅"} ${monthly.sport} | ${monthly.category}`,
      );
      console.log(`   ${annual.price} → ${expectedAnnualPrice}`);
      if (!isDryRun) {
        await Package.findByIdAndUpdate(annual._id, {
          price: expectedAnnualPrice,
        });
      }
      fixed++;
    }
  }

  console.log("\n==========================================");
  console.log(`${isDryRun ? "سيتم تصحيح" : "تم تصحيح"}: ${fixed} باقة`);
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
