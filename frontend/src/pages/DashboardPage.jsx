import { useAuthStore } from "../store/authStore";

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold">لوحة التحكم</h1>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <h2 className="text-lg sm:text-2xl font-bold mb-4">أهلا وسهلا</h2>
        <p className="text-gray-700 text-sm sm:text-base lg:text-lg">
          مرحبا بك في نظام نادي مكة، {user?.name}
        </p>
        <p className="text-gray-600 text-sm sm:text-base mt-2">
          دورك: {user?.role}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200">
          <h3 className="text-base sm:text-lg font-bold text-blue-900">
            العمليات السريعة
          </h3>
          <p className="text-sm sm:text-base text-blue-700 mt-2">
            من قائمة التنقل، يمكنك:
          </p>
          <ul className="list-disc list-inside text-sm sm:text-base text-blue-700 mt-2 space-y-1">
            <li>إنشاء اشتراك جديد</li>
            <li>البحث عن الاشتراكات</li>
            <li>تجديد الاشتراكات</li>
            <li>عرض جميع الحزم</li>
          </ul>
        </div>

        <div className="bg-green-50 p-4 sm:p-6 rounded-lg border border-green-200">
          <h3 className="text-base sm:text-lg font-bold text-green-900">
            معلومات النظام
          </h3>
          <ul className="text-sm sm:text-base text-green-700 mt-2 space-y-1">
            <li>الإصدار: 1.0.0</li>
            <li>المرحلة: الأولى (MVP)</li>
            <li>الحالة: تشغيل عادي</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
