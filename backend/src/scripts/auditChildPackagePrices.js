const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Package = require("../models/Package");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  const packages = await Package.find({
    category: { $in: ["sub_child", "academy_only"] },
    isActive: true,
  }).lean();

  const monthlyPackages = packages.filter((p) => p.isFlexibleDuration);
  const annualPackages = packages.filter(
    (p) => !p.isFlexibleDuration && p.durationMonths === 12,
  );

  console.log("==========================================");
  console.log("📊 AUDIT: Children Package Prices");
  console.log("==========================================\n");

  let issues = 0;

  for (const monthly of monthlyPackages) {
    const expectedAnnualPrice = monthly.pricePerMonth * 10;
    const annual = annualPackages.find(
      (p) => p.sport === monthly.sport && p.category === monthly.category,
    );

    const expectedLabel = `${monthly.sport} | ${monthly.category}`;
    const monthlyOk = monthly.pricePerMonth > 0 ? "✅" : "❌";

    console.log(`${monthlyOk} ${expectedLabel}`);
    console.log(`   شهري: ${monthly.pricePerMonth} ريال`);
    console.log(`   6 أشهر (المتوقع): ${monthly.pricePerMonth * 5} ريال`);

    if (annual) {
      const annualOk = annual.price === expectedAnnualPrice ? "✅" : "❌";
      console.log(
        `   ${annualOk} سنوي (فعلي): ${annual.price} | (متوقع): ${expectedAnnualPrice}`,
      );
      if (annual.price !== expectedAnnualPrice) {
        console.log(
          `   ⚠️  يحتاج تصحيح: ${annual.price} → ${expectedAnnualPrice}`,
        );
        issues++;
      }
    } else {
      console.log(`   ❌ لا توجد باقة سنوية لهذه الرياضة`);
      issues++;
    }
    console.log();
  }

  console.log("==========================================");
  console.log(`إجمالي المشاكل: ${issues}`);
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
