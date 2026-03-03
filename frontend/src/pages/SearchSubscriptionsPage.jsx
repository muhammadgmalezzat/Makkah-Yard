import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

const statusConfig = {
  active: { label: "نشط", classes: "bg-green-100 text-green-700" },
  renewed: { label: "مجدد", classes: "bg-blue-100 text-blue-700" },
  cancelled: { label: "ملغى", classes: "bg-red-100 text-red-700" },
  expired: { label: "منتهي", classes: "bg-gray-100 text-gray-600" },
};

export default function SearchSubscriptionsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["subscriptions", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await axios.get(
        `/subscriptions/search?q=${encodeURIComponent(searchQuery)}`,
      );
      return response.data;
    },
  });

  const isExpired = (dateStr) => new Date(dateStr) < new Date();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          البحث عن الاشتراكات
        </h1>
        <p className="text-gray-500 mt-1">ابحث بالاسم أو رقم الهاتف</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
            🔍
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="أحمد محمد أو 0501234567"
            className="w-full pr-11 pl-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent transition text-right"
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
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
          <span className="text-sm">جاري البحث...</span>
        </div>
      )}

      {/* No Results */}
      {searchQuery && results.length === 0 && !isLoading && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-5 py-4 rounded-xl flex items-center gap-3 text-sm">
          <span>🔎</span>
          لم يتم العثور على نتائج لـ "<strong>{searchQuery}</strong>"
        </div>
      )}

      {/* Empty State */}
      {!searchQuery && (
        <div className="text-center py-16 text-gray-300">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-sm">ابدأ بكتابة اسم العضو أو رقم هاتفه</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {results.map((result) => {
          const status = statusConfig[result.status] || {
            label: result.status,
            classes: "bg-gray-100 text-gray-600",
          };
          const expired = isExpired(result.endDate);

          return (
            <div
              key={result.subscriptionId}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                {/* Name + Phone */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                    {result.memberName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">
                      {result.memberName}
                    </p>
                    <p className="text-sm text-gray-500">{result.phone}</p>
                  </div>
                </div>
                {/* Status Badge */}
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${status.classes}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-gray-400 mb-0.5">الحزمة</p>
                  <p className="font-semibold text-gray-800 text-sm">
                    {result.packageName}
                  </p>
                </div>
                <div
                  className={`rounded-xl px-4 py-3 ${expired ? "bg-red-50" : "bg-gray-50"}`}
                >
                  <p className="text-xs text-gray-400 mb-0.5">تاريخ النهاية</p>
                  <p
                    className={`font-semibold text-sm ${expired ? "text-red-500" : "text-gray-800"}`}
                  >
                    {new Date(result.endDate).toLocaleDateString("ar-SA")}
                    {expired && <span className="text-xs mr-1">(منتهي)</span>}
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  navigate(`/subscriptions/${result.subscriptionId}/renew`)
                }
                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
              >
                تجديد الاشتراك
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
