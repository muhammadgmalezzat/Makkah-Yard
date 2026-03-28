// backend/src/scripts/importFriends.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");
const Package = require("../models/Package");
const User = require("../models/User");

const PACKAGE_MAP = {
  "Friends_Packages_-_12_Months": { category: "friends", durationMonths: 12 },
  "Friends_Packages_-_6_Months": { category: "friends", durationMonths: 6 },
  "Friends_Packages_-_3_Months": { category: "friends", durationMonths: 3 },
  "Friends Package - 1 Year": { category: "friends", durationMonths: 12 },
  "Friends Package - 6 Months": { category: "friends", durationMonths: 6 },
  "Friends Package - 3 Months": { category: "friends", durationMonths: 3 },
  "Friends Package - 3 months": { category: "friends", durationMonths: 3 },
  "Friends 12M": { category: "friends", durationMonths: 12 },
  "Friends 6M": { category: "friends", durationMonths: 6 },
  "Friends 3M": { category: "friends", durationMonths: 3 },
};

const sanitize = (val) => {
  if (!val) return undefined;
  const str = val.toString().trim();
  return str === "" ? undefined : str;
};

const sanitizePhone = (val) => {
  if (!val) return undefined;
  return val.toString().replace(/\s+/g, "").trim() || undefined;
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
    const parts = str.split("/");
    if (parts.length === 3) {
      const month = parseInt(parts[0]) - 1;
      const day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      if (year < 100) year += 2000;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

async function run() {
  const filePath = process.argv[2];
  const isDryRun = process.argv.includes("--dry-run");

  if (!filePath) {
    console.error("Usage: node importFriends.js <file.xlsx> [--dry-run]");
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
  if (isDryRun) console.log("🔍 DRY RUN — no data will be saved\n");

  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    dateNF: "yyyy-mm-dd",
    defval: "",
  });

  // Normalize keys
  const normalizedRows = rows.map((row) => {
    const clean = {};
    Object.keys(row).forEach((k) => {
      clean[k.trim()] = typeof row[k] === "string" ? row[k].trim() : row[k];
    });
    return clean;
  });

  console.log(`📄 Found ${normalizedRows.length} rows`);
  console.log("==========================================");

  // Group rows into pairs (primary + partner)
  // Primary rows have an 'id' value, partner rows don't
  const pairs = [];
  let currentPrimary = null;

  for (const row of normalizedRows) {
    const id = sanitize(row["id"]);
    if (id) {
      currentPrimary = { primary: row, partner: null };
      pairs.push(currentPrimary);
    } else if (currentPrimary) {
      currentPrimary.partner = row;
    }
  }

  console.log(`👫 Found ${pairs.length} friend pairs\n`);

  let imported = 0;
  let skipped = 0;
  const errors = [];

  for (const pair of pairs) {
    const { primary, partner } = pair;
    const pairId = sanitize(primary["id"]);

    const primaryName = sanitize(primary["الاسم"]);
    const primaryPhone = sanitizePhone(primary["الجوال"]);
    const primaryEmail = sanitize(primary["الايميل"]);
    const packageName = sanitize(primary["الباقه"]);
    const startDate = excelDateToJS(primary["بدايه"]);
    const endDate = excelDateToJS(primary["نهايه"]);

    const partnerName = partner ? sanitize(partner["الاسم"]) : null;

    // Validate
    if (!primaryName) {
      errors.push({ id: pairId, message: "اسم الأساسي مطلوب" });
      continue;
    }
    if (!packageName || !PACKAGE_MAP[packageName]) {
      errors.push({ id: pairId, message: `باقة غير معروفة: "${packageName}"` });
      continue;
    }
    if (!startDate || !endDate) {
      errors.push({ id: pairId, message: "تاريخ غير صحيح" });
      continue;
    }

    // Check duplicate by phone
    if (primaryPhone) {
      const existing = await Member.findOne({ phone: primaryPhone });
      if (existing) {
        skipped++;
        console.log(`⏭️  مكرر — ${primaryName} (${primaryPhone})`);
        continue;
      }
    }

    // Find package
    const pkgMap = PACKAGE_MAP[packageName];
    const pkg = await Package.findOne({
      category: pkgMap.category,
      durationMonths: pkgMap.durationMonths,
      isActive: true,
    });
    if (!pkg) {
      errors.push({
        id: pairId,
        message: `الباقة غير موجودة في DB: ${packageName}`,
      });
      continue;
    }

    console.log(
      `${isDryRun ? "🔍" : "✅"} ID ${pairId}: ${primaryName} + ${partnerName || "بدون شريك"} | ${pkg.name} | ${startDate?.toLocaleDateString("ar-SA")} → ${endDate?.toLocaleDateString("ar-SA")}`,
    );

    if (isDryRun) {
      imported++;
      continue;
    }

    const today = new Date();
    const status = endDate < today ? "expired" : "active";

    let createdAccount = null;
    let createdPrimary = null;
    let createdPartner = null;
    let createdSubP = null;
    let createdSubPart = null;

    try {
      // Create Account
      createdAccount = await Account.create({
        type: "friends",
        status,
        createdBy: adminUserId,
      });

      // Create Primary Member
      createdPrimary = await Member.create({
        accountId: createdAccount._id,
        role: "primary",
        fullName: primaryName,
        phone: primaryPhone,
        email: primaryEmail,
        gender: "male",
      });

      // Create Primary Subscription
      createdSubP = await Subscription.create({
        memberId: createdPrimary._id,
        accountId: createdAccount._id,
        packageId: pkg._id,
        startDate,
        endDate,
        status,
        pricePaid: pkg.price,
        type: "gym",
        sport: "general",
        createdBy: adminUserId,
      });

      await Payment.create({
        subscriptionId: createdSubP._id,
        memberId: createdPrimary._id,
        amount: pkg.price,
        method: "cash",
        type: "new",
        paidAt: startDate,
        createdBy: adminUserId,
      });

      // Create Partner Member (if exists)
      if (partnerName) {
        const partnerPhone = partner ? sanitizePhone(partner["الجوال"]) : null;
        const partnerEmail = partner ? sanitize(partner["الايميل"]) : null;

        createdPartner = await Member.create({
          accountId: createdAccount._id,
          role: "partner",
          fullName: partnerName,
          phone: partnerPhone || undefined,
          email: partnerEmail || undefined,
          gender: "male",
        });

        // Partner is included in primary member's subscription - no separate subscription for them
      }

      await AuditLog.create({
        action: "new_subscription",
        performedBy: adminUserId,
        accountId: createdAccount._id,
        details: { source: "excel_import", excelId: pairId },
      });

      imported++;
    } catch (err) {
      // Rollback
      if (createdSubPart)
        await Subscription.findByIdAndDelete(createdSubPart._id);
      if (createdSubP) await Subscription.findByIdAndDelete(createdSubP._id);
      if (createdPartner) await Member.findByIdAndDelete(createdPartner._id);
      if (createdPrimary) await Member.findByIdAndDelete(createdPrimary._id);
      if (createdAccount) await Account.findByIdAndDelete(createdAccount._id);
      errors.push({ id: pairId, message: err.message });
      console.log(`❌ ID ${pairId}: ${err.message}`);
    }
  }

  console.log("\n==========================================");
  console.log("📊 نتائج استيراد الأصدقاء");
  console.log("==========================================");
  console.log(
    `✅ ${isDryRun ? "سيتم استيراد" : "تم استيراد"}: ${imported} حساب`,
  );
  console.log(`⏭️  مكرر: ${skipped}`);
  console.log(`❌ أخطاء: ${errors.length}`);
  console.log("==========================================");
  if (errors.length > 0) {
    console.log("الأخطاء:");
    errors.forEach((e) => console.log(`• ID ${e.id}: ${e.message}`));
    console.log("==========================================");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
