# نظام نادي مكة الرياضي - Makkah Yard Gym System

## نظرة عامة

نظام إدارة نادي رياضي داخلي مبني على MERN Stack (MongoDB, Express, React, Node.js). يدير الاشتراكات والدفعات والعمليات اليومية.

## البنية الأساسية

```
Makkah-Yard/
├── backend/              # خادم Node.js + Express
│   ├── src/
│   │   ├── config/       # إعدادات قاعدة البيانات
│   │   ├── models/       # نماذج Mongoose (7 نماذج)
│   │   ├── middleware/   # المصادقة والمعالجة
│   │   ├── routes/       # المسارات
│   │   ├── controllers/  # معالجات الطلبات
│   │   ├── services/     # خدمات المنطق
│   │   └── seeds/        # بيانات البداية
│   ├── server.js         # ملف الخادم الرئيسي
│   ├── .env              # متغيرات البيئة
│   └── package.json
│
└── frontend/             # تطبيق React مع Vite
    ├── src/
    │   ├── api/          # Axios instance
    │   ├── store/        # Zustand auth store
    │   ├── pages/        # 6 صفحات
    │   ├── components/   # مكونات
    │   ├── App.jsx       # الموجه الرئيسي
    │   └── index.css     # Tailwind CSS
    ├── .env              # متغيرات البيئة
    └── package.json
```

## المتطلبات

- Node.js v18+
- MongoDB (تشغيل محلي)
- npm v9+

## التثبيت والتشغيل

### 1. البنية (Backend)

```bash
cd backend

# تشغيل البذرة (seed) - إدراج البيانات الأولية
npm run seed

# تشغيل الخادم
npm run dev
# الخادم سيعمل على: http://localhost:5000
```

### 2. الواجهة (Frontend)

```bash
cd frontend

# تشغيل خادم التطوير
npm run dev
# الواجهة ستعمل على: http://localhost:5173
```

## حسابات الاختبار

بعد تشغيل `npm run seed`:

- **Admin**: admin@gym.com / admin123456
- **Reception**: reception@gym.com / reception123

## الصفحات (6 صفحات)

1. **تسجيل الدخول** (`/login`)
2. **لوحة التحكم** (`/dashboard`)
3. **الحزم والأسعار** (`/packages`)
4. **اشتراك جديد** (`/subscriptions/new`)
5. **البحث عن الاشتراكات** (`/subscriptions/search`)
6. **تجديد الاشتراك** (`/subscriptions/:id/renew`)

## نماذج البيانات (7 نماذج)

1. User (المستخدمون)
2. Package (الحزم - 20 حزمة)
3. Account (الحسابات)
4. Member (الأعضاء)
5. Subscription (الاشتراكات)
6. Payment (الدفعات)
7. AuditLog (سجل التدقيق)

## الواجهة البرمجية (API)

```
POST   /api/auth/login
GET    /api/auth/me
GET    /api/packages
POST   /api/packages (admin/owner)
PUT    /api/packages/:id (admin/owner)
POST   /api/subscriptions
GET    /api/subscriptions/search?q=
GET    /api/subscriptions/:id
POST   /api/subscriptions/:id/renew
```

## معلومات إضافية

جميع العمليات متعددة الخطوات تستخدم MongoDB Transactions للتأكد من السلامة.

رسائل الخطأ والواجهة بالعربية بالكامل.
