import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

const navItems = [
  { to: "/dashboard", label: "لوحة التحكم", icon: "⊞" },
  { to: "/club-dashboard", label: "لوحة تحكم النادي", icon: "📈" },
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

export function Sidebar({ isOpen, onClose, onLogout }) {
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed top-0 right-0 h-full w-64 bg-gray-950 text-white flex flex-col shrink-0 z-40
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0 lg:relative lg:shadow-none lg:border-l
        `}
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-gray-800 relative">
          <button
            onClick={onClose}
            className="lg:hidden absolute top-4 left-4 text-gray-500 text-xl min-h-[44px] w-[44px] flex items-center justify-center"
          >
            ✕
          </button>
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

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
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
                onClick={onClose}
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

        {/* User Section */}
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
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-950 hover:text-red-300 transition"
          >
            <span>→</span>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
}
