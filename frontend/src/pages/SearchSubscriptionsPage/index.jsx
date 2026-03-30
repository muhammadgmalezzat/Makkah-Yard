import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptions } from "../../hooks";
import { useAuth } from "../../hooks";
import { FilterSection } from "./FilterSection";
import { ResultsGrid } from "./ResultsGrid";

const statusConfig = {
  active: { label: "نشط", classes: "bg-green-100 text-green-700" },
  renewed: { label: "مجدد", classes: "bg-blue-100 text-blue-700" },
  cancelled: { label: "ملغى", classes: "bg-red-100 text-red-700" },
  expired: { label: "منتهي", classes: "bg-gray-100 text-gray-600" },
};

/**
 * SearchSubscriptionsPage - Main page for searching members
 */
export default function SearchSubscriptionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { useMembersDirectory, deleteAccount } = useSubscriptions();

  const [packageType, setPackageType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [gender, setGender] = useState("all");
  const [deletingId, setDeletingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  //Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [packageType, debouncedSearch, startDate, endDate, activeOnly, gender]);

  const filters = {
    packageType,
    q: debouncedSearch,
    startDate,
    endDate,
    activeOnly,
    gender,
    page: currentPage,
    limit: "50",
  };

  const { isLoading } = useMembersDirectory(filters);

  const handleDelete = async (accountId, memberName) => {
    const confirmed = window.confirm(
      `⚠️ تحذير: سيتم حذف حساب "${memberName}" وجميع بياناته نهائياً.\n\nهل أنت متأكد؟`,
    );
    if (!confirmed) return;

    try {
      setDeletingId(accountId);
      await deleteAccount(accountId);
      alert("✅ تم حذف الحساب بنجاح");
      // Refetch by changing page or filter
      setCurrentPage(1);
    } catch (error) {
      alert(error.response?.data?.message || "حدث خطأ أثناء الحذف");
    } finally {
      setDeletingId(null);
    }
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

  const results = responseData.data;
  const total = responseData.total;
  const totalPages = responseData.totalPages;

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

      {/* Filters */}
      <FilterSection
        packageType={packageType}
        onPackageTypeChange={setPackageType}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        gender={gender}
        onGenderChange={setGender}
        activeOnly={activeOnly}
        onActiveOnlyChange={setActiveOnly}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={() => {
          setPackageType("all");
          setSearchQuery("");
          setStartDate("");
          setEndDate("");
          setActiveOnly(false);
          setGender("all");
          setCurrentPage(1);
        }}
      />

      {/* Results */}
      <ResultsGrid
        isLoading={isLoading}
        results={results}
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onViewAccount={(accountId) => navigate(`/accounts/${accountId}`)}
        onViewProfile={(memberId) => navigate(`/academy/members/${memberId}`)}
        onDelete={handleDelete}
        deletingId={deletingId}
        canDelete={canDelete}
        statusConfig={statusConfig}
        isExpired={isExpired}
      />
    </div>
  );
}
