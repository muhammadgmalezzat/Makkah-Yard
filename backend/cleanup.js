require("dotenv").config();
const mongoose = require("mongoose");
const Member = require("./src/models/Member");
const Account = require("./src/models/Account");
const Subscription = require("./src/models/Subscription");
const Payment = require("./src/models/Payment");

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Find members with wrong phone numbers
    const members = await Member.find({
      phone: { $in: ["2323232323", "2323232344"] },
    });
    console.log("Found members:", members.length);

    for (const member of members) {
      console.log("Deleting member:", member.fullName, member.phone);
      const accountId = member.accountId;

      // Delete subscriptions
      await Subscription.deleteMany({ memberId: member._id });

      // Delete payments
      await Payment.deleteMany({ memberId: member._id });

      // Delete member
      await Member.deleteMany({ _id: member._id });

      // Delete account
      if (accountId) {
        await Account.deleteMany({ _id: accountId });
      }
    }

    console.log("Cleanup complete");
    await mongoose.connection.close();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

cleanup();
