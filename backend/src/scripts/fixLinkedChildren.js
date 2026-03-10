const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");

async function fix() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const Member = require("../models/Member");
    const AcademySubscription = require("../models/AcademySubscription");
    const Subscription = require("../models/Subscription");

    // Find all linked academy subscriptions
    const linkedSubs = await AcademySubscription.find({
      parentSubscriptionId: { $ne: null },
      memberType: "linked",
    });

    console.log(`\n📋 Found ${linkedSubs.length} linked academy subscriptions`);

    if (linkedSubs.length === 0) {
      console.log("✅ No linked subscriptions found that need fixing");
      process.exit(0);
    }

    let fixed = 0;
    let errors = 0;

    for (const sub of linkedSubs) {
      try {
        const parentSub = await Subscription.findById(sub.parentSubscriptionId);
        if (!parentSub) {
          console.log(
            `⚠️  No parent subscription found for academySub: ${sub._id}`,
          );
          errors++;
          continue;
        }

        const member = await Member.findById(sub.memberId);
        if (!member) {
          console.log(`⚠️  Member not found for academySub: ${sub._id}`);
          errors++;
          continue;
        }

        // Only update if accountId is different
        if (member.accountId.toString() !== parentSub.accountId.toString()) {
          const result = await Member.findByIdAndUpdate(
            sub.memberId,
            { accountId: parentSub.accountId },
            { new: true },
          );
          console.log(
            `✅ Fixed: ${result.fullName} (${member._id}) → accountId: ${parentSub.accountId}`,
          );
          fixed++;
        } else {
          console.log(
            `ℹ️  Already correct: ${member.fullName} - accountId matches parent`,
          );
        }
      } catch (err) {
        console.error(
          `❌ Error processing academySub ${sub._id}:`,
          err.message,
        );
        errors++;
      }
    }

    console.log(`\n\n📊 Summary:`);
    console.log(`   Fixed: ${fixed}`);
    console.log(`   Errors: ${errors}`);
    console.log(`   Total: ${linkedSubs.length}`);
    console.log("\n✅ Fix script completed!");

    process.exit(0);
  } catch (err) {
    console.error("❌ Fix script error:", err);
    process.exit(1);
  }
}

fix();
