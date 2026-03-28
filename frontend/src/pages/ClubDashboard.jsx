import { useState } from "react";
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
  LineChart,
  Line,
} from "recharts";
import axios from "../api/axios";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function ClubDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["club-dashboard"],
    queryFn: async () => {
      const res = await axios.get("/subscriptions/club-dashboard");
      return res.data.data;
    },
    staleTime: 1000 * 60 * 5,
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

  if (!data) return null;

  // Format currency with Arabic locale
  const formatCurrency = (value) => {
    return value.toLocaleString("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    });
  };

  // Prepare chart data
  const accountsData = [
    { name: "فردي", value: data.accountsByType.individual },
    { name: "أصدقاء", value: data.accountsByType.friends },
    { name: "عائلي", value: data.accountsByType.family },
    { name: "أكاديمية", value: data.accountsByType.academy },
  ];

  const categoryData = [
    { name: "فردي", value: data.gymSubsByCategory.individual },
    { name: "أصدقاء", value: data.gymSubsByCategory.friends },
    { name: "عائلي", value: data.gymSubsByCategory.family_essential },
    { name: "فرعي", value: data.gymSubsByCategory.sub_adult },
  ];

  const durationData = [
    { name: "شهر", value: data.gymSubsByDuration[1] },
    { name: "3 أشهر", value: data.gymSubsByDuration[3] },
    { name: "6 أشهر", value: data.gymSubsByDuration[6] },
    { name: "سنة", value: data.gymSubsByDuration[12] },
    { name: "سنتين", value: data.gymSubsByDuration[24] },
  ];

  const revenueData = [
    {
      name: "الجيم",
      value: data.gymRevenue,
      fill: "#3b82f6",
    },
    {
      name: "الأكاديمية",
      value: data.academyRevenue,
      fill: "#10b981",
    },
  ];

  const sportData = Object.entries(data.sportDistribution).map(
    ([sport, count]) => ({
      name: sport,
      value: count,
    }),
  );

  // KPI Card Component
  const KPICard = ({ icon, title, value, color = "blue", trend }) => {
    const colorMap = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
      indigo: "bg-indigo-500",
      cyan: "bg-cyan-500",
      gray: "bg-gray-500",
      pink: "bg-pink-500",
    };

    const bgClass = colorMap[color] || "bg-blue-500";

    return (
      <div
        className={`${bgClass} rounded-xl shadow-lg p-4 sm:p-6 text-white text-right`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {value}
            </p>
            {trend && (
              <p className="text-xs sm:text-sm mt-1 opacity-75">{trend}</p>
            )}
          </div>
          <span className="text-3xl sm:text-4xl lg:text-5xl opacity-20">
            {icon}
          </span>
        </div>
        <p className="text-white/80 mt-2 text-xs sm:text-sm">{title}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8" dir="rtl">
      <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold">
        لوحة تحكم النادي
      </h1>

      {/* ──────────────────────────────────────────────────
          SECTION 1: KPI Cards
          ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
        <KPICard
          icon="👥"
          title="إجمالي الأعضاء"
          value={data.totalActiveMembers}
          color="blue"
        />
        <KPICard
          icon="💰"
          title="إيراد الشهر"
          value={formatCurrency(data.thisMonthRevenue)}
          color="green"
        />
        <KPICard
          icon="⏰"
          title="ينتهون الأسبوع"
          value={data.expiringThisWeek}
          color={data.expiringThisWeek > 0 ? "red" : "yellow"}
        />
        <KPICard
          icon="📊"
          title="حسابات نشطة"
          value={data.activeAccounts}
          color="purple"
        />

        <KPICard
          icon="🆕"
          title="اشتراكات جديدة"
          value={data.newThisMonth}
          color="indigo"
        />
        <KPICard
          icon="❄️"
          title="حسابات مجمدة"
          value={data.frozenAccounts}
          color="cyan"
        />
        <KPICard
          icon="❌"
          title="حسابات منتهية"
          value={data.expiredAccounts}
          color="gray"
        />
        <KPICard
          icon="👶"
          title="أطفال الأكاديمية"
          value={data.activeAcademyChildren}
          color="pink"
        />
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 2: Accounts by Type
          ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
            الحسابات حسب النوع
          </h2>
          {accountsData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accountsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accountsData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
          )}
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
            توزيع الإيرادات
          </h2>
          <div className="space-y-4">
            {revenueData.map((item) => {
              const total = data.thisMonthRevenue;
              const percentage =
                total > 0 ? Math.round((item.value / total) * 100) : 0;
              return (
                <div key={item.name}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">{item.name}</span>
                    <span className="text-sm font-bold">
                      {formatCurrency(item.value)} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.fill,
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between">
                <span className="text-sm font-bold">الإجمالي</span>
                <span className="text-sm font-bold">
                  {formatCurrency(data.thisMonthRevenue)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 3: Active Gym Subscriptions by Category
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          الاشتراكات النشطة حسب النوع
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">
              {data.gymSubsByCategory.individual}
            </p>
            <p className="text-xs sm:text-sm text-blue-700 mt-2">فردي</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-green-900">
              {data.gymSubsByCategory.friends}
            </p>
            <p className="text-xs sm:text-sm text-green-700 mt-2">أصدقاء</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-purple-900">
              {data.gymSubsByCategory.family_essential}
            </p>
            <p className="text-xs sm:text-sm text-purple-700 mt-2">عائلي</p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-900">
              {data.gymSubsByCategory.sub_adult}
            </p>
            <p className="text-xs sm:text-sm text-orange-700 mt-2">فرعي بالغ</p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 4: Subscription Duration Distribution
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          توزيع الاشتراكات حسب المدة
        </h2>
        {durationData.some((d) => d.value > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={durationData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
        )}
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 5: Expiring This Week Table
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          الاشتراكات المنتهية هذا الأسبوع
        </h2>
        {data.expiringSubs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm sm:text-base">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-right py-3 px-3 sm:px-4 font-bold">
                    الاسم
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4 font-bold">
                    الجوال
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4 font-bold">
                    الباقة
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4 font-bold">
                    تاريخ الانتهاء
                  </th>
                  <th className="text-right py-3 px-3 sm:px-4 font-bold">
                    أيام متبقية
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.expiringSubs.map((sub, idx) => {
                  let rowColor = "bg-white";
                  if (sub.daysLeft <= 3) rowColor = "bg-red-50";
                  else if (sub.daysLeft <= 7) rowColor = "bg-orange-50";

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-gray-200 ${rowColor}`}
                    >
                      <td className="py-3 px-3 sm:px-4">{sub.memberName}</td>
                      <td className="py-3 px-3 sm:px-4">{sub.phone}</td>
                      <td className="py-3 px-3 sm:px-4">{sub.packageName}</td>
                      <td className="py-3 px-3 sm:px-4">
                        {new Date(sub.endDate).toLocaleDateString("ar-SA")}
                      </td>
                      <td
                        className={`py-3 px-3 sm:px-4 font-bold ${
                          sub.daysLeft <= 3
                            ? "text-red-600"
                            : sub.daysLeft <= 7
                              ? "text-orange-600"
                              : "text-gray-600"
                        }`}
                      >
                        {sub.daysLeft}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            لا توجد اشتراكات منتهية هذا الأسبوع ✨
          </p>
        )}
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 6: Academy Stats
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          إحصائيات الأكاديمية
        </h2>

        {/* Academy Gender & Sport Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Gender Distribution */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-right mb-4">
              توزيع الأطفال حسب الجنس
            </h3>
            {data.activeAcademyChildren > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs sm:text-sm">أولاد</span>
                    <span className="text-xs sm:text-sm font-bold">
                      {data.academyBoys}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${
                          data.activeAcademyChildren > 0
                            ? Math.round(
                                (data.academyBoys /
                                  data.activeAcademyChildren) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs sm:text-sm">بنات</span>
                    <span className="text-xs sm:text-sm font-bold">
                      {data.academyGirls}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-pink-600 h-2 rounded-full"
                      style={{
                        width: `${
                          data.activeAcademyChildren > 0
                            ? Math.round(
                                (data.academyGirls /
                                  data.activeAcademyChildren) *
                                  100,
                              )
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
            )}
          </div>

          {/* Sport Distribution */}
          <div>
            <h3 className="text-sm sm:text-base font-bold text-right mb-4">
              توزيع الرياضات
            </h3>
            {sportData.length > 0 && sportData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={sportData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-8">لا توجد بيانات</p>
            )}
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 7: Groups Fill Rate
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          نسبة الامتلاء للمجموعات
        </h2>
        {data.groupStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="text-right py-3 px-2 sm:px-4 font-bold">
                    المجموعة
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold">
                    الرياضة
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold">
                    الحالي
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold">
                    الحد
                  </th>
                  <th className="text-right py-3 px-2 sm:px-4 font-bold">
                    النسبة
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.groupStats.map((group, idx) => {
                  let rowColor = "bg-white";
                  if (group.fillRate >= 80) rowColor = "bg-red-50";
                  else if (group.fillRate >= 60) rowColor = "bg-orange-50";
                  else rowColor = "bg-green-50";

                  return (
                    <tr
                      key={idx}
                      className={`border-b border-gray-200 ${rowColor}`}
                    >
                      <td className="py-3 px-2 sm:px-4">{group.name}</td>
                      <td className="py-3 px-2 sm:px-4">{group.sport}</td>
                      <td className="py-3 px-2 sm:px-4">
                        {group.currentCount}
                      </td>
                      <td className="py-3 px-2 sm:px-4">{group.maxCapacity}</td>
                      <td className="py-3 px-2 sm:px-4 font-bold">
                        <div className="flex items-center gap-2">
                          <span>{group.fillRate}%</span>
                          <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                group.fillRate >= 80
                                  ? "bg-red-600"
                                  : group.fillRate >= 60
                                    ? "bg-orange-600"
                                    : "bg-green-600"
                              }`}
                              style={{ width: `${group.fillRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">لا توجد مجموعات</p>
        )}
      </div>

      {/* ──────────────────────────────────────────────────
          SECTION 8: Member Gender Distribution
          ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-right mb-4 sm:mb-6">
          توزيع الأعضاء حسب الجنس
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-blue-900">
              {data.activeMaleMembers}
            </p>
            <p className="text-xs sm:text-sm text-blue-700 mt-2">
              أعضاء ذكور نشطين
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {data.totalActiveMembers > 0
                ? Math.round(
                    (data.activeMaleMembers / data.totalActiveMembers) * 100,
                  )
                : 0}
              %
            </p>
          </div>
          <div className="bg-pink-50 p-4 sm:p-6 rounded-lg border border-pink-200 text-center">
            <p className="text-2xl sm:text-3xl font-bold text-pink-900">
              {data.activeFemaleMembers}
            </p>
            <p className="text-xs sm:text-sm text-pink-700 mt-2">
              عضوات إناث نشطات
            </p>
            <p className="text-xs text-pink-600 mt-1">
              {data.totalActiveMembers > 0
                ? Math.round(
                    (data.activeFemaleMembers / data.totalActiveMembers) * 100,
                  )
                : 0}
              %
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
