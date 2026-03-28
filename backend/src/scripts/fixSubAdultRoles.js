const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");
  if (isDryRun) console.log("🔍 DRY RUN\n");

  // Find all members with role=partner who HAVE a subscription
  // (real partners should have NO subscription)
  const partners = await Member.find({ role: "partner" });

  let toFix = [];
  for (const member of partners) {
    const sub = await Subscription.findOne({ memberId: member._id });
    if (sub) {
      toFix.push(member);
      console.log(
        `${isDryRun ? "🔍" : "✅"} Fix: ${member.fullName} → sub_adult (has subscription: ${sub.packageId})`,
      );
    }
  }

  console.log(`\nFound ${toFix.length} members to fix`);

  if (!isDryRun && toFix.length > 0) {
    const ids = toFix.map((m) => m._id);
    await Member.updateMany(
      { _id: { $in: ids } },
      { $set: { role: "sub_adult" } },
    );
    console.log(`✅ Updated ${toFix.length} members to sub_adult`);
  }

  console.log("==========================================");
  if (isDryRun) console.log("شغّل بدون --dry-run عشان تصلح");
  else console.log("✅ Done");
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
