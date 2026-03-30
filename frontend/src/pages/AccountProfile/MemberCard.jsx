function calculateAge(dateOfBirth) {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * MemberCard - Individual member card with subscriptions
 */
export function MemberCard({
  memberData,
  roleConfig,
  statusConfig,
  onEditMember,
  onEditSubscription,
}) {
  const m = memberData.member;
  const gymSub = memberData.gymSubscription;
  const academySubs = memberData.academySubscriptions || [];

  let displayRole = roleConfig[m.role] || {
    label: m.role,
    badge: "bg-gray-100 text-gray-700",
  };

  let isChildWithAcademy = m.role === "child" && academySubs.length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${displayRole.badge}`}
        >
          {isChildWithAcademy ? "طفل أكاديمية" : displayRole.label}
        </span>
      </div>

      <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
        <div className="flex justify-between">
          <span className="text-gray-600 text-sm">الاسم:</span>
          <span className="font-bold text-gray-900">{m.fullName}</span>
        </div>

        {m.phone && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">الجوال:</span>
            <span className="font-bold text-gray-900">{m.phone}</span>
          </div>
        )}

        {m.gender && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">الجنس:</span>
            <span className="font-bold text-gray-900">
              {m.gender === "male" ? "ذكر" : "أنثى"}
            </span>
          </div>
        )}

        {m.nationalId && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">الهوية:</span>
            <span className="font-bold text-gray-900">{m.nationalId}</span>
          </div>
        )}

        {m.dateOfBirth && (
          <div className="flex justify-between">
            <span className="text-gray-600 text-sm">تاريخ الميلاد:</span>
            <span className="font-bold text-gray-900">
              {new Date(m.dateOfBirth).toLocaleDateString("ar-SA")} (عمر:{" "}
              {calculateAge(m.dateOfBirth)})
            </span>
          </div>
        )}
      </div>

      {m.role === "partner" && !gymSub && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-700 font-medium">
            ✅ مشمول في اشتراك العضو الأساسي
          </div>
        </div>
      )}

      {gymSub && (
        <div className="mb-4 pb-4 border-b border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-2">اشتراك النادي</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">الباقة:</span>
              <span className="font-semibold">
                {gymSub.packageId?.name || "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">من:</span>
              <span className="font-semibold">
                {new Date(gymSub.startDate).toLocaleDateString("ar-SA")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">إلى:</span>
              <span className="font-semibold">
                {new Date(gymSub.endDate).toLocaleDateString("ar-SA")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">المبلغ المدفوع:</span>
              <span className="font-bold text-green-600">
                {gymSub.pricePaid} ريال
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">الحالة:</span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded ${
                  statusConfig[gymSub.status]?.badge ||
                  "bg-gray-100 text-gray-700"
                }`}
              >
                {statusConfig[gymSub.status]?.label || gymSub.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {academySubs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-700">
            الرياضات ({academySubs.length})
          </p>
          {academySubs.map((acSub) => (
            <div key={acSub._id} className="bg-blue-50 rounded-lg p-3 text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-bold">
                  {acSub.sportId?.name || "رياضة"}
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    statusConfig[acSub.status]?.badge ||
                    "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusConfig[acSub.status]?.label || acSub.status}
                </span>
              </div>
              <div className="text-gray-600">
                مجموعة:{" "}
                <span className="font-semibold">
                  {acSub.groupId?.name || "-"}
                </span>
              </div>
              <div className="text-gray-600 text-xs mt-1">
                من {new Date(acSub.startDate).toLocaleDateString("ar-SA")} إلى{" "}
                {new Date(acSub.endDate).toLocaleDateString("ar-SA")}
              </div>
            </div>
          ))}
        </div>
      )}

      {(m.role === "sub_adult" ||
        (m.role === "child" && !isChildWithAcademy)) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-4 text-xs text-blue-700">
          ⚠️ يجب أن لا يتجاوز تاريخ انتهاء الاشتراك تاريخ العضو الأساسي
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
        <button
          onClick={() => onEditMember(m)}
          className="text-blue-600 hover:text-blue-800 text-xs font-medium"
        >
          ✏️ تعديل بيانات العضو
        </button>
        {gymSub && (
          <button
            onClick={() => onEditSubscription(gymSub)}
            className="text-green-600 hover:text-green-800 text-xs font-medium"
          >
            ✏️ تعديل الاشتراك
          </button>
        )}
      </div>
    </div>
  );
}
