/**
 * PaymentHistoryTable - Payment history table section
 */
export function PaymentHistoryTable({
  payments,
  paymentMethodConfig,
  typeConfig,
}) {
  if (!payments || payments.length === 0) return null;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">سجل المدفوعات</h2>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  نوع العملية
                </th>
                <th className="px-6 py-3 text-right font-semibold text-gray-700">
                  بواسطة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments.slice(0, 10).map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-900">
                    {new Date(payment.paidAt).toLocaleDateString("ar-SA")}
                  </td>
                  <td className="px-6 py-3 font-bold text-green-600">
                    {payment.amount} ريال
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {paymentMethodConfig[payment.method] || payment.method}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {typeConfig[payment.type] || payment.type}
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {payment.createdBy?.name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payments.length > 10 && (
        <p className="text-sm text-gray-500 text-center">
          يتم عرض أول 10 مدفوعات. إجمالي المدفوعات: {payments.length}
        </p>
      )}
    </div>
  );
}
