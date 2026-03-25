import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import axios from "../../api/axios";

export default function AcademyDashboard() {
  // Fetch dashboard data
  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["academyDashboard"],
    queryFn: async () => {
      const response = await axios.get("/academy/dashboard");
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            جاري تحميل البيانات...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 text-center m-4 sm:m-6">
        <p className="text-red-700 text-sm sm:text-base">
          خطأ في تحميل البيانات
        </p>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const COLORS = ["#3b82f6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

  // Prepare pie chart data
  const genderData = [
    { name: "أولاد", value: dashboard.byGender.male },
    { name: "بنات", value: dashboard.byGender.female },
  ];

  // Get chart colors for gender
  const genderColors = ["#3b82f6", "#ec4899"];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-3xl font-bold text-right mb-6 sm:mb-8">
        لوحة تحكم الأكاديمية
      </h1>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Children */}
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 text-white text-right">
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {dashboard.totalChildren}
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl opacity-20">
              👶
            </span>
          </div>
          <p className="text-blue-100 mt-2 text-xs sm:text-sm">
            إجمالي الأطفال النشطين
          </p>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 sm:p-6 text-white text-right">
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {dashboard.monthlyRevenue.toLocaleString("en")}
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl opacity-20">
              💰
            </span>
          </div>
          <p className="text-green-100 mt-2 text-xs sm:text-sm">
            إيراد الشهر الحالي
          </p>
        </div>

        {/* Expiring This Week */}
        <div className="bg-linear-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-4 sm:p-6 text-white text-right">
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {dashboard.expiringThisWeek}
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl opacity-20">
              ⏰
            </span>
          </div>
          <p className="text-orange-100 mt-2 text-xs sm:text-sm">
            ينتهون هذا الأسبوع
          </p>
        </div>

        {/* Full Groups */}
        <div className="bg-linear-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-4 sm:p-6 text-white text-right">
          <div className="flex items-center justify-between">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {dashboard.fullGroups}
            </span>
            <span className="text-3xl sm:text-4xl lg:text-5xl opacity-20">
              📊
            </span>
          </div>
          <p className="text-red-100 mt-2 text-xs sm:text-sm">
            المجموعات الممتلئة
          </p>
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Sports Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
            توزيع الأطفال حسب الرياضة
          </h2>
          {dashboard.bySport.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dashboard.bySport}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis
                  dataKey="sportName"
                  type="category"
                  width={190}
                  tick={{ textAnchor: "end", fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات</p>
          )}
        </div>

        {/* Gender Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
            توزيع الأطفال (أولاد / بنات)
          </h2>
          {genderData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={genderColors[index % genderColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500">لا توجد بيانات</p>
          )}
        </div>
      </div>

      {/* Row 3: Groups Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right">
            المجموعات ونسبة الامتلاء
          </h2>
        </div>

        {dashboard.byGroup.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    المجموعة
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    الرياضة
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    العدد الحالي
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    السعة الكلية
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    نسبة الامتلاء
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody>
                {dashboard.byGroup.map((group, idx) => {
                  const percentage = Math.round(
                    (group.count / group.maxCapacity) * 100,
                  );
                  const isHigh = percentage >= 80;
                  const isFull = percentage >= 100;

                  return (
                    <tr
                      key={`${group.groupName}-${idx}`}
                      className={`border-b border-gray-200 ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      }`}
                    >
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs sm:text-sm font-semibold text-gray-900">
                        {group.groupName}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-right text-xs sm:text-sm text-gray-700">
                        {group.sportName}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900">
                        {group.count}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-center text-xs sm:text-sm text-gray-700">
                        {group.maxCapacity}
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="text-xs sm:text-sm font-semibold text-gray-900">
                            {percentage}%
                          </span>
                          <div className="w-16 sm:w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition ${
                                isFull
                                  ? "bg-red-600"
                                  : isHigh
                                    ? "bg-orange-500"
                                    : "bg-green-500"
                              }`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-2 sm:py-4 text-center">
                        <span
                          className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                            isFull
                              ? "bg-red-100 text-red-700"
                              : isHigh
                                ? "bg-orange-100 text-orange-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isFull ? "ممتلئة" : "متاحة"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base">
            لا توجد مجموعات
          </div>
        )}
      </div>
    </div>
  );
}
