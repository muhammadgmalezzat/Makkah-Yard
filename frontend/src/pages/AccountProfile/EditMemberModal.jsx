/**
 * EditMemberModal - Modal for editing member information
 */
export function EditMemberModal({
  member,
  form,
  onFormChange,
  onSubmit,
  onCancel,
}) {
  if (!member) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      dir="rtl"
    >
      <div className="bg-white rounded-none sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md shadow-xl min-h-screen sm:min-h-0 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">تعديل بيانات العضو</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل
            </label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) =>
                onFormChange({ ...form, fullName: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الجوال
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => onFormChange({ ...form, phone: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => onFormChange({ ...form, email: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              الجنس
            </label>
            <select
              value={form.gender}
              onChange={(e) =>
                onFormChange({ ...form, gender: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهوية
            </label>
            <input
              type="text"
              value={form.nationalId}
              onChange={(e) =>
                onFormChange({ ...form, nationalId: e.target.value })
              }
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {member.role === "child" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                تاريخ الميلاد
              </label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  onFormChange({ ...form, dateOfBirth: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onSubmit}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 min-h-[44px] flex items-center justify-center"
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
