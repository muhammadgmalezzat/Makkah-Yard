import { useState } from "react";
import { usePackages } from "../hooks";
import { Spinner } from "../components/ui";

const categories = [
  { value: "", label: "الكل" },
  { value: "individual", label: "فردي" },
  { value: "friends", label: "أصدقاء" },
  { value: "family_essential", label: "عائلي أساسي" },
  { value: "sub_adult", label: "عضو إضافي بالغ" },
  { value: "sub_child", label: "عضو إضافي أطفال" },
  { value: "academy_only", label: "أكاديمية فقط" },
];

const categoryColors = {
  individual: "bg-blue-100 text-blue-700",
  friends: "bg-purple-100 text-purple-700",
  family_essential: "bg-green-100 text-green-700",
  sub_adult: "bg-orange-100 text-orange-700",
  sub_child: "bg-pink-100 text-pink-700",
  academy_only: "bg-teal-100 text-teal-700",
};

export default function PackagesPage() {
  const [categoryFilter, setCategoryFilter] = useState("");
  const { useAllPackages } = usePackages();

  const { data: packages = [], isLoading, error } = useAllPackages();

  // Filter packages by category
  const filteredPackages =
    categoryFilter === ""
      ? packages
      : packages.filter((p) => p.category === categoryFilter);

  const getCategoryLabel = (value) =>
    categories.find((c) => c.value === value)?.label ?? value;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
          الحزم والأسعار
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          {!isLoading && `${filteredPackages.length} حزمة متاحة`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex gap-1 flex-wrap overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-2">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-h-[44px] flex items-center justify-center
              ${
                categoryFilter === cat.value
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-2 text-sm">
          <span>⚠️</span> خطأ في تحميل الحزم
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">جاري التحميل...</span>
        </div>
      )}

      {/* Empty */}
      {filteredPackages.length === 0 && !isLoading && (
        <div className="text-center py-16 text-gray-300">
          <div className="text-5xl mb-3">📦</div>
          <p className="text-sm">لا توجد حزم في هذه الفئة</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPackages.map((pkg) => (
          <div
            key={pkg._id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition p-4 sm:p-6 flex flex-col"
          >
            {/* Top */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <h3 className="font-bold text-gray-900 text-base leading-snug">
                {pkg.name}
              </h3>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${categoryColors[pkg.category] ?? "bg-gray-100 text-gray-600"}`}
              >
                {getCategoryLabel(pkg.category)}
              </span>
            </div>

            {/* Details */}
            <div className="space-y-2 flex-1">
              {pkg.sport !== "general" && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">الرياضة</span>
                  <span className="font-medium text-gray-700">{pkg.sport}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">المدة</span>
                <span className="font-medium text-gray-700">
                  {pkg.durationMonths} أشهر
                </span>
              </div>
              {pkg.isFlexibleDuration && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">سعر شهري</span>
                  <span className="font-medium text-gray-700">
                    {pkg.pricePerMonth} ريال
                  </span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-3xl font-extrabold text-blue-600">
                  {pkg.price}
                </span>
                <span className="text-sm text-gray-400 mr-1">ريال</span>
              </div>
              {pkg.isFlexibleDuration && (
                <span className="text-xs bg-green-100 text-green-700 font-semibold px-2.5 py-1 rounded-full">
                  ✓ مدة مرنة
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
