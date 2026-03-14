# Excel Import Script Guide

## Overview

This script imports individual gym members from an Excel file into the database.

## Setup

### 1. Install xlsx package

```bash
npm install xlsx
```

### 2. Prepare your Excel file

Create an Excel file with these columns (in any order):

- **الاسم** - Full name (required)
- **الايميل** - Email (optional)
- **الدرجه** - Grade/Level (not currently used)
- **الجوال** - Phone number (required, no spaces)
- **الباقه** - Package name (required, must be one of):
  - "Single Package - 1 Year"
  - "Single Package - 6 Months"
  - "Single Package - 1 year"
  - "Single Package - 6 months"
- **بدايه** - Start date (required, format: YYYY-MM-DD)
- **نهايه** - End date (required, format: YYYY-MM-DD)

### 3. Place Excel file in data directory

Move your Excel file to: `backend/src/data/individuals.xlsx`

## Usage

### Normal mode (saves to database)

```bash
cd backend
node src/scripts/importIndividuals.js ./src/data/individuals.xlsx
```

### Dry-run mode (validates only, no database writes)

```bash
cd backend
node src/scripts/importIndividuals.js ./src/data/individuals.xlsx --dry-run
```

## Output

The script will display:

- ✅ Number of successfully imported members
- ⏭️ Number of duplicate phone numbers (skipped)
- ❌ Number of errors with details

Example:

```
==========================================
📊 نتائج الاستيراد
==========================================
✅ تم استيراد: 45 عضو
⏭️  مكرر (تم تخطيه): 2
❌ أخطاء: 3
==========================================

 الأخطاء:
• الصف 5: الباقة غير معروفة "Premium"
• الصف 12: تاريخ النهاية يجب أن يكون أكبر من تاريخ البداية
==========================================
```

## What Gets Created

For each imported member:

1. **Account** - Individual account type
2. **Member** - Primary member record
3. **Subscription** - Gym subscription with dates and package
4. **Payment** - Initial payment record (marked as "cash")
5. **AuditLog** - Activity log entry

## Features

✅ **Validation**

- Checks required fields (name, phone, package)
- Validates date formats and logic
- Detects duplicate phone numbers
- Verifies packages exist in database

✅ **Transactions**

- All records for one member are created together
- If one step fails, entire row is rolled back

✅ **Dry-run Mode**

- Test your data without making changes
- Validate all data before actual import

✅ **Error Handling**

- Skips rows with errors without stopping
- Shows detailed error messages for each row
- Provides summary with all errors

## Notes

- All members are set to gender: "male" (can be updated in admin panel later)
- All payments are marked as "cash" method
- Account status is set based on end date (active/expired)
- Subscription status is set based on end date (active/expired)
- Package must exist in database with matching category and duration
- Phone numbers have spaces removed automatically
- Requires an admin user in the database for createdBy field
