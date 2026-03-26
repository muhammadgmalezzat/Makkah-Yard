require("dotenv").config();
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const path = require("path");

// Import models
const Account = require("../models/Account");
const Member = require("../models/Member");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const Package = require("../models/Package");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");

// Package mapping
const PACKAGE_MAP = {
  "Single Package - 1 Year": {
    category: "individual",
    durationMonths: 12,
  },
  "Single Package - 6 Months": {
    category: "individual",
    durationMonths: 6,
  },
  "Single Package - 1 year": {
    category: "individual",
    durationMonths: 12,
  },
  "Single Package - 6 months": {
    category: "individual",
    durationMonths: 6,
  },
  "Single_Package_–_3_Months": { category: "individual", durationMonths: 3 },
  "Single Package - 3 Months": { category: "individual", durationMonths: 3 },
  "Single Package - 3 months": { category: "individual", durationMonths: 3 },
};

// Sanitize function
const sanitize = (val) => {
  if (!val) return undefined;
  const str = val.toString().trim();
  return str === "" ? undefined : str;
};

// Sanitize phone - remove spaces
const sanitizePhone = (val) => {
  if (!val) return undefined;
  return val.toString().replace(/\s+/g, "").trim() || undefined;
};

// Convert Excel serial dates to JS dates
const excelDateToJS = (value) => {
  if (!value) return null;

  // If already a JS Date object
  if (value instanceof Date) return value;

  // If it's a string like "2025-09-23" or "2025/09/23"
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // If it's an Excel serial number (number)
  if (typeof value === "number") {
    // Excel serial date: days since January 1, 1900
    // BUT Excel wrongly treats 1900 as a leap year, so subtract 1
    const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + value * msPerDay);
  }

  return null;
};

// Main import function
async function importIndividuals() {
  const filePath = process.argv[2];
  const isDryRun = process.argv[3] === "--dry-run";

  // Validate arguments
  if (!filePath) {
    console.error("❌ خطأ: يجب تحديد مسار ملف Excel");
    console.error(
      "الاستخدام: node src/scripts/importIndividuals.js ./data/individuals.xlsx [--dry-run]",
    );
    process.exit(1);
  }

  // Check if file exists
  const absolutePath = path.resolve(filePath);
  if (!require("fs").existsSync(absolutePath)) {
    console.error(`❌ الملف غير موجود: ${absolutePath}`);
    process.exit(1);
  }

  // Connect to MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ تم الاتصال بقاعدة البيانات");
  } catch (err) {
    console.error("❌ فشل الاتصال بقاعدة البيانات:", err.message);
    process.exit(1);
  }

  try {
    // Find admin user
    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      throw new Error("لا يوجد أدمن في الداتابيس");
    }
    const adminUserId = admin._id;
    console.log(`✅ تم العثور على المسؤول: ${admin.email}`);

    if (isDryRun) {
      console.log("🔄 وضع المحاكاة: لن يتم حفظ أي بيانات");
    }

    // Read Excel file with date parsing
    const workbook = XLSX.readFile(absolutePath, {
      cellDates: true,
      dateNF: "yyyy-mm-dd",
    });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📄 تم قراءة ${rows.length} صفوف من الملف`);
    console.log(
      "==========================================\n🔄 جاري المعالجة...\n==========================================",
    );

    // Statistics
    let successCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2; // Excel rows start at 2 (header at 1)
      const row = rows[i];

      try {
        // Step 3: Validate row
        const fullName = sanitize(row["الاسم"]);
        const email = sanitize(row["الايميل"]);
        const phone = sanitizePhone(row["الجوال"]);
        const packageName = sanitize(row["الباقه"]);
        const startDate = excelDateToJS(row["بدايه"]);
        const endDate = excelDateToJS(row["نهايه"]);

        // Validation checks
        if (!fullName) {
          throw new Error("الاسم مطلوب");
        }

        if (!phone) {
          console.log(`⚠️  الصف ${rowIndex}: ${fullName} - رقم الجوال مفقود`);
        }

        if (!packageName) {
          throw new Error("اسم الباقة مطلوب");
        }

        if (!packageName.match(Object.keys(PACKAGE_MAP).join("|"))) {
          throw new Error(`الباقة غير معروفة "${packageName}"`);
        }

        if (!startDate || isNaN(startDate.getTime())) {
          throw new Error("تاريخ البداية غير صحيح");
        }

        if (!endDate || isNaN(endDate.getTime())) {
          throw new Error("تاريخ النهاية غير صحيح");
        }

        if (endDate <= startDate) {
          throw new Error("تاريخ النهاية يجب أن يكون أكبر من تاريخ البداية");
        }

        // Step 4: Process with manual rollback
        let createdAccount = null;
        let createdMember = null;
        let createdSubscription = null;
        let createdPayment = null;

        try {
          // a) Find package
          const packageMapping = PACKAGE_MAP[packageName];
          const pkg = await Package.findOne({
            category: packageMapping.category,
            durationMonths: packageMapping.durationMonths,
            isActive: true,
          });

          if (!pkg) {
            throw new Error(
              `لم يتم العثور على باقة: ${packageName} مدة ${packageMapping.durationMonths} شهر`,
            );
          }

          // b) Check for duplicate phone
          const existingMember = await Member.findOne({
            phone,
          });

          if (existingMember) {
            duplicateCount++;
            errors.push(`الصف ${rowIndex}: رقم الجوال مكرر "${phone}" - مكرر`);
            continue;
          }

          // Determine status based on end date
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const status = endDate < today ? "expired" : "active";

          // c) Create Account
          createdAccount = await Account.create({
            type: "individual",
            status: "active",
            createdBy: adminUserId,
          });

          // d) Create Member
          createdMember = await Member.create({
            accountId: createdAccount._id,
            role: "primary",
            fullName,
            phone,
            email: email || undefined,
            gender: "male",
            isActive: true,
          });

          // Update account's primary member
          createdAccount.primaryMemberId = createdMember._id;
          await createdAccount.save();

          // e) Create Subscription
          createdSubscription = await Subscription.create({
            memberId: createdMember._id,
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

          // f) Create Payment
          createdPayment = await Payment.create({
            subscriptionId: createdSubscription._id,
            memberId: createdMember._id,
            amount: pkg.price,
            method: "cash",
            type: "new",
            paidAt: startDate,
            createdBy: adminUserId,
          });

          // g) Create AuditLog
          await AuditLog.create({
            action: "new_subscription",
            subscriptionId: createdSubscription._id,
            performedBy: adminUserId,
            notes: `استيراد من ملف Excel - ${fullName}`,
          });

          if (!isDryRun) {
            successCount++;
            console.log(
              `✅ الصف ${rowIndex}: ${fullName} - ${phonemasked(phone)}`,
            );
          } else {
            // In dry-run mode, manually delete the created documents
            if (createdPayment)
              await Payment.findByIdAndDelete(createdPayment._id);
            if (createdSubscription)
              await Subscription.findByIdAndDelete(createdSubscription._id);
            if (createdMember)
              await Member.findByIdAndDelete(createdMember._id);
            if (createdAccount)
              await Account.findByIdAndDelete(createdAccount._id);
            successCount++;
            console.log(
              `✅ الصف ${rowIndex}: ${fullName} - ${phonemasked(phone)} (وضع المحاكاة)`,
            );
          }
        } catch (error) {
          // Manual rollback - delete in reverse order
          if (createdPayment)
            await Payment.findByIdAndDelete(createdPayment._id);
          if (createdSubscription)
            await Subscription.findByIdAndDelete(createdSubscription._id);
          if (createdMember) await Member.findByIdAndDelete(createdMember._id);
          if (createdAccount)
            await Account.findByIdAndDelete(createdAccount._id);

          errorCount++;
          errors.push(`الصف ${rowIndex}: ${error.message}`);
          console.error(`❌ الصف ${rowIndex}: ${error.message}`);
        }
      } catch (err) {
        errorCount++;
        errors.push(`الصف ${rowIndex}: ${err.message}`);
        console.error(`❌ الصف ${rowIndex}: ${err.message}`);
      }
    }

    // Step 5: Print summary
    console.log(
      "\n==========================================\n📊 نتائج الاستيراد\n==========================================",
    );
    console.log(`✅ تم استيراد: ${successCount} عضو`);
    console.log(`⏭️  مكرر (تم تخطيه): ${duplicateCount}`);
    console.log(`❌ أخطاء: ${errorCount}`);
    console.log("==========================================");

    if (errors.length > 0) {
      console.log("\n الأخطاء:");
      errors.forEach((err) => console.log(`• ${err}`));
      console.log("==========================================");
    }

    if (isDryRun) {
      console.log("\n⚠️  وضع المحاكاة: لم يتم حفظ أي بيانات في قاعدة البيانات");
    } else {
      console.log(`\n✅ تم حفظ ${successCount} عضو في قاعدة البيانات بنجاح`);
    }

    console.log("==========================================\n");
  } catch (err) {
    console.error("❌ خطأ:", err.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

// Helper to mask phone for display
function phonemasked(phone) {
  if (!phone || phone.length < 4) return phone;
  return phone.slice(0, 3) + "*" + phone.slice(-2);
}

// Run
importIndividuals().catch(console.error);
