import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

const memberSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  phone: z.string().min(9, "رقم الهاتف مطلوب"),
  email: z.string().email().optional().or(z.literal("")),
  nationalId: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female"]),
  dateOfBirth: z.string().optional().or(z.literal("")),
});

const accountTypes = [
  { id: "individual", label: "فردي", description: "عضو واحد", icon: "👤" },
  { id: "friends", label: "أصدقاء", description: "شخصان", icon: "👥" },
  { id: "family", label: "عائلي", description: "عائلة", icon: "👨‍👩‍👧" },
  { id: "academy_only", label: "أكاديمية", description: "طفل غير مشترك (أقل من 15 سنة)", icon: "🏃" },
];

export default function NewSubscriptionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(memberSchema),
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await axios.get("/packages");
      return response.data;
    },
  });

  const filteredPackages = packages.filter((pkg) => {
    if (selectedType === "individual") return pkg.category === "individual";
    if (selectedType === "friends") return pkg.category === "friends";
    if (selectedType === "family") return pkg.category === "family_essential";
    return false;
  });

  const calculateEndDate = (start, durationMonths) => {
    const date = new Date(start);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toLocaleDateString("ar-SA");
  };

  const handleMemberSubmit = (data) => {
    window.memberData = data;
    if (selectedType === "individual") {
      setStep(3);
    } else {
      window.primaryData = data;
      setStep(2.5);
      reset();
    }
  };

  const handlePartnerSubmit = (data) => {
    window.partnerData = data;
    setStep(3);
  };

  const handleFinalSubmit = async () => {
    if (!selectedPackage) {
      setError("يجب اختيار حزمة");
      return;
    }

    setLoading(true);
    setError("");
    try {
      let body = {
        accountType: selectedType,
        packageId: selectedPackage._id,
        startDate,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      };

      if (selectedType === "individual") {
        body.memberData = window.memberData;
      } else {
        body.primaryData = window.primaryData;
        body.partnerData = window.partnerData || null;
      }

      await axios.post("/subscriptions", body);

      setSuccessData({
        type: selectedType,
        packageName: selectedPackage.name,
        startDate: new Date(startDate).toLocaleDateString("ar-SA"),
        endDate: calculateEndDate(startDate, selectedPackage.durationMonths),
        primaryName: window.primaryData?.fullName || window.memberData?.fullName,
        partnerName: window.partnerData?.fullName,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "فشل إنشاء الاشتراك");
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">✓ تم إنشاء الاشتراك بنجاح</h2>
          <p className="text-lg mb-2">
            نوع الحساب:{" "}
            {accountTypes.find((t) => t.id === successData.type)?.label}
          </p>
          <p className="text-lg mb-2">الحزمة: {successData.packageName}</p>
          <p className="text-lg mb-2">العضو: {successData.primaryName}</p>
          {successData.partnerName && (
            <p className="text-lg mb-2">الشريك: {successData.partnerName}</p>
          )}
          <p className="text-lg mb-4">
            من {successData.startDate} إلى {successData.endDate}
          </p>
          <button
            onClick={() => navigate("/subscriptions/search")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            عرض الاشتراك
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">اشتراك جديد</h1>

      {/* Progress */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex items-center justify-center w-12 h-12 rounded-full font-bold ${
              s <= step ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">اختر نوع الحساب</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => {
                  if (type.id === "academy_only") {
                    navigate("/subscriptions/academy-only");
                  } else {
                    setSelectedType(type.id);
                    setStep(2);
                  }
                }}
                className="p-6 border-2 border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition text-center"
              >
                <div className="text-4xl mb-2">{type.icon}</div>
                <h3 className="text-xl font-bold mb-2">{type.label}</h3>
                <p className="text-gray-600">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <form onSubmit={handleSubmit(handleMemberSubmit)} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">
            {selectedType === "individual" && "معلومات العضو"}
            {selectedType === "friends" && "معلومات الشخص الأول"}
            {selectedType === "family" && "معلومات العضو الأساسي"}
          </h2>

          <div>
            <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
            <input
              {...register("fullName")}
              placeholder="أحمد محمد"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              رقم الهاتف
            </label>
            <input
              {...register("phone")}
              placeholder="0501234567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الجنس</label>
            <select
              {...register("gender")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">اختر الجنس</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            {errors.gender && (
              <p className="text-red-600 text-sm mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              البريد الإلكتروني (اختياري)
            </label>
            <input
              {...register("email")}
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              السابق
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              التالي
            </button>
          </div>
        </form>
      )}

      {/* Step 2.5 */}
      {step === 2.5 && (
        <form onSubmit={handleSubmit(handlePartnerSubmit)} className="space-y-4">
          <h2 className="text-2xl font-bold mb-4">
            {selectedType === "friends" && "معلومات الشخص الثاني"}
            {selectedType === "family" && "معلومات الشريك (اختياري)"}
          </h2>

          {selectedType === "family" && (
            <div className="bg-blue-50 p-4 rounded mb-4">
              <p className="text-sm text-blue-700">
                يمكنك تخطي هذا الجزء إذا لم تكن هناك شريكة
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
            <input
              {...register("fullName")}
              placeholder="علي محمد"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.fullName && (
              <p className="text-red-600 text-sm mt-1">
                {errors.fullName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              رقم الهاتف
            </label>
            <input
              {...register("phone")}
              placeholder="0509876543"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
            {errors.phone && (
              <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">الجنس</label>
            <select
              {...register("gender")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">اختر الجنس</option>
              <option value="male">ذكر</option>
              <option value="female">أنثى</option>
            </select>
            {errors.gender && (
              <p className="text-red-600 text-sm mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => {
                window.partnerData = null;
                setStep(3);
              }}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              {selectedType === "family" ? "بدون شريك" : "السابق"}
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              التالي
            </button>
          </div>
        </form>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">اختر حزمة</h2>

          {filteredPackages.length === 0 ? (
            <p className="text-gray-600">لا توجد حزم لهذا النوع</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => {
                    setSelectedPackage(pkg);
                    setStep(4);
                  }}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPackage?._id === pkg._id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-gray-600">
                    {pkg.durationMonths} أشهر
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {pkg.price} ريال
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              السابق
            </button>
          </div>
        </div>
      )}

      {/* Step 4 */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">التاريخ والدفع</h2>

          {selectedPackage && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium">الحزمة المختارة: {selectedPackage.name}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                {selectedPackage.price} ريال
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {selectedPackage && (
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">
                تاريخ النهاية:{" "}
                <span className="font-bold">
                  {calculateEndDate(startDate, selectedPackage.durationMonths)}
                </span>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="cash">نقدي</option>
              <option value="network">تحويل بنكي</option>
              <option value="tabby">تابي</option>
            </select>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(3)}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              السابق
            </button>
            <button
              onClick={() => setStep(5)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              مراجعة البيانات
            </button>
          </div>
        </div>
      )}

      {/* Step 5 */}
      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">مراجعة البيانات</h2>

          <div className="bg-gray-50 p-6 rounded-lg space-y-4">
            <div>
              <p className="text-sm text-gray-600">نوع الحساب:</p>
              <p className="font-bold text-lg">
                {accountTypes.find((t) => t.id === selectedType)?.label}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">العضو الأساسي:</p>
              <p className="font-bold text-lg">
                {window.primaryData?.fullName || window.memberData?.fullName}
              </p>
              <p className="text-sm text-gray-600">
                {window.primaryData?.phone || window.memberData?.phone}
              </p>
            </div>

            {window.partnerData && (
              <div>
                <p className="text-sm text-gray-600">الشريك:</p>
                <p className="font-bold text-lg">
                  {window.partnerData?.fullName}
                </p>
                <p className="text-sm text-gray-600">
                  {window.partnerData?.phone}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600">الحزمة:</p>
              <p className="font-bold text-lg">{selectedPackage?.name}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">الفترة:</p>
              <p className="font-bold">
                من {new Date(startDate).toLocaleDateString("ar-SA")} إلى{" "}
                {calculateEndDate(startDate, selectedPackage?.durationMonths)}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">طريقة الدفع:</p>
              <p className="font-bold">
                {paymentMethod === "cash"
                  ? "نقدي"
                  : paymentMethod === "network"
                    ? "تحويل بنكي"
                    : "تابي"}
              </p>
            </div>

            <div className="bg-blue-100 border-l-4 border-blue-600 p-4">
              <p className="text-lg font-bold text-blue-900">
                الإجمالي: {selectedPackage?.price} ريال
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setStep(4)}
              className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
            >
              السابق
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "جاري الحفظ..." : "تأكيد وحفظ"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
