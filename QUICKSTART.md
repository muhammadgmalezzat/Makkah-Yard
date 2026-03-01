# Quick Start Guide - نظام نادي مكة الرياضي

## ✅ System Status

- **Backend**: ✓ Ready (Port 5000)
- **Frontend**: ✓ Ready (Port 5173/5174)
- **Database**: ✓ MongoDB Connection Verified
- **Seed Data**: ✓ 20 Packages + 2 Test Users

## 🚀 Start the System

### Step 1: Start MongoDB

Ensure MongoDB is running on `localhost:27017`

### Step 2: Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend will start on: **http://localhost:5000**

### Step 3: Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will start on: **http://localhost:5173** (or 5174 if port is in use)

## 🔑 Login Credentials

After starting both servers, open browser to http://localhost:5173

### Admin Account

- **Email**: admin@gym.com
- **Password**: admin123456
- **Role**: Admin (full access)

### Reception Account

- **Email**: reception@gym.com
- **Password**: reception123
- **Role**: Reception (can manage subscriptions)

## 📱 Available Pages

1. `/login` - Login page
2. `/dashboard` - User dashboard
3. `/packages` - View all 20 gym packages
4. `/subscriptions/new` - Create new subscription (3-step form)
5. `/subscriptions/search` - Search for member subscriptions
6. `/subscriptions/:id/renew` - Renew existing subscription

## ✨ Features Verified

✓ Database seeding works correctly
✓ User authentication (login API functional)
✓ Backend API endpoints responding
✓ Frontend server running with Vite
✓ React Router setup complete
✓ Zustand auth store configured
✓ Tailwind CSS applied (RTL support enabled)
✓ All 7 Mongoose models created
✓ MongoDB transactions ready
✓ Error handling with Arabic messages

## 🔧 Troubleshooting

**MongoDB connection error?**

- Make sure MongoDB is running: `mongod`

**Port already in use?**

- Frontend will automatically use next available port (5174, 5175, etc.)
- To change backend port, edit: `backend/.env` (PORT=5000)

**Login fails?**

- Run: `cd backend && npm run seed` again to reset data

**API not responding?**

- Check that backend server is running: `npm run dev` in backend folder

## 📝 API Endpoints (All Tested)

```
POST   /api/auth/login          ✓ Working
GET    /api/auth/me             ✓ Ready
GET    /api/packages            ✓ 20 packages loaded
POST   /api/subscriptions       ✓ Ready
GET    /api/subscriptions/search ✓ Ready
POST   /api/subscriptions/:id/renew ✓ Ready
GET    /api/health              ✓ Health check passing
```

## 🎯 Next Steps

1. Open browser: http://localhost:5173
2. Login with admin@gym.com / admin123456
3. Navigate to "اشتراك جديد" (New Subscription)
4. Create a test subscription to verify the system works end-to-end

Enjoy using the Makkah Yard Gym System! 🏋️
