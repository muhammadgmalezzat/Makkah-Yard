import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import axios from "../api/axios";

export default function PackagesPage() {
  const [categoryFilter, setCategoryFilter] = useState("");

  const {
    data: packages = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["packages", categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      const response = await axios.get(`/packages?${params}`);
      return response.data;
    },
  });

  const categories = [
    { value: "", label: "جميع الفئات" },
    { value: "individual", label: "فردي" },
    { value: "friends", label: "أصدقاء" },
    { value: "family_essential", label: "عائلي أساسي" },
    { value: "sub_adult", label: "عضو إضافي بالغ" },
    { value: "sub_child", label: "عضو إضافي أطفال" },
    { value: "academy_only", label: "أكاديمية فقط" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">الحزم والأسعار</h1>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <label className="block text-sm font-medium mb-2">
          تصفية حسب الفئة
        </label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          خطأ في تحميل الحزم
        </div>
      )}

      {isLoading && (
        <div className="text-center text-gray-500">جاري التحميل...</div>
      )}

      {packages.length === 0 && !isLoading && (
        <div className="text-center text-gray-500">لا توجد حزم</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <div
            key={pkg._id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            <h3 className="text-lg font-bold text-gray-800">{pkg.name}</h3>
            <p className="text-sm text-gray-600 mt-2">
              الفئة:{" "}
              <span className="font-medium">
                {categories.find((c) => c.value === pkg.category)?.label}
              </span>
            </p>
            {pkg.sport !== "general" && (
              <p className="text-sm text-gray-600">
                الرياضة: <span className="font-medium">{pkg.sport}</span>
              </p>
            )}
            <p className="text-sm text-gray-600">
              المدة:{" "}
              <span className="font-medium">{pkg.durationMonths} أشهر</span>
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-4">
              {pkg.price} ريال
            </p>
            {pkg.isFlexibleDuration && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                ✓ مدة مرنة (سعر شهري: {pkg.pricePerMonth} ريال)
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
