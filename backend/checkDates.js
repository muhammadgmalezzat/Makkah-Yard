require("dotenv").config();
const mongoose = require("mongoose");

async function checkDates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const db = mongoose.connection.db;
    const subs = await db
      .collection("subscriptions")
      .aggregate([
        {
          $lookup: {
            from: "members",
            localField: "memberId",
            foreignField: "_id",
            as: "member",
          },
        },
        { $unwind: "$member" },
        { $project: { "member.fullName": 1, startDate: 1, endDate: 1 } },
      ])
      .toArray();

    console.log("Subscriptions:");
    subs.forEach((sub) => {
      const startStr = new Date(sub.startDate).toISOString().split("T")[0];
      const endStr = new Date(sub.endDate).toISOString().split("T")[0];
      console.log(`${sub.member.fullName}:`);
      console.log(`  Start: ${startStr}`);
      console.log(`  End: ${endStr}`);
    });

    await mongoose.connection.close();
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkDates();
