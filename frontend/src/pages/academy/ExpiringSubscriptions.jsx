import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

export default function ExpiringSubscriptions() {
  const [filters, setFilters] = useState({
    days: 5,
    sportId: "",
    gender: "",
    groupId: "",
  });

  // Fetch sports
  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const response = await axios.get("/academy/sports");
      return response.data;
    },
  });

  // Fetch subscriptions based on filters
  const {
    data: subscriptions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["expiringSubscriptions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("days", filters.days);
      if (filters.sportId) params.append("sportId", filters.sportId);
      if (filters.gender) params.append("gender", filters.gender);
      if (filters.groupId) params.append("groupId", filters.groupId);

      const response = await axios.get(
        `/academy/subscriptions/expiring?${params}`,
      );
      return response.data;
    },
  });

  // Fetch groups for selected sport
  const { data: groups = [] } = useQuery({
    queryKey: ["groupsForSport", filters.sportId],
    queryFn: async () => {
      if (!filters.sportId) return [];
      const response = await axios.get(`/academy/sports/${filters.sportId}`);
      return response.data.groups || [];
    },
    enabled: !!filters.sportId,
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "sportId" && { groupId: "" }),
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilExpiry = (endDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const diff = end - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpiryBadgeColor = (days) => {
    if (days <= 0) return "bg-red-100 text-red-700";
    if (days <= 3) return "bg-orange-100 text-orange-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-3xl font-bold text-right mb-6">
        الاشتراكات المنتهية
      </h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Days Filter */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              خلال _ أيام
            </label>
            <select
              value={filters.days}
              onChange={(e) => handleFilterChange("days", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 أيام</option>
              <option value="10">10 أيام</option>
              <option value="30">شهر</option>
            </select>
          </div>

          {/* Sport Filter */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              الرياضة
            </label>
            <select
              value={filters.sportId}
              onChange={(e) => handleFilterChange("sportId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">الكل</option>
              {sports.map((sport) => (
                <option key={sport._id} value={sport._id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              النوع
            </label>
            <select
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">الكل</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>

          {/* Group Filter */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              المجموعة
            </label>
            <select
              value={filters.groupId}
              onChange={(e) => handleFilterChange("groupId", e.target.value)}
              disabled={!filters.sportId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">الكل</option>
              {groups.map((group) => (
                <option key={group._id} value={group._id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">خطأ في تحميل البيانات</p>
        </div>
      )}

      {subscriptions.length === 0 && !isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">لا توجد اشتراكات منتهية في هذه الفترة</p>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    الرياضة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    المجموعة
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    تاريخ الانتهاء
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                    هاتف ولي الأمر
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub, idx) => {
                  const daysLeft = getDaysUntilExpiry(sub.endDate);
                  return (
                    <tr
                      key={sub._id}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                        {sub.memberId?.fullName}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {sub.sportId?.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        {sub.groupId?.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700">
                        <div>
                          <p className="font-semibold">
                            {formatDate(sub.endDate)}
                          </p>
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-semibold mt-1 ${getExpiryBadgeColor(daysLeft)}`}
                          >
                            {daysLeft <= 0 ? "منتهي" : `${daysLeft} يوم`}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-700 ltr">
                        {sub.memberId?.guardianPhone || "-"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition">
                          تجديد
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-sm text-gray-700">
              إجمالي الاشتراكات المنتهية:{" "}
              <span className="font-bold">{subscriptions.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
