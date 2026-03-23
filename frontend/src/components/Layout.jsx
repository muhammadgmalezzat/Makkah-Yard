import { Link, useNavigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: "⊞" },
  { to: "/subscriptions/new", label: "اشتراك جديد", icon: "＋" },
  {
    to: "/subscriptions/add-sub-member",
    label: "إضافة عضو فرعي",
    icon: "👤",
  },
  { to: "/subscriptions/search", label: "دليل الأعضاء", icon: "🔍" },
  { to: "/packages", label: "الحزم والأسعار", icon: "📦" },
  { type: "divider" },
  { label: "الأكاديمية", type: "section" },
  { to: "/academy/dashboard", label: "لوحة التحكم", icon: "📊" },
  { to: "/academy/sports", label: "إدارة الرياضات", icon: "⚽" },
  { to: "/academy/groups", label: "إدارة المجموعات", icon: "👥" },
  { to: "/academy/new", label: "تسجيل اشتراك جديد", icon: "📝" },
  { to: "/academy/expiring", label: "الاشتراكات المنتهية", icon: "⏰" },
  { to: "/academy/coach-list", label: "قائمة المدرب", icon: "📋" },
  { type: "divider" },
  { label: "الإدارة", type: "section", roles: ["admin", "owner"] },
  {
    to: "/messaging",
    label: "إرسال رسائل",
    icon: "💬",
    roles: ["admin", "owner"],
  },
];

const roleLabels = {
  admin: "المسؤول",
  owner: "المالك",
  reception: "الاستقبال",
  supervisor: "المشرف",
  accountant: "المحاسب",
};

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-gray-50" dir="rtl">
      {/* Sidebar */}
      <div className="w-64 bg-gray-950 text-white flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-black">
              م
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">نادي مكة</h1>
              <p className="text-xs text-gray-500">الرياضي</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
            // Check role-based visibility
            if (item.roles && !item.roles.includes(user?.role)) {
              return null;
            }

            if (item.type === "divider") {
              return (
                <div
                  key={index}
                  className="my-2 border-t border-gray-800"
                ></div>
              );
            }
            if (item.type === "section") {
              return (
                <div
                  key={index}
                  className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mt-4"
                >
                  {item.label}
                </div>
              );
            }
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
              >
                <span className="text-base w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 border-t border-gray-800 pt-4">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-900 mb-2">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
              {user?.name?.charAt(0) || "؟"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400">
                {roleLabels[user?.role] || user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950 hover:text-red-300 transition"
          >
            <span>→</span>
            تسجيل الخروج
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              نظام نادي مكة الرياضي
            </h2>
            <p className="text-sm text-gray-400">إدارة العمليات الداخلية</p>
          </div>
          <div className="text-sm text-gray-400">
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
