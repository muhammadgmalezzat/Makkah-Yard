const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Sport = require("../models/Sport");

const SPORT_MAP = {
  سباحة: "swimming",
  كراتيه: "karate",
  كاراتيه: "karate",
  جمباز: "gymnastics",
  جمبااز: "gymnastics",
  تايكوندو: "taekwondo",
  جودو: "judo",
  mma: "mma",
  MMA: "mma",
  "ام ام ايه": "mma",
  ملاكمة: "boxing",
  ملاكمه: "boxing",
  "كيك بوكس": "kickboxing",
  "كيك بوكسن": "kickboxing",
  لياقة: "fitness",
  مصارعة: "wrestling",
  مصارعه: "wrestling",
  "كرة قدم": "football1",
  "كره قدم": "football1",
  باليه: "ballet",
};

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected\n");

  // Get unique English sport names
  const uniqueEn = [...new Set(Object.values(SPORT_MAP))];

  console.log("==========================================");
  console.log("🔍 فحص الرياضات في الداتابيز");
  console.log("==========================================");

  let allFound = true;
  for (const nameEn of uniqueEn) {
    const sport = await Sport.findOne({ nameEn });
    if (sport) {
      console.log(`✅ ${nameEn} — ${sport.name}`);
    } else {
      console.log(`❌ ${nameEn} — غير موجودة في الداتابيز`);
      allFound = false;
    }
  }

  console.log("==========================================");
  if (allFound) {
    console.log("✅ كل الرياضات موجودة!");
  } else {
    console.log("⚠️  بعض الرياضات غير موجودة — محتاج تضيفها قبل الاستيراد");
  }
  console.log("==========================================");

  process.exit(0);
}
run().catch(console.error);
