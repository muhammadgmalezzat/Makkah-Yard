const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Sport = require("../models/Sport");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  const updates = [
    // من 5 الى 15
    { nameEn: "boxing", minAge: 5, maxAge: 15 },
    { nameEn: "judo", minAge: 5, maxAge: 15 },
    { nameEn: "jujitsu", minAge: 5, maxAge: 15 },
    { nameEn: "mma", minAge: 5, maxAge: 15 },
    { nameEn: "wrestling", minAge: 5, maxAge: 15 },
    { nameEn: "taekwondo", minAge: 5, maxAge: 15 },
    { nameEn: "kickboxing", minAge: 5, maxAge: 15 },
    { nameEn: "fitness", minAge: 5, maxAge: 15 },
    { nameEn: "gymnastics", minAge: 5, maxAge: 15 },
    { nameEn: "swimming", minAge: 5, maxAge: 15 },
    { nameEn: "karate", minAge: 5, maxAge: 15 },
    // من 5 الى 12
    { nameEn: "football1", minAge: 5, maxAge: 12 },
    { nameEn: "football3", minAge: 5, maxAge: 12 },
  ];

  for (const update of updates) {
    const sport = await Sport.findOneAndUpdate(
      { nameEn: update.nameEn },
      { minAge: update.minAge, maxAge: update.maxAge },
      { new: true },
    );
    if (sport) {
      console.log(
        `✅ ${sport.name} (${sport.nameEn}) | ${sport.minAge} - ${sport.maxAge} سنة`,
      );
    } else {
      console.log(`❌ مش موجود: ${update.nameEn}`);
    }
  }

  console.log("\n==========================================");
  console.log("✅ Done");
  console.log("==========================================");
  process.exit(0);
}
run().catch((err) => {
  console.error(err);
  process.exit(1);
});
