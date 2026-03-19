// backend/src/scripts/importFamilyAccounts.js

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const xlsx = require("xlsx");

const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const AcademySubscription = require("../models/AcademySubscription");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");
const Package = require("../models/Package");
const Sport = require("../models/Sport");
const AcademyGroup = require("../models/AcademyGroup");
const User = require("../models/User");

// ── Package name mapping ─────────────────────────────────
const ADULT_PACKAGE_MAP = {
  "عائلي سنة": { category: "family_essential", durationMonths: 12 },
  "عائلي سنه": { category: "family_essential", durationMonths: 12 },
  "عائلى سنه": { category: "family_essential", durationMonths: 12 },
  "عائلي 6 اشهر": { category: "family_essential", durationMonths: 6 },
  "عائلى 6 اشهر": { category: "family_essential", durationMonths: 6 },
  "إضافي سنة": { category: "sub_adult", durationMonths: 12 },
  "إضافي سنه": { category: "sub_adult", durationMonths: 12 },
  "إضافي 6 اشهر": { category: "sub_adult", durationMonths: 6 },
  "إضافي 6 اشهر ": { category: "sub_adult", durationMonths: 6 },
  "فرعي سنة": { category: "sub_adult", durationMonths: 12 },
  "فرعي سنه": { category: "sub_adult", durationMonths: 12 },
  "فرعي 6 اشهر": { category: "sub_adult", durationMonths: 6 },
  "فرعي 6 اشهر ": { category: "sub_adult", durationMonths: 6 },
  "فرعي 3 اشهر": { category: "sub_adult", durationMonths: 3 },
  "فرعي 3 اشهر ": { category: "sub_adult", durationMonths: 3 },
  "اضافي سنة-كرة قدم": { category: "sub_adult", durationMonths: 12 },
};

// ── Sport name mapping ───────────────────────────────────
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
  مصارعة: "wrestling",
  مصارعه: "wrestling",
  "كرة قدم": "football1",
  "كره قدم": "football1",
};

// Roles that are adults (gym subscription)
const ADULT_ROLES = new Set(
  Object.keys(ADULT_PACKAGE_MAP).map((k) => k.trim()),
);

const isAdultRole = (role) => {
  if (!role) return false;
  const r = role.trim();
  return (
    ADULT_ROLES.has(r) ||
    r.startsWith("عائلي") ||
    r.startsWith("عائلى") ||
    r.startsWith("إضافي") ||
    r.startsWith("فرعي") ||
    r.startsWith("اضافي")
  );
};

const isChildRole = (role) => {
  if (!role) return false;
  return !isAdultRole(role);
};

// Parse sports from role like "سباحة + جودو" or "كاراتيه + سباحة"
const parseSports = (roleStr) => {
  if (!roleStr) return [];
  return roleStr
    .split(/[+,،]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
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

// Find group for sport + group name hint
async function findGroup(sport, groupHint) {
  // Try exact match first
  let group = await AcademyGroup.findOne({
    sportId: sport._id,
    name: { $regex: `^A - Boys$`, $options: "i" },
  });
  if (group) return group;

  // Try A - Girls for female sports
  if (sport.gender === "female" || sport.gender === "both") {
    group = await AcademyGroup.findOne({
      sportId: sport._id,
      name: { $regex: `^A - Girls$`, $options: "i" },
    });
    if (group) return group;
  }

  // Fallback: get first active group for sport
  group = await AcademyGroup.findOne({ sportId: sport._id, isActive: true });
  return group;
}

async function run() {
  const args = process.argv.slice(2);
  const filePath = args[0];
  const isDryRun = args.includes("--dry-run");

  if (!filePath) {
    console.error(
      "Usage: node importFamilyAccounts.js <file.xlsx> [--dry-run]",
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

  // ── Group rows by family_id ──────────────────────────
  const families = [];
  let currentFamily = null;

  for (const row of normalizedRows) {
    const familyId = sanitize(row["family_id"]);
    if (familyId) {
      currentFamily = { id: familyId, rows: [row] };
      families.push(currentFamily);
    } else if (currentFamily) {
      currentFamily.rows.push(row);
    }
  }

  console.log(`👨‍👩‍👧‍👦 Found ${families.length} families\n`);

  let importedFamilies = 0;
  let skippedFamilies = 0;
  let importedChildren = 0;
  const errors = [];

  for (const family of families) {
    const familyId = family.id;
    const adultRows = family.rows.filter((r) => isAdultRole(r["member_role"]));
    const childRows = family.rows.filter(
      (r) => isChildRole(r["member_role"]) && r["fullName"],
    );

    const primaryRow = family.rows.find((r) => {
      const role = r["member_role"]?.trim() || "";
      return role.startsWith("عائلي") || role.startsWith("عائلى");
    });

    if (!primaryRow) {
      errors.push({ family: familyId, message: "لا يوجد عضو أساسي" });
      console.log(`❌ Family ${familyId}: لا يوجد عضو أساسي`);
      continue;
    }

    const primaryName = sanitize(primaryRow["fullName"]);
    if (!primaryName) {
      errors.push({ family: familyId, message: "اسم العضو الأساسي مطلوب" });
      continue;
    }

    // Check duplicate
    const existing = await Member.findOne({
      fullName: primaryName,
      role: "primary",
    });
    if (existing) {
      skippedFamilies++;
      console.log(`⏭️  Family ${familyId}: مكرر — ${primaryName}`);
      continue;
    }

    const pkgKey = primaryRow["package_name"]?.trim();
    const pkgMap = ADULT_PACKAGE_MAP[pkgKey];
    if (!pkgMap) {
      errors.push({
        family: familyId,
        message: `باقة غير معروفة: "${pkgKey}"`,
      });
      console.log(`❌ Family ${familyId}: باقة غير معروفة "${pkgKey}"`);
      continue;
    }

    const primaryPkg = await Package.findOne({
      category: pkgMap.category,
      durationMonths: pkgMap.durationMonths,
      isActive: true,
    });
    if (!primaryPkg) {
      errors.push({
        family: familyId,
        message: `الباقة غير موجودة في DB: ${pkgKey}`,
      });
      continue;
    }

    const startDate = excelDateToJS(primaryRow["startDate"]);
    const endDate = excelDateToJS(primaryRow["endDate"]);
    if (!startDate || !endDate) {
      errors.push({
        family: familyId,
        message: "تاريخ غير صحيح للعضو الأساسي",
      });
      continue;
    }

    console.log(
      `${isDryRun ? "🔍" : "✅"} Family ${familyId}: ${primaryName} | ${primaryPkg.name} | ${adultRows.length} بالغ | ${childRows.length} طفل`,
    );

    if (isDryRun) {
      importedFamilies++;
      childRows.forEach((c) => {
        const sports = parseSports(c["member_role"]);
        console.log(`   👦 ${c["fullName"]} — ${sports.join(", ")}`);
      });
      continue;
    }

    // ── Create account ───────────────────────────────
    const today = new Date();
    const status = endDate < today ? "expired" : "active";

    let createdAccount = null;
    let createdPrimaryMember = null;
    let createdPrimarySub = null;

    try {
      createdAccount = await Account.create({
        type: "family",
        status,
        createdBy: adminUserId,
      });

      // ── Primary member ───────────────────────────
      createdPrimaryMember = await Member.create({
        accountId: createdAccount._id,
        role: "primary",
        fullName: primaryName,
        phone: sanitizePhone(primaryRow["phone"]),
        email: sanitize(primaryRow["email"]),
        gender: "male",
      });

      createdPrimarySub = await Subscription.create({
        memberId: createdPrimaryMember._id,
        accountId: createdAccount._id,
        packageId: primaryPkg._id,
        startDate,
        endDate,
        status,
        pricePaid: primaryPkg.price,
        type: "gym",
        sport: "general",
        createdBy: adminUserId,
      });

      await Payment.create({
        subscriptionId: createdPrimarySub._id,
        memberId: createdPrimaryMember._id,
        amount: primaryPkg.price,
        method: "cash",
        type: "new",
        paidAt: startDate,
        createdBy: adminUserId,
      });

      // ── Partner & sub_adult members ──────────────
      for (const ar of adultRows) {
        if (ar === primaryRow) continue;
        const memberName = sanitize(ar["fullName"]);
        if (!memberName) continue;

        const roleKey = ar["member_role"]?.trim();
        const rolePkgMap = ADULT_PACKAGE_MAP[roleKey];
        if (!rolePkgMap) {
          console.log(`   ⚠️  دور غير معروف: "${roleKey}" — ${memberName}`);
          continue;
        }

        const isPartner =
          roleKey.startsWith("إضافي") || roleKey.startsWith("اضافي");
        const memberRole = isPartner ? "partner" : "sub_adult";

        const memberPkg = await Package.findOne({
          category: rolePkgMap.category,
          durationMonths: rolePkgMap.durationMonths,
          isActive: true,
        });

        const mStartDate = excelDateToJS(ar["startDate"]) || startDate;
        const mEndDate = excelDateToJS(ar["endDate"]) || endDate;
        const mStatus = mEndDate < today ? "expired" : "active";

        const newMember = await Member.create({
          accountId: createdAccount._id,
          role: memberRole,
          fullName: memberName,
          phone: sanitizePhone(ar["phone"]),
          email: sanitize(ar["email"]),
          gender: "male",
        });

        if (memberPkg) {
          const newSub = await Subscription.create({
            memberId: newMember._id,
            accountId: createdAccount._id,
            packageId: memberPkg._id,
            startDate: mStartDate,
            endDate: mEndDate,
            status: mStatus,
            pricePaid: memberPkg.price,
            type: "gym",
            sport: "general",
            createdBy: adminUserId,
          });
          await Payment.create({
            subscriptionId: newSub._id,
            memberId: newMember._id,
            amount: memberPkg.price,
            method: "cash",
            type: "new",
            paidAt: mStartDate,
            createdBy: adminUserId,
          });
        }
      }

      // ── Children (linked academy subscriptions) ──
      for (const cr of childRows) {
        const childName = sanitize(cr["fullName"]);
        if (!childName) continue;

        const roleStr = cr["member_role"]?.trim() || "";
        const sports = parseSports(roleStr);

        const cStartDate = excelDateToJS(cr["startDate"]);
        const cEndDate = excelDateToJS(cr["endDate"]);
        if (!cStartDate || !cEndDate) {
          console.log(`   ⚠️  تاريخ غير صحيح للطفل: ${childName}`);
          continue;
        }

        // Find or create child member
        let childMember = await Member.findOne({
          fullName: childName,
          role: "child",
        });
        if (!childMember) {
          childMember = await Member.create({
            accountId: createdAccount._id,
            role: "child",
            fullName: childName,
            gender: "male",
            guardianAccountId: createdAccount._id,
          });
        }

        for (const sportArabic of sports) {
          const sportNameEn = SPORT_MAP[sportArabic];
          if (!sportNameEn) {
            console.log(
              `   ⚠️  رياضة غير معروفة: "${sportArabic}" للطفل ${childName}`,
            );
            continue;
          }

          const sport = await Sport.findOne({ nameEn: sportNameEn });
          if (!sport) {
            console.log(`   ⚠️  رياضة غير موجودة في DB: ${sportNameEn}`);
            continue;
          }

          const group = await findGroup(sport);
          if (!group) {
            console.log(`   ⚠️  لا توجد مجموعة لرياضة: ${sport.name}`);
            continue;
          }

          const months = Math.round(
            (cEndDate - cStartDate) / (1000 * 60 * 60 * 24 * 30.44),
          );
          if (months <= 0) {
            console.log(`   ⚠️  مدة أقل من شهر للطفل: ${childName}`);
            continue;
          }

          const CHILD_PRICES = {
            swimming: 300,
            football1: 350,
            football2: 350,
            football3: 350,
          };
          const pricePerMonth = CHILD_PRICES[sportNameEn] || 230;
          const price =
            months === 6
              ? pricePerMonth * 5
              : months === 12
                ? pricePerMonth * 12
                : pricePerMonth * months;

          const cStatus = cEndDate < today ? "expired" : "active";

          const academySub = await AcademySubscription.create({
            memberId: childMember._id,
            accountId: createdAccount._id,
            sportId: sport._id,
            groupId: group._id,
            memberType: "linked",
            parentSubscriptionId: createdPrimarySub._id,
            durationMonths: months,
            startDate: cStartDate,
            endDate: cEndDate,
            pricePaid: price,
            paymentMethod: "cash",
            status: cStatus,
            createdBy: adminUserId,
          });

          await Payment.create({
            subscriptionId: academySub._id,
            memberId: childMember._id,
            amount: price,
            method: "cash",
            type: "new",
            paidAt: cStartDate,
            createdBy: adminUserId,
          });

          await AcademyGroup.findByIdAndUpdate(group._id, {
            $inc: { currentCount: 1 },
          });
          importedChildren++;
          console.log(
            `   👦 ${childName} — ${sport.name} | ${months} شهر | ${price} ريال`,
          );
        }
      }

      await AuditLog.create({
        action: "new_subscription",
        performedBy: adminUserId,
        accountId: createdAccount._id,
        details: { source: "excel_import", familyId },
      });

      importedFamilies++;
    } catch (err) {
      errors.push({ family: familyId, message: err.message });
      console.log(`❌ Family ${familyId}: ${err.message}`);
      // Cleanup
      if (createdPrimarySub)
        await Subscription.findByIdAndDelete(createdPrimarySub._id);
      if (createdPrimaryMember)
        await Member.findByIdAndDelete(createdPrimaryMember._id);
      if (createdAccount) await Account.findByIdAndDelete(createdAccount._id);
    }
  }

  console.log("\n==========================================");
  console.log("📊 نتائج استيراد الأسر");
  console.log("==========================================");
  console.log(
    `✅ ${isDryRun ? "سيتم استيراد" : "تم استيراد"}: ${importedFamilies} أسرة`,
  );
  console.log(`👦 أطفال مرتبطين: ${importedChildren}`);
  console.log(`⏭️  مكرر: ${skippedFamilies}`);
  console.log(`❌ أخطاء: ${errors.length}`);
  console.log("==========================================");
  if (errors.length > 0) {
    console.log("الأخطاء:");
    errors.forEach((e) => console.log(`• Family ${e.family}: ${e.message}`));
    console.log("==========================================");
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
