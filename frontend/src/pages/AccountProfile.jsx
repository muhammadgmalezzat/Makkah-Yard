import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import axios from "../api/axios";

const roleConfig = {
  primary: { label: "أساسي", badge: "bg-blue-100 text-blue-700" },
  partner: { label: "شريك", badge: "bg-purple-100 text-purple-700" },
  child: { label: "طفل", badge: "bg-orange-100 text-orange-700" },
  sub_adult: { label: "فرعي بالغ", badge: "bg-teal-100 text-teal-700" },
};

const statusConfig = {
  active: { label: "نشط", badge: "bg-green-100 text-green-700" },
  expired: { label: "منتهي", badge: "bg-red-100 text-red-700" },
  cancelled: { label: "ملغى", badge: "bg-red-100 text-red-700" },
  renewed: { label: "مجدد", badge: "bg-blue-100 text-blue-700" },
};

const accountTypeConfig = {
  individual: { label: "حساب فردي", icon: "👤" },
  friends: { label: "حساب أصدقاء", icon: "👥" },
  family: { label: "حساب عائلي", icon: "👨‍👩‍👧‍👦" },
  academy_only: { label: "أكاديمية فقط", icon: "🎓" },
};

const paymentMethodConfig = {
  cash: "نقد",
  network: "شبكة",
  tabby: "تابي",
  tamara: "تمارة",
  transfer: "تحويل",
};

const typeConfig = {
  new: "جديد",
  renewal: "تجديد",
  transfer_fee: "رسم نقل",
  upgrade_diff: "فرق ترقية",
};

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

export default function AccountProfile() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  // Edit state
  const [editingMember, setEditingMember] = useState(null);
  const [memberEditForm, setMemberEditForm] = useState({});
  const [editingSub, setEditingSub] = useState(null);
  const [subEditForm, setSubEditForm] = useState({});

  const {
    data: profileData,
    isLoading,
    error,
    refetch: fetchProfile,
  } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const response = await axios.get(
        `/subscriptions/account-profile/${accountId}`,
      );
      return response.data.data;
    },
  });

  // Handler functions for member edit
  const openMemberEdit = (member) => {
    setEditingMember(member);
    setMemberEditForm({
      fullName: member.fullName || "",
      phone: member.phone || "",
      email: member.email || "",
      gender: member.gender || "male",
      nationalId: member.nationalId || "",
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
    });
  };

  const handleMemberEditSubmit = async () => {
    try {
      await axios.put(`/members/${editingMember._id}`, memberEditForm);
      setEditingMember(null);
      fetchProfile();
      alert("✅ تم تحديث بيانات العضو");
    } catch (error) {
      alert(error.response?.data?.message || "حدث خطأ");
    }
  };

  // Handler functions for subscription edit
  const openSubEdit = (sub) => {
    if (!sub) return;
    setEditingSub(sub);
    setSubEditForm({
      startDate: sub.startDate ? sub.startDate.split("T")[0] : "",
      endDate: sub.endDate ? sub.endDate.split("T")[0] : "",
      status: sub.status || "active",
      pricePaid: sub.pricePaid || 0,
    });
  };

  const handleSubEditSubmit = async () => {
    try {
      await axios.put(`/subscriptions/${editingSub._id}`, subEditForm);
      setEditingSub(null);
      fetchProfile();
      alert("✅ تم تحديث الاشتراك");
    } catch (error) {
      alert(error.response?.data?.message || "حدث خطأ");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 gap-3 text-gray-400">
        <svg
          className="animate-spin w-5 h-5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <span className="text-sm">جاري تحميل الحساب...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-semibold mb-2">❌ خطأ</p>
        <p className="text-red-600 text-sm">
          {error.response?.data?.message || "حدث خطأ أثناء تحميل الحساب"}
        </p>
        <button
          onClick={() => navigate("/subscriptions/search")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          العودة للبحث
        </button>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>لم يتم العثور على بيانات الحساب</p>
      </div>
    );
  }

  const { account, primarySubscription, members, payments, totalPaid, stats } =
    profileData;
  const accountType = accountTypeConfig[account.type] || {
    label: account.type,
    icon: "📋",
  };

  const primaryMemberData = members?.find((m) => m.member?.role === "primary");
  const primaryMember = primaryMemberData?.member;
  const primarySub = primaryMemberData?.gymSubscription || primarySubscription;

  const partnerMembers =
    members?.filter((m) => m.member?.role === "partner") || [];
  const childMembers = members?.filter((m) => m.member?.role === "child") || [];

  const isSubscriptionActive =
    primarySub && new Date(primarySub.endDate) > new Date();

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            ملف الحساب
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {accountType.icon} {accountType.label}
          </p>
        </div>
        <button
          onClick={() => navigate("/subscriptions/search")}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition min-h-[44px] w-full sm:w-auto"
        >
          ← العودة
        </button>
      </div>

      {/* SECTION 1: Account Header Box (Primary Subscription) */}
      {primaryMember && primarySub && (
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
              <button
                onClick={() => {}}
                className="px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition min-h-[44px]"
              >
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
                {new Date(primarySub.freezeStart).toLocaleDateString("ar-SA")}{" "}
                إلى {new Date(primarySub.freezeEnd).toLocaleDateString("ar-SA")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Members Cards */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">الأعضاء</h2>

        {members && members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {members.map((memberData) => {
              const m = memberData.member;
              const gymSub = memberData.gymSubscription;
              const academySubs = memberData.academySubscriptions || [];

              // Determine role type for display
              let displayRole = roleConfig[m.role] || {
                label: m.role,
                badge: "bg-gray-100 text-gray-700",
              };

              // For children, check if they have academy subscriptions
              let isChildWithAcademy =
                m.role === "child" && academySubs.length > 0;

              return (
                <div
                  key={m._id}
                  className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition"
                >
                  {/* Role Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${displayRole.badge}`}
                    >
                      {isChildWithAcademy ? "طفل أكاديمية" : displayRole.label}
                    </span>
                  </div>

                  {/* Member Info */}
                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-sm">الاسم:</span>
                      <span className="font-bold text-gray-900">
                        {m.fullName}
                      </span>
                    </div>

                    {m.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">الجوال:</span>
                        <span className="font-bold text-gray-900">
                          {m.phone}
                        </span>
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
                        <span className="font-bold text-gray-900">
                          {m.nationalId}
                        </span>
                      </div>
                    )}

                    {m.dateOfBirth && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-sm">
                          تاريخ الميلاد:
                        </span>
                        <span className="font-bold text-gray-900">
                          {new Date(m.dateOfBirth).toLocaleDateString("ar-SA")}{" "}
                          (عمر: {calculateAge(m.dateOfBirth)})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Gym Subscription */}
                  {gymSub && (
                    <div className="mb-4 pb-4 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-700 mb-2">
                        اشتراك النادي
                      </p>
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
                            {new Date(gymSub.startDate).toLocaleDateString(
                              "ar-SA",
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">إلى:</span>
                          <span className="font-semibold">
                            {new Date(gymSub.endDate).toLocaleDateString(
                              "ar-SA",
                            )}
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
                            {statusConfig[gymSub.status]?.label ||
                              gymSub.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Academy Subscriptions */}
                  {academySubs.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-gray-700">
                        الرياضات ({academySubs.length})
                      </p>
                      {academySubs.map((acSub) => (
                        <div
                          key={acSub._id}
                          className="bg-blue-50 rounded-lg p-3 text-sm"
                        >
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
                              {statusConfig[acSub.status]?.label ||
                                acSub.status}
                            </span>
                          </div>
                          <div className="text-gray-600">
                            مجموعة:{" "}
                            <span className="font-semibold">
                              {acSub.groupId?.name || "-"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-xs mt-1">
                            من{" "}
                            {new Date(acSub.startDate).toLocaleDateString(
                              "ar-SA",
                            )}{" "}
                            إلى{" "}
                            {new Date(acSub.endDate).toLocaleDateString(
                              "ar-SA",
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Note for sub members */}
                  {(m.role === "sub_adult" ||
                    (m.role === "child" && !isChildWithAcademy)) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mt-4 text-xs text-blue-700">
                      ⚠️ يجب أن لا يتجاوز تاريخ انتهاء الاشتراك تاريخ العضو
                      الأساسي
                    </div>
                  )}

                  {/* Edit Buttons */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                    <button
                      onClick={() => openMemberEdit(m)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      ✏️ تعديل بيانات العضو
                    </button>
                    {gymSub && (
                      <button
                        onClick={() => openSubEdit(gymSub)}
                        className="text-green-600 hover:text-green-800 text-xs font-medium"
                      >
                        ✏️ تعديل الاشتراك
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>لا توجد أعضاء في هذا الحساب</p>
          </div>
        )}
      </div>

      {/* Member Edit Modal */}
      {editingMember && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-xl min-h-screen sm:min-h-0 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تعديل بيانات العضو</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  value={memberEditForm.fullName}
                  onChange={(e) =>
                    setMemberEditForm({
                      ...memberEditForm,
                      fullName: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الجوال
                </label>
                <input
                  type="text"
                  value={memberEditForm.phone}
                  onChange={(e) =>
                    setMemberEditForm({
                      ...memberEditForm,
                      phone: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  value={memberEditForm.email}
                  onChange={(e) =>
                    setMemberEditForm({
                      ...memberEditForm,
                      email: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الجنس
                </label>
                <select
                  value={memberEditForm.gender}
                  onChange={(e) =>
                    setMemberEditForm({
                      ...memberEditForm,
                      gender: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  رقم الهوية
                </label>
                <input
                  type="text"
                  value={memberEditForm.nationalId}
                  onChange={(e) =>
                    setMemberEditForm({
                      ...memberEditForm,
                      nationalId: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {editingMember.role === "child" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    تاريخ الميلاد
                  </label>
                  <input
                    type="date"
                    value={memberEditForm.dateOfBirth}
                    onChange={(e) =>
                      setMemberEditForm({
                        ...memberEditForm,
                        dateOfBirth: e.target.value,
                      })
                    }
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleMemberEditSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 min-h-[44px] flex items-center justify-center"
              >
                حفظ التعديلات
              </button>
              <button
                onClick={() => setEditingMember(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 min-h-[44px] flex items-center justify-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Edit Modal */}
      {editingSub && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
          dir="rtl"
        >
          <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-xl min-h-screen sm:min-h-0 overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">تعديل الاشتراك</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ البداية
                </label>
                <input
                  type="date"
                  value={subEditForm.startDate}
                  onChange={(e) =>
                    setSubEditForm({
                      ...subEditForm,
                      startDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاريخ النهاية
                </label>
                <input
                  type="date"
                  value={subEditForm.endDate}
                  onChange={(e) =>
                    setSubEditForm({
                      ...subEditForm,
                      endDate: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الحالة
                </label>
                <select
                  value={subEditForm.status}
                  onChange={(e) =>
                    setSubEditForm({
                      ...subEditForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">نشط</option>
                  <option value="expired">منتهي</option>
                  <option value="frozen">مجمد</option>
                  <option value="cancelled">ملغي</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  المبلغ المدفوع
                </label>
                <input
                  type="number"
                  value={subEditForm.pricePaid}
                  onChange={(e) =>
                    setSubEditForm({
                      ...subEditForm,
                      pricePaid: parseFloat(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleSubEditSubmit}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 min-h-[44px] flex items-center justify-center"
              >
                حفظ التعديلات
              </button>
              <button
                onClick={() => setEditingSub(null)}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 min-h-[44px] flex items-center justify-center"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Payment History */}
      {payments && payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">سجل المدفوعات</h2>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      التاريخ
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      المبلغ
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      طريقة الدفع
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      نوع العملية
                    </th>
                    <th className="px-6 py-3 text-right font-semibold text-gray-700">
                      بواسطة
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.slice(0, 10).map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 text-gray-900">
                        {new Date(payment.paidAt).toLocaleDateString("ar-SA")}
                      </td>
                      <td className="px-6 py-3 font-bold text-green-600">
                        {payment.amount} ريال
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {paymentMethodConfig[payment.method] || payment.method}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {typeConfig[payment.type] || payment.type}
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {payment.createdBy?.name || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {payments.length > 10 && (
            <p className="text-sm text-gray-500 text-center">
              يتم عرض أول 10 مدفوعات. إجمالي المدفوعات: {payments.length}
            </p>
          )}
        </div>
      )}

      {/* SECTION 4: Account Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalMembers}
            </p>
            <p className="text-sm text-blue-700 mt-1">إجمالي الأعضاء</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {stats.activeMembers}
            </p>
            <p className="text-sm text-green-700 mt-1">أعضاء نشط</p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">
              {stats.totalPayments}
            </p>
            <p className="text-sm text-purple-700 mt-1">عدد المدفوعات</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {stats.totalPaid}
            </p>
            <p className="text-sm text-orange-700 mt-1">إجمالي المدفوعات</p>
          </div>
        </div>
      )}

      {stats?.lastPaymentDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm">
          <p className="text-gray-600">
            آخر دفعة:
            <span className="font-bold text-gray-900 mr-2">
              {new Date(stats.lastPaymentDate).toLocaleDateString("ar-SA")}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
