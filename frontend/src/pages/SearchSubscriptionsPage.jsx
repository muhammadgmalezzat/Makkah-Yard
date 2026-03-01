import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

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

  const statusMap = {
    active: "نشط",
    renewed: "مجدد",
    cancelled: "ملغى",
    expired: "منتهي",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">البحث عن الاشتراكات</h1>

      <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            ابحث بالاسم أو رقم الهاتف
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="أحمد محمد أو 0501234567"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="text-center text-gray-500">جاري البحث...</div>
      )}

      {searchQuery && results.length === 0 && !isLoading && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          لم يتم العثور على نتائج
        </div>
      )}

      <div className="space-y-4">
        {results.map((result) => (
          <div
            key={result.subscriptionId}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">الاسم</p>
                <p className="font-bold">{result.memberName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">رقم الهاتف</p>
                <p className="font-bold">{result.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">الحزمة</p>
                <p className="font-bold">{result.packageName}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">الحالة</p>
                <p className="font-bold">
                  {statusMap[result.status] || result.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">تاريخ النهاية</p>
                <p className="font-bold">
                  {new Date(result.endDate).toLocaleDateString("ar-SA")}
                </p>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/subscriptions/${result.subscriptionId}/renew`)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              تجديد الاشتراك
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
