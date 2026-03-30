/**
 * Header Component - Top header with title and date
 */
export function Header() {
  const today = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between shrink-0">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          نظام نادي مكة الرياضي
        </h2>
        <p className="text-xs sm:text-sm text-gray-400">
          إدارة العمليات الداخلية
        </p>
      </div>
      <div className="text-xs sm:text-sm text-gray-400">{today}</div>
    </div>
  );
}
