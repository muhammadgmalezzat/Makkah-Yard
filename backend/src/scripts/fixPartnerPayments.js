const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB\n");
  if (isDryRun) console.log("🔍 DRY RUN — no data will be deleted\n");

  const partners = await Member.find({ role: "partner" });
  console.log(`Found ${partners.length} partner members`);

  let totalSubs = 0;
  let totalPayments = 0;

  for (const partner of partners) {
    const subs = await Subscription.find({ memberId: partner._id });
    if (subs.length === 0) continue;

    for (const sub of subs) {
      const payments = await Payment.find({ subscriptionId: sub._id });
      console.log(
        `${isDryRun ? "🔍" : "🗑️"} Partner: ${partner.fullName} | Sub: ${sub._id} | Payments: ${payments.length}`,
      );
      totalSubs++;
      totalPayments += payments.length;
      if (!isDryRun) {
        await Payment.deleteMany({ subscriptionId: sub._id });
        await Subscription.findByIdAndDelete(sub._id);
      }
    }
  }

  console.log("\n==========================================");
  console.log(`${isDryRun ? "سيتم حذف" : "تم حذف"}: ${totalSubs} اشتراك`);
  console.log(`${isDryRun ? "سيتم حذف" : "تم حذف"}: ${totalPayments} دفعة`);
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
