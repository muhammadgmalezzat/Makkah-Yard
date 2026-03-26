import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

export default function GroupsManagement() {
  const user = useAuthStore((state) => state.user);
  const [selectedSportId, setSelectedSportId] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    sportId: "",
    name: "",
    schedule: "",
    maxCapacity: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit modal state
  const [editingGroup, setEditingGroup] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    schedule: "",
    maxCapacity: 0,
    isActive: true,
  });

  // Fetch all sports for dropdown
  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const response = await axios.get("/academy/sports");
      return response.data;
    },
  });

  // Fetch groups
  const {
    data: groups = [],
    refetch: refetchGroups,
    isLoading: groupsLoading,
  } = useQuery({
    queryKey: ["groups", selectedSportId],
    queryFn: async () => {
      const query = selectedSportId ? `?sportId=${selectedSportId}` : "";
      const response = await axios.get(`/academy/groups${query}`);
      return response.data;
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.sportId || !formData.name || !formData.maxCapacity) {
        setError("الرياضة والاسم والسعة مطلوبة");
        setLoading(false);
        return;
      }

      await axios.post("/academy/groups", {
        sportId: formData.sportId,
        name: formData.name,
        schedule: formData.schedule,
        maxCapacity: parseInt(formData.maxCapacity),
      });

      setSuccess("تم إنشاء المجموعة بنجاح");
      setFormData({
        sportId: "",
        name: "",
        schedule: "",
        maxCapacity: 20,
      });
      setIsFormOpen(false);
      refetchGroups();
    } catch (err) {
      setError(
        err.response?.data?.message || "فشل إنشاء المجموعة، حاول مرة أخرى",
      );
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (group) => {
    setEditingGroup(group);
    setEditForm({
      name: group.name,
      schedule: group.schedule,
      maxCapacity: group.maxCapacity,
      isActive: group.isActive,
    });
  };

  const closeEditModal = () => {
    setEditingGroup(null);
  };

  const handleEditSubmit = async () => {
    try {
      await axios.put(`/academy/groups/${editingGroup._id}`, editForm);
      closeEditModal();
      refetchGroups();
    } catch (error) {
      console.error("Update failed:", error);
      alert(error.response?.data?.message || "حدث خطأ");
    }
  };

  const getCapacityColor = (groupId) => {
    const group = groups.find((g) => g._id === groupId);
    if (!group) return "bg-gray-300";

    const percentage = (group.currentCount / group.maxCapacity) * 100;
    if (percentage >= 100) return "bg-red-500";
    if (percentage >= 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getCapacityBadgeColor = (groupId) => {
    const group = groups.find((g) => g._id === groupId);
    if (!group) return "";

    const percentage = (group.currentCount / group.maxCapacity) * 100;
    if (percentage >= 100) return "bg-red-100 text-red-700";
    if (percentage >= 80) return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">إدارة المجموعات</h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isFormOpen ? "إلغاء" : "+ إضافة مجموعة"}
          </button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && user?.role === "admin" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-bold text-right mb-4">
            إضافة مجموعة جديدة
          </h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-right font-semibold mb-2">
                الرياضة *
              </label>
              <select
                value={formData.sportId}
                onChange={(e) =>
                  setFormData({ ...formData, sportId: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                required
              >
                <option value="">اختر الرياضة</option>
                {sports.map((sport) => (
                  <option key={sport._id} value={sport._id}>
                    {sport.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-right font-semibold mb-2">
                اسم المجموعة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                placeholder="مثال: المجموعة أ، الفئة 6-9"
                required
              />
            </div>

            <div>
              <label className="block text-right font-semibold mb-2">
                الجدول الزمني
              </label>
              <input
                type="text"
                value={formData.schedule}
                onChange={(e) =>
                  setFormData({ ...formData, schedule: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                placeholder="مثال: الأحد والثلاثاء 4-5 مساءً"
              />
            </div>

            <div>
              <label className="block text-right font-semibold mb-2">
                السعة القصوى *
              </label>
              <input
                type="number"
                value={formData.maxCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, maxCapacity: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                min="1"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "جاري الإضافة..." : "إضافة المجموعة"}
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <label className="block text-right font-semibold mb-2">
          تصفية حسب الرياضة
        </label>
        <select
          value={selectedSportId}
          onChange={(e) => setSelectedSportId(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg text-right"
        >
          <option value="">جميع الرياضات</option>
          {sports.map((sport) => (
            <option key={sport._id} value={sport._id}>
              {sport.name}
            </option>
          ))}
        </select>
      </div>

      {/* Groups List */}
      {groupsLoading ? (
        <div className="text-center py-8">جاري التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          لا توجد مجموعات للعرض
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => {
            const percentage = (group.currentCount / group.maxCapacity) * 100;
            return (
              <div
                key={group._id}
                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="text-right flex-1">
                    <h3 className="text-lg font-bold">{group.name}</h3>
                    {group.sportId && (
                      <p className="text-sm text-gray-600">
                        {group.sportId.name}
                      </p>
                    )}
                  </div>
                  {group.isFull && (
                    <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 ml-2">
                      ممتلئة
                    </span>
                  )}
                </div>

                {group.schedule && (
                  <div className="text-sm text-right text-gray-600 mb-3">
                    <p>📅 {group.schedule}</p>
                  </div>
                )}

                <div className="mb-3">
                  <div className="flex justify-between items-center text-right mb-2">
                    <span className="font-semibold">
                      {group.currentCount} / {group.maxCapacity}
                    </span>
                    <span className="text-sm text-gray-600">السعة</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getCapacityColor(
                        group._id,
                      )}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${getCapacityBadgeColor(
                      group._id,
                    )}`}
                  >
                    {percentage.toFixed(0)}% مستخدمة
                  </span>
                </div>

                {user?.role === "admin" && (
                  <div className="flex justify-end mt-3 pt-3 border-t">
                    <button
                      onClick={() => openEditModal(group)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      ✏️ تعديل
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingGroup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-4"
          dir="rtl"
        >
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:w-auto sm:max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              تعديل مجموعة: {editingGroup.name}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              الرياضة: {editingGroup.sportId?.name}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم المجموعة
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الجدول الزمني
                </label>
                <input
                  type="text"
                  value={editForm.schedule}
                  onChange={(e) =>
                    setEditForm({ ...editForm, schedule: e.target.value })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  الطاقة الاستيعابية
                </label>
                <input
                  type="number"
                  value={editForm.maxCapacity}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      maxCapacity: parseInt(e.target.value),
                    })
                  }
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) =>
                    setEditForm({ ...editForm, isActive: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-700"
                >
                  المجموعة نشطة
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleEditSubmit}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700"
              >
                حفظ التعديلات
              </button>
              <button
                onClick={closeEditModal}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
