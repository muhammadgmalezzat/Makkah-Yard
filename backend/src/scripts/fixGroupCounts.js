const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const AcademyGroup = require("../models/AcademyGroup");
const AcademySubscription = require("../models/AcademySubscription");
const Sport = require("../models/Sport");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");
  if (isDryRun) console.log("🔍 DRY RUN\n");

  const groups = await AcademyGroup.find().populate("sportId", "name").lean();
  console.log(`Found ${groups.length} groups\n`);

  for (const group of groups) {
    // Count actual active subscriptions for this group
    const actualCount = await AcademySubscription.countDocuments({
      groupId: group._id,
      status: "active",
    });

    const diff = group.currentCount - actualCount;
    const status = diff === 0 ? "✅" : "❌";

    console.log(
      `${status} ${group.name} | ${group.sportId?.name} | DB: ${group.currentCount} | Actual: ${actualCount} | Diff: ${diff > 0 ? "+" + diff : diff}`,
    );

    if (!isDryRun && diff !== 0) {
      await AcademyGroup.findByIdAndUpdate(group._id, {
        currentCount: actualCount,
      });
    }
  }

  console.log("\n==========================================");
  if (isDryRun) {
    console.log("شغّل بدون --dry-run عشان تصلح الأرقام");
  } else {
    console.log("✅ تم تصحيح كل المجموعات");
  }
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
