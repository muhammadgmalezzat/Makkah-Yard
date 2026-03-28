const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Package = require("../models/Package");

async function run() {
  const isDryRun = process.argv.includes("--dry-run");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected");
  if (isDryRun) console.log("🔍 DRY RUN\n");

  // Find all family accounts
  const familyAccounts = await Account.find({ type: "family" });
  console.log(`Found ${familyAccounts.length} family accounts\n`);

  let fixedAccounts = 0;
  let convertedToSubAdult = 0;

  for (const account of familyAccounts) {
    const members = await Member.find({ accountId: account._id });
    const partners = members.filter((m) => m.role === "partner");

    // If more than 1 partner, convert extras to sub_adult
    if (partners.length > 1) {
      // Keep first partner, convert the rest
      const toConvert = partners.slice(1);

      console.log(`Account ${account._id}: ${partners.length} partners found`);
      toConvert.forEach((m) =>
        console.log(`  ${isDryRun ? "🔍" : "✅"} ${m.fullName} → sub_adult`),
      );

      if (!isDryRun) {
        // Find sub_adult package (6M or 1Y based on account subscription)
        const primaryMember = members.find((m) => m.role === "primary");
        const primarySub = await Subscription.findOne({
          accountId: account._id,
          memberId: primaryMember?._id,
        }).populate("packageId");

        const durationMonths = primarySub?.packageId?.durationMonths || 12;
        const subAdultPkg = await Package.findOne({
          category: "sub_adult",
          durationMonths,
          isActive: true,
        });

        for (const member of toConvert) {
          await Member.findByIdAndUpdate(member._id, { role: "sub_adult" });

          // Create subscription and payment if sub_adult package found
          if (subAdultPkg && primarySub) {
            const newSub = await Subscription.create({
              memberId: member._id,
              accountId: account._id,
              packageId: subAdultPkg._id,
              startDate: primarySub.startDate,
              endDate: primarySub.endDate,
              status: primarySub.status,
              pricePaid: subAdultPkg.price,
              type: "gym",
              sport: "general",
              createdBy: primarySub.createdBy,
            });
            await Payment.create({
              subscriptionId: newSub._id,
              memberId: member._id,
              amount: subAdultPkg.price,
              method: "cash",
              type: "new",
              paidAt: primarySub.startDate,
              createdBy: primarySub.createdBy,
            });
          }
          convertedToSubAdult++;
        }
        fixedAccounts++;
      }
    }
  }

  console.log("\n==========================================");
  console.log(`حسابات تحتاج تصحيح: ${fixedAccounts}`);
  console.log(`أعضاء تم تحويلهم لـ sub_adult: ${convertedToSubAdult}`);
  if (isDryRun) console.log("شغّل بدون --dry-run عشان تصلح");
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
