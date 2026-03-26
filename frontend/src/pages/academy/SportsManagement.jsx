import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

export default function SportsManagement() {
  const user = useAuthStore((state) => state.user);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    gender: "",
    minAge: 4,
    maxAge: 14,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch all sports
  const { data: sports = [], refetch } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const response = await axios.get("/academy/sports");
      return response.data;
    },
  });

  // Group sports by gender
  const sportsByGender = {
    male: sports.filter((s) => s.gender === "male"),
    female: sports.filter((s) => s.gender === "female"),
    both: sports.filter((s) => s.gender === "both"),
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.name || !formData.gender) {
        setError("الاسم والنوع مطلوبان");
        setLoading(false);
        return;
      }

      await axios.post("/academy/sports", {
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        gender: formData.gender,
        minAge: parseInt(formData.minAge),
        maxAge: parseInt(formData.maxAge),
      });

      setSuccess("تم إنشاء الرياضة بنجاح");
      setFormData({
        name: "",
        nameEn: "",
        gender: "",
        minAge: 4,
        maxAge: 14,
      });
      setIsFormOpen(false);
      refetch();
    } catch (err) {
      setError(
        err.response?.data?.message || "فشل إنشاء الرياضة، حاول مرة أخرى",
      );
    } finally {
      setLoading(false);
    }
  };

  const genderLabels = {
    male: "أولاد",
    female: "بنات",
    both: "مشترك",
  };

  const genderBadgeColor = {
    male: "bg-blue-100 text-blue-700",
    female: "bg-pink-100 text-pink-700",
    both: "bg-purple-100 text-purple-700",
  };

  const renderGenderSection = (genderKey, label) => (
    <div key={genderKey} className="mb-8">
      <h2 className="text-2xl font-bold text-right mb-4 pb-2 border-b-2 border-gray-300">
        {label}
      </h2>
      {sportsByGender[genderKey].length === 0 ? (
        <p className="text-gray-500 text-right">لا توجد رياضات في هذا القسم</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sportsByGender[genderKey].map((sport) => (
            <div
              key={sport._id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <h3 className="text-lg font-bold text-right mb-2">
                {sport.name}
              </h3>
              {sport.nameEn && (
                <p className="text-sm text-gray-600 text-right mb-3">
                  {sport.nameEn}
                </p>
              )}
              <div className="flex gap-2 flex-wrap justify-end mb-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    genderBadgeColor[sport.gender]
                  }`}
                >
                  {genderLabels[sport.gender]}
                </span>
                {sport.isActive ? (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                    نشطة
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700">
                    معطلة
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 text-right mb-2">
                <p>
                  العمر: {sport.minAge} - {sport.maxAge} سنة
                </p>
              </div>
              <div className="text-sm text-right">
                <p className="text-blue-600 font-semibold">
                  {sport.activeGroupsCount} مجموعات فعالة
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">إدارة الرياضات</h1>
        {user?.role === "admin" && (
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isFormOpen ? "إلغاء" : "+ إضافة رياضة"}
          </button>
        )}
      </div>

      {/* Form */}
      {isFormOpen && user?.role === "admin" && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-right mb-4">
            إضافة رياضة جديدة
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-right font-semibold mb-2">
                  الاسم بالعربية *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                  required
                />
              </div>
              <div>
                <label className="block text-right font-semibold mb-2">
                  الاسم بالإنجليزية
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) =>
                    setFormData({ ...formData, nameEn: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-right font-semibold mb-2">
                النوع *
              </label>
              <select
                value={formData.gender}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                required
              >
                <option value="">اختر النوع</option>
                <option value="male">أولاد</option>
                <option value="female">بنات</option>
                <option value="both">مشترك</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-right font-semibold mb-2">
                  الحد الأدنى للعمر
                </label>
                <input
                  type="number"
                  value={formData.minAge}
                  onChange={(e) =>
                    setFormData({ ...formData, minAge: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-right font-semibold mb-2">
                  الحد الأقصى للعمر
                </label>
                <input
                  type="number"
                  value={formData.maxAge}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAge: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                  min="1"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "جاري الإضافة..." : "إضافة الرياضة"}
            </button>
          </form>
        </div>
      )}

      {/* Sports List */}
      {renderGenderSection("male", "أولاد")}
      {renderGenderSection("female", "بنات")}
      {renderGenderSection("both", "مشترك")}
    </div>
  );
}
