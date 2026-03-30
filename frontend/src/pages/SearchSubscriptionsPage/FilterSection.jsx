import { SkeletonCard } from "../../components/ui";

const packageTypeOptions = [
  { value: "all", label: "الكل" },
  { value: "individual", label: "فردي" },
  { value: "friends", label: "أصدقاء" },
  { value: "family", label: "عائلي" },
  { value: "academy_only", label: "أكاديمية" },
];

/**
 * FilterSection - All filter controls for members directory
 */
export function FilterSection({
  packageType,
  onPackageTypeChange,
  searchQuery,
  onSearchChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  gender,
  onGenderChange,
  activeOnly,
  onActiveOnlyChange,
  activeFiltersCount,
  onResetFilters,
}) {
  return (
    <div className="space-y-3">
      {/* Package Type Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <p className="text-xs sm:text-sm font-semibold text-gray-700 mb-3">
          نوع الاشتراك
        </p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 sm:mx-0 px-4 sm:px-0">
          {packageTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onPackageTypeChange(option.value)}
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

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="اسم أو رقم هاتف أو بريد إلكتروني"
            className="w-full pr-11 pl-4 py-2 sm:py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right"
          />
        </div>
      </div>

      {/* Additional Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <label className="block text-xs text-gray-500 mb-2">من</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right text-sm"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
          <label className="block text-xs text-gray-500 mb-2">إلى</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right text-sm"
          />
        </div>

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
                onClick={() => onGenderChange(opt.value)}
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
        <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => onActiveOnlyChange(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
          />
          <span className="text-sm font-medium text-gray-700">نشط فقط</span>
        </label>
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <p className="text-sm text-blue-700">
            {activeFiltersCount} عامل تصفية نشط
          </p>
          <button
            onClick={onResetFilters}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            إعادة تعيين
          </button>
        </div>
      )}
    </div>
  );
}
