/**
 * ResultCard - Individual subscription result card
 */
export function ResultCard({
  result,
  onViewAccount,
  onViewProfile,
  onDelete,
  isDeleting,
  canDelete,
  statusConfig,
  isExpired,
}) {
  const member = result.member;
  const memberName = member?.fullName || "Unknown";
  const phone = member?.phone || "-";
  const hasGymSub = result.gymSubscription;
  const hasAcademySubs = result.academySubscriptions?.length > 0;

  // Determine primary display type
  let primaryBadgeLabel = "بدون اشتراك";
  let primaryBadgeColor = "bg-gray-100 text-gray-600";
  let details = null;
  let actionButton = null;

  if (hasGymSub) {
    primaryBadgeLabel = "جيم";
    primaryBadgeColor = "bg-blue-100 text-blue-700";
    const packageName = result.gymSubscription?.packageId?.name || "لا يوجد";
    const endDate = result.gymSubscription?.endDate;
    const status =
      statusConfig[result.gymSubscription?.status] || statusConfig.active;

    details = (
      <>
        <div className="text-sm mb-3">
          <p className="text-gray-600 text-xs mb-1">الباقة</p>
          <p className="font-semibold text-gray-900">{packageName}</p>
        </div>
        {endDate && (
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-gray-600">
              {new Date(endDate).toLocaleDateString("ar-SA")}
            </span>
            <span className={`px-2 py-1 rounded font-medium ${status.classes}`}>
              {status.label}
            </span>
          </div>
        )}
      </>
    );

    actionButton = (
      <button
        onClick={() => onViewAccount(result.accountId)}
        className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition min-h-[44px] flex items-center justify-center"
      >
        عرض الحساب
      </button>
    );
  } else if (hasAcademySubs) {
    primaryBadgeLabel = "أكاديمية";
    primaryBadgeColor = "bg-purple-100 text-purple-700";
    const firstAcademy = result.academySubscriptions[0];
    const sportName = firstAcademy?.sportId?.name || "رياضة";
    const groupName = firstAcademy?.groupId?.name || "مجموعة";
    const endDate = firstAcademy?.endDate;
    const status = statusConfig[firstAcademy?.status] || statusConfig.active;

    details = (
      <>
        <div className="text-sm mb-3">
          <p className="text-gray-600 text-xs mb-1">⚽ {sportName}</p>
          <p className="font-semibold text-gray-900">{groupName}</p>
        </div>
        {endDate && (
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="text-gray-600">
              {new Date(endDate).toLocaleDateString("ar-SA")}
            </span>
            <span className={`px-2 py-1 rounded font-medium ${status.classes}`}>
              {status.label}
            </span>
          </div>
        )}
        {result.academySubscriptions.length > 1 && (
          <p className="text-xs text-gray-500 mb-3">
            +{result.academySubscriptions.length - 1} رياضة أخرى
          </p>
        )}
      </>
    );

    actionButton = (
      <button
        onClick={() => onViewProfile(member._id)}
        className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-semibold hover:bg-purple-700 transition min-h-[44px] flex items-center justify-center"
      >
        عرض الملف
      </button>
    );
  }

  return (
    <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex flex-col h-full">
      {canDelete && (
        <button
          onClick={() => onDelete(result.accountId, memberName)}
          className="absolute top-10 left-5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full p-2 transition"
          title="حذف الحساب"
          disabled={isDeleting}
        >
          🗑️
        </button>
      )}

      {isDeleting && (
        <div className="absolute inset-0 bg-white bg-opacity-80 rounded-2xl flex items-center justify-center z-10">
          <span className="text-red-500 text-sm font-medium">
            جاري الحذف...
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
            {memberName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">
              {memberName}
            </p>
            <p className="text-xs text-gray-500 truncate">{phone}</p>
          </div>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${primaryBadgeColor}`}
        >
          {primaryBadgeLabel}
        </span>
      </div>

      <div className="flex-1">{details}</div>
      {actionButton}
    </div>
  );
}
