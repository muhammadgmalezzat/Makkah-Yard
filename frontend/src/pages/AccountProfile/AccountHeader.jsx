/**
 * AccountHeader - Primary member subscription header box
 */
export function AccountHeader({
  primaryMember,
  primarySub,
  accountType,
  isSubscriptionActive,
  statusConfig,
}) {
  if (!primaryMember || !primarySub) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            {primaryMember.fullName}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {accountType.icon} {accountType.label}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isSubscriptionActive && (
            <>
              <button className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition min-h-[44px]">
                تجديد
              </button>
              <button className="px-4 py-2 bg-yellow-600 text-white text-sm font-semibold rounded-lg hover:bg-yellow-700 transition min-h-[44px]">
                تجميد
              </button>
            </>
          )}
          <button className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition min-h-[44px]">
            عرض المدفوعات
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">الباقة</p>
          <p className="font-bold text-gray-900">
            {primarySub.packageId?.name || "-"}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">البداية</p>
          <p className="font-bold text-gray-900">
            {new Date(primarySub.startDate).toLocaleDateString("ar-SA")}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">النهاية</p>
          <p className="font-bold text-gray-900">
            {new Date(primarySub.endDate).toLocaleDateString("ar-SA")}
          </p>
        </div>
        <div className="bg-white rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">الحالة</p>
          <span
            className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
              statusConfig[primarySub.status]?.badge ||
              "bg-gray-100 text-gray-700"
            }`}
          >
            {statusConfig[primarySub.status]?.label || primarySub.status}
          </span>
        </div>
      </div>

      {primarySub.isFrozen && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-yellow-700 text-sm font-medium">
            ⏸️ الحساب مجمد من{" "}
            {new Date(primarySub.freezeStart).toLocaleDateString("ar-SA")} إلى{" "}
            {new Date(primarySub.freezeEnd).toLocaleDateString("ar-SA")}
          </p>
        </div>
      )}
    </div>
  );
}
