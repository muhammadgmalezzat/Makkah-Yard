import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";
import { useAuthStore } from "../store/authStore";

const packageTypeOptions = [
  { value: "all", label: "الكل" },
  { value: "individual", label: "فردي" },
  { value: "friends", label: "أصدقاء" },
  { value: "family", label: "عائلي" },
  { value: "academy_only", label: "أكاديمية" },
];

const statusConfig = {
  active: { label: "نشط", classes: "bg-green-100 text-green-700" },
  renewed: { label: "مجدد", classes: "bg-blue-100 text-blue-700" },
  cancelled: { label: "ملغى", classes: "bg-red-100 text-red-700" },
  expired: { label: "منتهي", classes: "bg-gray-100 text-gray-600" },
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
    <div className="flex items-start justify-between gap-4 mb-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-100 rounded w-24"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded-full w-16 shrink-0"></div>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-4">
      <div className="bg-gray-50 rounded-xl p-3 h-16"></div>
      <div className="bg-gray-50 rounded-xl p-3 h-16"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded-xl"></div>
  </div>
);

export default function SearchSubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [packageType, setPackageType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [gender, setGender] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    confirmVariant: 'danger',
    onConfirm: null,
  });
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const showConfirm = (title, message, onConfirm, confirmVariant = 'danger') => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText: 'تأكيد',
      cancelText: 'إلغاء',
      confirmVariant,
      onConfirm,
    });
  };

  const showAlert = (message, type = 'success') => {
    setAlertModal({
      isOpen: true,
      title: type === 'success' ? '✅ تم بنجاح' : type === 'error' ? '❌ خطأ' : '⚠️ تنبيه',
      message,
      type,
    });
  };
  const [responseData, setResponseData] = useState({
    data: [],
    total: 0,
    count: 0,
    totalPages: 1,
    currentPage: 1,
  });

  const canDelete =
    user?.role === "admin" ||
    user?.role === "owner" ||
    user?.role === "reception";

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageType, debouncedSearch, startDate, endDate, activeOnly, gender]);

  const { isLoading, refetch } = useQuery({
    queryKey: [
      "membersDirectory",
      packageType,
      debouncedSearch,
      startDate,
      endDate,
      activeOnly,
      gender,
      currentPage,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append("q", debouncedSearch);
      params.append("packageType", packageType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (activeOnly) params.append("activeOnly", "true");
      if (gender !== "all") params.append("gender", gender);
      params.append("page", currentPage.toString());
      params.append("limit", "50");

      const response = await axios.get(
        `/subscriptions/members-directory?${params.toString()}`,
      );
      setResponseData({
        data: response.data.data || [],
        total: response.data.total || 0,
        count: response.data.count || 0,
        totalPages: response.data.totalPages || 1,
        currentPage: response.data.currentPage || 1,
      });
      return response.data;
    },
    cacheTime: 0,
  });

  const results = responseData.data;
  const total = responseData.total;
  const count = responseData.count;
  const totalPages = responseData.totalPages;

  const handleDelete = (memberId, memberRole, memberName) => {
    showConfirm(
      memberRole === 'primary' ? 'حذف الحساب' : 'حذف العضو',
      memberRole === 'primary'
        ? `سيتم حذف حساب "${memberName}" وجميع أعضائه وبياناتهم نهائياً. هل أنت متأكد؟`
        : `سيتم حذف العضو "${memberName}" فقط دون التأثير على باقي الحساب. هل أنت متأكد؟`,
      async () => {
        try {
          setDeletingId(memberId);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          await axios.delete(`/subscriptions/members/${memberId}`);
          await refetch();
          showAlert('تم الحذف بنجاح', 'success');
        } catch (error) {
          showAlert(error.response?.data?.message || 'حدث خطأ أثناء الحذف', 'error');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

  const isExpired = (dateStr) => dateStr && new Date(dateStr) < new Date();

  const activeFiltersCount = [
    packageType !== "all",
    startDate,
    endDate,
    activeOnly,
    gender !== "all",
    debouncedSearch,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
            دليل الأعضاء
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            جميع المشتركين في النادي
          </p>
        </div>
        {total > 0 && (
          <div className="bg-blue-50 rounded-xl px-4 py-2 border border-blue-200">
            <p className="text-sm font-semibold text-blue-700">
              {total} عضو إجمالي
            </p>
            {totalPages > 1 && (
              <p className="text-xs text-blue-600 mt-1">
                صفحة {currentPage} من {totalPages}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Package Type Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs sm:text-sm font-semibold text-gray-700">
            نوع الاشتراك
          </p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
          {packageTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setPackageType(option.value)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium text-xs sm:text-sm min-h-[44px] flex items-center justify-center transition ${
                packageType === option.value
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Additional Filters */}
      <div className="space-y-3">
        {/* Search Input */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اسم أو رقم هاتف أو بريد إلكتروني"
              className="w-full pr-11 pl-4 py-2 sm:py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right"
            />
          </div>
        </div>

        {/* Additional Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Date Range From */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <label className="block text-xs text-gray-500 mb-2">من</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right text-sm"
            />
          </div>

          {/* Date Range To */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <label className="block text-xs text-gray-500 mb-2">إلى</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right text-sm"
            />
          </div>

          {/* Gender Toggle */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <label className="block text-xs text-gray-500 mb-2">النوع</label>
            <div className="flex gap-1">
              {[
                { value: "all", label: "الكل" },
                { value: "male", label: "ذكر" },
                { value: "female", label: "أنثى" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setGender(opt.value)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium min-h-[44px] flex items-center justify-center transition ${
                    gender === opt.value
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Active Only Checkbox */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px] flex items-center">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">نشط فقط</span>
          </label>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-sm text-blue-700">
            {activeFiltersCount} عامل تصفية نشط
          </p>
          <button
            onClick={() => {
              setPackageType("all");
              setSearchQuery("");
              setStartDate("");
              setEndDate("");
              setActiveOnly(false);
              setGender("all");
              setCurrentPage(1);
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            إعادة تعيين
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && results.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            السابق
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium min-w-[40px] transition ${
                      currentPage === p
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>

          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            التالي
          </button>
        </div>
      )}

      {/* Empty State - No Results */}
      {!isLoading && results.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <p className="text-4xl mb-3">🔎</p>
          <p className="text-amber-900 font-semibold mb-1">
            لم يتم العثور على نتائج
          </p>
          <p className="text-sm text-amber-700">
            حاول تغيير معايير البحث أو التصفية
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => {
            const member = result.member;
            const memberName = member?.fullName || "Unknown";
            const phone = member?.phone || "-";
            const hasGymSub = result.gymSubscription;
            const hasAcademySubs = result.academySubscriptions?.length > 0;

            // Determine primary display type
            let primarybadgeLabel = "بدون اشتراك";
            let primaryBadgeColor = "bg-gray-100 text-gray-600";
            let details = null;
            let actionButton = null;

            if (hasGymSub) {
              // Gym subscription
              primarybadgeLabel = "جيم";
              primaryBadgeColor = "bg-blue-100 text-blue-700";
              const packageName =
                result.gymSubscription?.packageId?.name || "لا يوجد";
              const endDate = result.gymSubscription?.endDate;
              const expired = isExpired(endDate);
              const status =
                statusConfig[result.gymSubscription?.status] ||
                statusConfig.active;

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
                      <span
                        className={`px-2 py-1 rounded font-medium ${status.classes}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  )}
                </>
              );

              actionButton = (
                <button
                  onClick={() => navigate(`/accounts/${result.accountId}`)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-xs sm:text-sm font-semibold hover:bg-blue-700 transition min-h-[44px] flex items-center justify-center"
                >
                  عرض الحساب
                </button>
              );
            } else if (hasAcademySubs) {
              // Academy subscription
              primarybadgeLabel = "أكاديمية";
              primaryBadgeColor = "bg-purple-100 text-purple-700";
              const firstAcademy = result.academySubscriptions[0];
              const sportName = firstAcademy?.sportId?.name || "رياضة";
              const groupName = firstAcademy?.groupId?.name || "مجموعة";
              const endDate = firstAcademy?.endDate;
              const status =
                statusConfig[firstAcademy?.status] || statusConfig.active;

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
                      <span
                        className={`px-2 py-1 rounded font-medium ${status.classes}`}
                      >
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
                  onClick={() => navigate(`/academy/members/${member._id}`)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-semibold hover:bg-purple-700 transition min-h-[44px] flex items-center justify-center"
                >
                  عرض الملف
                </button>
              );
            } else {
              // No active subscription (expired or none) - show account view button
              actionButton = (
                <button
                  onClick={() => navigate(`/accounts/${result.accountId}`)}
                  className="w-full py-2.5 rounded-xl bg-gray-600 text-white text-xs sm:text-sm font-semibold hover:bg-gray-700 transition min-h-[44px] flex items-center justify-center"
                >
                  عرض الحساب
                </button>
              );
            }

            return (
              <div
                key={member._id}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition flex flex-col h-full"
              >
                {/* Delete Button */}
                {canDelete && (
                  <button
                    onClick={() =>
                      handleDelete(member._id, member.role, memberName)
                    }
                    className="absolute top-10 left-5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full p-2 transition"
                    title="حذف الحساب"
                    disabled={deletingId === member._id}
                  >
                    🗑️
                  </button>
                )}

                {/* Loading Overlay */}
                {deletingId === member._id && (
                  <div className="absolute inset-0 bg-white bg-opacity-80 rounded-2xl flex items-center justify-center z-10">
                    <span className="text-red-500 text-sm font-medium">
                      جاري الحذف...
                    </span>
                  </div>
                )}

                {/* Header: Avatar + Name + Badge */}
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
                    {primarybadgeLabel}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1">{details}</div>

                {/* Action Button */}
                {actionButton}
              </div>
            );
          })}
        </div>
      )}
      {confirmModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-100">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${
                confirmModal.confirmVariant === "danger"
                  ? "bg-red-50"
                  : "bg-blue-50"
              }`}
            >
              <span className="text-xl">
                {confirmModal.confirmVariant === "danger" ? "🗑️" : "✏️"}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => confirmModal.onConfirm?.()}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition ${
                  confirmModal.confirmVariant === "danger"
                    ? "bg-red-500 hover:bg-red-600"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {confirmModal.confirmText}
              </button>
              <button
                onClick={() =>
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }))
                }
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              >
                {confirmModal.cancelText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal.isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                alertModal.type === "success"
                  ? "bg-green-50"
                  : alertModal.type === "error"
                    ? "bg-red-50"
                    : "bg-amber-50"
              }`}
            >
              <span className="text-xl">
                {alertModal.type === "success"
                  ? "✅"
                  : alertModal.type === "error"
                    ? "❌"
                    : "⚠️"}
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {alertModal.title}
            </h3>
            <p className="text-gray-500 text-sm mb-6">{alertModal.message}</p>
            <button
              onClick={() =>
                setAlertModal((prev) => ({ ...prev, isOpen: false }))
              }
              className="w-full py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
