import { Link, useNavigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-8">نادي مكة</h1>

        <nav className="flex-1 space-y-2">
          <Link
            to="/dashboard"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            لوحة التحكم
          </Link>

          <Link
            to="/subscriptions/new"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            اشتراك جديد
          </Link>

          <Link
            to="/subscriptions/academy-only"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            أكاديمية (غير مشترك)
          </Link>

          <Link
            to="/subscriptions/search"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            البحث عن الاشتراكات
          </Link>

          <Link
            to="/packages"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            الحزم والأسعار
          </Link>
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-gray-700 pt-4 space-y-2">
          <div className="px-4 py-2">
            <p className="text-sm text-gray-400">مرحبا</p>
            <p className="font-bold">{user?.name}</p>
            <p className="text-xs text-gray-400 mt-1">
              {user?.role === "admin" && "المسؤول"}
              {user?.role === "owner" && "المالك"}
              {user?.role === "reception" && "الاستقبال"}
              {user?.role === "supervisor" && "المشرف"}
              {user?.role === "accountant" && "المحاسب"}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
          >
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            نظام نادي مكة الرياضي
          </h2>
          <p className="text-gray-600">إدارة العمليات الداخلية</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
