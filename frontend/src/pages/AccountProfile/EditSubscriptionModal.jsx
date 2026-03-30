/**
 * EditSubscriptionModal - Modal for editing subscription details
 */
export function EditSubscriptionModal({
  subscription,
  form,
  onFormChange,
  onSubmit,
  onCancel,
}) {
  if (!subscription) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-xl min-h-screen sm:min-h-0 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">تعديل الاشتراك</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                onFormChange({ ...form, startDate: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تاريخ النهاية
            </label>
            <input
              type="date"
              value={form.endDate}
              onChange={(e) =>
                onFormChange({ ...form, endDate: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الحالة
            </label>
            <select
              value={form.status}
              onChange={(e) =>
                onFormChange({ ...form, status: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">نشط</option>
              <option value="expired">منتهي</option>
              <option value="frozen">مجمد</option>
              <option value="cancelled">ملغي</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              المبلغ المدفوع
            </label>
            <input
              type="number"
              value={form.pricePaid}
              onChange={(e) =>
                onFormChange({
                  ...form,
                  pricePaid: parseFloat(e.target.value),
                })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onSubmit}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 min-h-[44px] flex items-center justify-center"
          >
            حفظ التعديلات
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 min-h-[44px] flex items-center justify-center"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
