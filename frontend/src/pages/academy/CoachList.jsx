import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

export default function CoachList() {
  const [filters, setFilters] = useState({
    sportId: "",
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

  // Fetch today's active subscriptions
  const {
    data: activeMembers = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["activeTodayMembers", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("sportId", filters.sportId);
      if (filters.groupId) params.append("groupId", filters.groupId);
      params.append("_t", Date.now()); // Cache-busting timestamp

      const response = await axios.get(
        `/academy/subscriptions/active-today?${params}`,
      );
      return response.data;
    },
    enabled: !!filters.sportId,
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

  const handlePrint = () => {
    window.print();
  };

  const selectedSport = sports.find((s) => s._id === filters.sportId);

  // Group members by group
  const membersByGroup = activeMembers.reduce((acc, member) => {
    const groupName = member.groupId?.name || "بدون مجموعة";
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(member);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={handlePrint}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          🖨️ طباعة
        </button>
        <h1 className="text-3xl font-bold text-right">قائمة المدرب لليوم</h1>
      </div>

      {/* Filters - Only show on screen, not when printing */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            margin: 0;
            padding: 20px;
          }
        }
      `}</style>

      <div className="no-print bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sport Filter - Required */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              الرياضة *
            </label>
            <select
              value={filters.sportId}
              onChange={(e) => handleFilterChange("sportId", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">اختر الرياضة</option>
              {sports.map((sport) => (
                <option key={sport._id} value={sport._id}>
                  {sport.name}
                </option>
              ))}
            </select>
          </div>

          {/* Group Filter - Optional */}
          <div className="text-right">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              المجموعة (اختياري)
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
                  {group.name} - {group.schedule}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      {filters.sportId && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-right">
          <h2 className="text-xl font-bold text-blue-900">
            {selectedSport?.name}
          </h2>
          <p className="text-sm text-blue-700 mt-1">
            اليوم:{" "}
            {new Date().toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Content */}
      {!filters.sportId && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">اختر الرياضة لعرض قائمة الحضور</p>
        </div>
      )}

      {filters.sportId && isLoading && (
        <div className="text-center py-8">
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      )}

      {filters.sportId && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">خطأ في تحميل البيانات</p>
        </div>
      )}

      {filters.sportId && activeMembers.length === 0 && !isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">
            لا يوجد أطفال نشطين اليوم في هذه الرياضة
          </p>
        </div>
      )}

      {/* Member Lists */}
      {filters.sportId && activeMembers.length > 0 && (
        <div className="space-y-6">
          {Object.entries(membersByGroup).map(([groupName, members]) => (
            <div
              key={groupName}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              {/* Group Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 text-white text-right">
                <h3 className="text-lg font-bold">{groupName}</h3>
                {members[0]?.groupId?.schedule && (
                  <p className="text-sm text-blue-100 mt-1">
                    ⏰ {members[0].groupId.schedule}
                  </p>
                )}
              </div>

              {/* Member Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                        م
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                        الاسم
                      </th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">
                        هاتف الولي
                      </th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 no-print">
                        ملاحظات
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, idx) => (
                      <tr
                        key={member._id}
                        className={`border-b border-gray-200 ${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                          {member.memberId?.fullName}
                        </td>
                        <td className="px-6 py-4 text-right text-sm text-gray-700 ltr">
                          {member.memberId?.phone || "-"}
                        </td>
                        <td className="px-6 py-4 text-center text-sm no-print">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-blue-600 rounded"
                            defaultChecked={false}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Group Summary */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-right">
                <p className="text-sm text-gray-700">
                  العدد: <span className="font-bold">{members.length}</span>
                </p>
              </div>
            </div>
          ))}

          {/* Total Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-right">
            <p className="text-lg font-bold text-blue-900">
              إجمالي الأطفال:{" "}
              <span className="text-2xl">{activeMembers.length}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
