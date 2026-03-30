/**
 * StatsCards - Account statistics cards
 */
export function StatsCards({ stats }) {
  if (!stats) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">
            {stats.totalMembers}
          </p>
          <p className="text-sm text-blue-700 mt-1">إجمالي الأعضاء</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-green-600">
            {stats.activeMembers}
          </p>
          <p className="text-sm text-green-700 mt-1">أعضاء نشط</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
          <p className="text-3xl font-bold text-purple-600">
            {stats.totalPayments}
          </p>
          <p className="text-sm text-purple-700 mt-1">عدد المدفوعات</p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {stats.totalPaid}
          </p>
          <p className="text-sm text-orange-700 mt-1">إجمالي المدفوعات</p>
        </div>
      </div>

      {stats?.lastPaymentDate && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-sm">
          <p className="text-gray-600">
            آخر دفعة:
            <span className="font-bold text-gray-900 mr-2">
              {new Date(stats.lastPaymentDate).toLocaleDateString("ar-SA")}
            </span>
          </p>
        </div>
      )}
    </>
  );
}
