// backend/src/scripts/importAcademyStandalone.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const Account = require("../models/Account");
const Member = require("../models/Member");
const AcademySubscription = require("../models/AcademySubscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const User = require("../models/User");

// Arabic sport name → nameEn in DB
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
  ملاكمة: "boxing",
  ملاكمه: "boxing",
  "كيك بوكس": "kickboxing",
  "كيك بوكسن": "kickboxing",
  لياقة: "fitness",
  لياقه: "fitness",
  مصارعة: "wrestling",
  مصارعه: "wrestling",
  كرة: null,
  "كرة قدم": null,
  "كره قدم": null,
};

// Price per month per sport (academy_only standalone)
const SPORT_PRICES = {
  swimming: 400,
  football1: 450,
  football2: 450,
  football3: 450,
  karate: 330,
  taekwondo: 330,
  judo: 330,
  mma: 330,
  boxing: 330,
  kickboxing: 330,
  gymnastics: 330,
  ballet: 330,
  fitness: 330,
};

const ANNUAL_PRICES = {
  swimming: 4000,
  football1: 4500,
  football2: 4500,
  football3: 4500,
  karate: 3300,
  taekwondo: 3300,
  judo: 3300,
  mma: 3300,
  boxing: 3300,
  kickboxing: 3300,
  gymnastics: 3300,
  ballet: 3300,
  fitness: 3300,
};

const sanitize = (val) => {
  if (!val) return undefined;
  const str = val.toString().trim();
  return str === "" ? undefined : str;
};
const excelDateToJS = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
  }

  if (typeof value === "string") {
    const str = value.trim();

    // MM/DD/YY or MM/DD/YYYY
    const parts = str.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      // Fix 2-digit year: 26 → 2026
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // YYYY-MM-DD
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

const calcMonths = (start, end) => {
  return Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.44));
};

const calcPrice = (sportNameEn, months) => {
  const pricePerMonth = SPORT_PRICES[sportNameEn] || 330;
  const annualPrice = ANNUAL_PRICES[sportNameEn] || 3300;
  if (months === 12) return annualPrice;
  if (months === 6) return pricePerMonth * 5;
  return pricePerMonth * months;
};

const getFootballSport = (groupName) => {
  const g = groupName.trim();
  if (g.startsWith("2")) return "football2";
  if (g.startsWith("3")) return "football3";
  return "football1";
};

async function run() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const isDryRun = args.includes("--dry-run");

  if (!filePath) {
    console.error(
      "Usage: node importAcademyStandalone.js <file.xlsx> [--dry-run]",
    );
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  const admin = await User.findOne({ role: "admin" });
  if (!admin) {
    console.error("❌ No admin found");
    process.exit(1);
  }
  const adminUserId = admin._id;
  console.log(`✅ Admin: ${admin.email}`);

  // Ensure B - Girls group exists for kickboxing
  const kickboxingSport = await Sport.findOne({ nameEn: "kickboxing" });
  if (kickboxingSport) {
    const existing = await AcademyGroup.findOne({
      sportId: kickboxingSport._id,
      name: "B - Girls",
    });
    if (!existing) {
      await AcademyGroup.create({
        sportId: kickboxingSport._id,
        name: "B - Girls",
        schedule: "يحدد لاحقاً",
        maxCapacity: 15,
        currentCount: 0,
        isActive: true,
        createdBy: adminUserId,
      });
      console.log("✅ Created B - Girls group for kickboxing");
    }
  }

  if (isDryRun) console.log("🔍 DRY RUN — no data will be saved\n");

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    dateNF: "yyyy-mm-dd",
  });

  // Normalize all row keys by trimming spaces
  const normalizedRows = rows.map((row) => {
    const clean = {};
    Object.keys(row).forEach((k) => {
      clean[k.trim()] = typeof row[k] === "string" ? row[k].trim() : row[k];
    });
    return clean;
  });

  console.log(`📄 Found ${rows.length} rows`);
  console.log("==========================================");
  console.log("🔄 Processing...");
  console.log("==========================================");

  let imported = 0;
  let skipped = 0;
  let totalPrice = 0;
  const errors = [];

  for (let i = 0; i < normalizedRows.length; i++) {
    const row = normalizedRows[i];
    const rowIndex = i + 2;

    const childName = sanitize(row["اسم الطفل"]);
    const guardianName = sanitize(row["ولي الامر"]);
    const email = sanitize(row["الايميل"]);
    const sportArabic = row["الرياضة"]?.toString().trim();
    const groupName = row["المجموعة"]?.toString().trim();
    const genderRaw = row["الجنس"]?.toString().trim();
    const startDate = excelDateToJS(row["تاريخ البداية"]);
    const endDate = excelDateToJS(row["تاريخ النهاية"]);

    // ── Validation ──────────────────────────────────────
    if (!childName) {
      errors.push({ row: rowIndex, message: "اسم الطفل مطلوب" });
      continue;
    }
    if (!sportArabic || !(sportArabic in SPORT_MAP)) {
      errors.push({
        row: rowIndex,
        message: `الرياضة غير معروفة: "${sportArabic}"`,
      });
      continue;
    }
    if (!groupName) {
      errors.push({ row: rowIndex, message: "المجموعة مطلوبة" });
      continue;
    }
    if (!startDate || !endDate) {
      errors.push({
        row: rowIndex,
        message: "تاريخ البداية أو النهاية غير صحيح",
      });
      continue;
    }
    if (endDate <= startDate) {
      errors.push({ row: rowIndex, message: "تاريخ النهاية قبل البداية" });
      continue;
    }

    // ── Sport ────────────────────────────────────────────
    let sportNameEn = SPORT_MAP[sportArabic];
    if (
      sportArabic === "كرة" ||
      sportArabic === "كرة قدم" ||
      sportArabic === "كره قدم"
    ) {
      sportNameEn = getFootballSport(groupName);
    }

    const sport = await Sport.findOne({ nameEn: sportNameEn });
    if (!sport) {
      errors.push({
        row: rowIndex,
        message: `الرياضة "${sportNameEn}" غير موجودة في DB`,
      });
      continue;
    }

    // ── Group ────────────────────────────────────────────
    const escapedGroup = groupName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const group = await AcademyGroup.findOne({
      sportId: sport._id,
      name: { $regex: `^${escapedGroup}$`, $options: "i" },
    });
    if (!group) {
      errors.push({
        row: rowIndex,
        message: `المجموعة "${groupName}" غير موجودة لرياضة ${sport.name}`,
      });
      continue;
    }

    // ── Gender ───────────────────────────────────────────
    const gender =
      genderRaw?.includes("انثى") || genderRaw?.includes("أنثى")
        ? "female"
        : "male";

    // ── Price ────────────────────────────────────────────
    const months = calcMonths(startDate, endDate);
    if (months <= 0) {
      errors.push({ row: rowIndex, message: "المدة أقل من شهر" });
      continue;
    }
    const price = calcPrice(sportNameEn, months);
    totalPrice += price;

    // ── Duplicate check ──────────────────────────────────
    const existingMember = await Member.findOne({
      fullName: childName,
      role: "child",
    });
    if (existingMember) {
      const existingSub = await AcademySubscription.findOne({
        memberId: existingMember._id,
        sportId: sport._id,
      });
      if (existingSub) {
        skipped++;
        console.log(
          `⏭️  الصف ${rowIndex}: مكرر — ${childName} (${sport.name})`,
        );
        continue;
      }
    }

    console.log(
      `${isDryRun ? "🔍" : "✅"} الصف ${rowIndex}: ${childName} | ${sport.name} | ${group.name} | ${months} شهر | ${price} ريال`,
    );

    if (isDryRun) {
      imported++;
      continue;
    }

    // ── Create records ───────────────────────────────────
    let createdAccount = null;
    let createdMember = null;
    let createdSub = null;
    let createdPayment = null;
    let memberType = "standalone";
    let parentSubscriptionId = null;

    try {
      const today = new Date();

      // Determine if this is a linked member by checking if email belongs to a parent User
      let accountId = null;
      const possibleParentUser = await User.findOne({ email: email });
      if (
        possibleParentUser &&
        possibleParentUser._id.toString() !== adminUserId.toString()
      ) {
        // Email belongs to a non-admin user, this is a linked member
        const parentAccount = await Account.findOne({
          userId: possibleParentUser._id,
        });
        if (parentAccount) {
          accountId = parentAccount._id;
          memberType = "linked";
          // For linked members, find parent subscription to use as parentSubscriptionId
          const parentSub = await AcademySubscription.findOne({
            accountId: parentAccount._id,
            sportId: sport._id,
          });
          if (parentSub) {
            parentSubscriptionId = parentSub._id;
          }
        }
      }

      // Create new account only for standalone members
      if (!accountId) {
        createdAccount = await Account.create({
          type: "academy_only",
          status: endDate < today ? "expired" : "active",
          createdBy: adminUserId,
        });
        accountId = createdAccount._id;
      }

      createdMember = await Member.create({
        accountId: accountId,
        role: "child",
        fullName: childName,
        gender,
        guardianName,
        email,
      });

      createdSub = await AcademySubscription.create({
        memberId: createdMember._id,
        accountId: accountId,
        sportId: sport._id,
        groupId: group._id,
        memberType: memberType,
        parentSubscriptionId: parentSubscriptionId,
        durationMonths: months,
        startDate,
        endDate,
        pricePaid: price,
        paymentMethod: "cash",
        status: endDate < today ? "expired" : "active",
        createdBy: adminUserId,
      });

      createdPayment = await Payment.create({
        subscriptionId: createdSub._id,
        memberId: createdMember._id,
        amount: price,
        method: "cash",
        type: "new",
        paidAt: startDate,
        createdBy: adminUserId,
      });

      await AuditLog.create({
        action: "new_subscription",
        performedBy: adminUserId,
        accountId: accountId,
        details: {
          source: "excel_import",
          sport: sportNameEn,
          childName,
          memberType: memberType,
        },
      });

      await AcademyGroup.findByIdAndUpdate(group._id, {
        $inc: { currentCount: 1 },
      });

      imported++;
    } catch (err) {
      if (createdPayment) await Payment.findByIdAndDelete(createdPayment._id);
      if (createdSub)
        await AcademySubscription.findByIdAndDelete(createdSub._id);
      if (createdMember) await Member.findByIdAndDelete(createdMember._id);
      if (createdAccount) await Account.findByIdAndDelete(createdAccount._id);
      errors.push({ row: rowIndex, message: err.message });
      console.log(`❌ الصف ${rowIndex}: ${err.message}`);
    }
  }

  // ── Summary ──────────────────────────────────────────
  console.log("\n==========================================");
  console.log("📊 نتائج استيراد أكاديمية (أ.غ.م)");
  console.log("==========================================");
  console.log(
    `✅ ${isDryRun ? "سيتم استيراد" : "تم استيراد"}: ${imported} طفل`,
  );
  console.log(`⏭️  مكرر (تم تخطيه): ${skipped}`);
  console.log(`❌ أخطاء: ${errors.length}`);
  if (isDryRun)
    console.log(
      `💰 إجمالي المبالغ المتوقعة: ${totalPrice.toLocaleString()} ريال`,
    );
  console.log("==========================================");
  if (errors.length > 0) {
    console.log("الأخطاء:");
    errors.forEach((e) => console.log(`• الصف ${e.row}: ${e.message}`));
    console.log("==========================================");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
