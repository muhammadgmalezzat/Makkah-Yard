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

export default function NewSubscriptionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
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
  } = useForm({
    resolver: zodResolver(memberSchema),
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages", "individual"],
    queryFn: async () => {
      const response = await axios.get("/packages?category=individual");
      return response.data;
    },
  });

  const calculateEndDate = (start, durationMonths) => {
    const date = new Date(start);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toLocaleDateString("ar-SA");
  };

  const onSubmit = async (memberData) => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedPackage) {
        setError("يجب اختيار حزمة");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Submit
    setLoading(true);
    setError("");
    try {
      const response = await axios.post("/subscriptions", {
        memberData,
        packageId: selectedPackage._id,
        startDate,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      });

      setSuccessData({
        memberName: response.data.member.fullName,
        startDate: new Date(
          response.data.subscription.startDate,
        ).toLocaleDateString("ar-SA"),
        endDate: new Date(
          response.data.subscription.endDate,
        ).toLocaleDateString("ar-SA"),
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "فشل إنشاء الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">✓ تم إنشاء الاشتراك بنجاح</h2>
          <p className="text-lg mb-2">اسم العضو: {successData.memberName}</p>
          <p className="text-lg mb-2">تاريخ البداية: {successData.startDate}</p>
          <p className="text-lg mb-4">تاريخ النهاية: {successData.endDate}</p>
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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">اشتراك جديد</h1>

      {/* Progress indicator */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map((s) => (
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

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        {/* Step 1: Member Info */}
        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold mb-4">معلومات العضو</h2>

            <div>
              <label className="block text-sm font-medium mb-2">
                الاسم الكامل
              </label>
              <input
                {...register("fullName")}
                placeholder="أحمد محمد"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.phone && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.phone.message}
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
                placeholder="example@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الجنس</label>
              <select
                {...register("gender")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                التالي
              </button>
            </div>
          </>
        )}

        {/* Step 2: Package Selection */}
        {step === 2 && (
          <>
            <h2 className="text-2xl font-bold mb-4">اختر حزمة</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg._id}
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                    selectedPackage?._id === pkg._id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-blue-400"
                  }`}
                >
                  <h3 className="font-bold">{pkg.name}</h3>
                  <p className="text-sm text-gray-600">
                    {pkg.durationMonths} أشهر
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">
                    {pkg.price} ريال
                  </p>
                </div>
              ))}
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
          </>
        )}

        {/* Step 3: Payment & Dates */}
        {step === 3 && (
          <>
            <h2 className="text-2xl font-bold mb-4">التاريخ والدفع</h2>

            {selectedPackage && (
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="font-medium">
                  الحزمة المختارة: {selectedPackage.name}
                </p>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {selectedPackage && (
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-700">
                  تاريخ النهاية:{" "}
                  <span className="font-bold">
                    {calculateEndDate(
                      startDate,
                      selectedPackage.durationMonths,
                    )}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">نقدي</option>
                <option value="network">تحويل بنكي</option>
                <option value="tabby">تابي</option>
              </select>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
              >
                السابق
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "جاري الحفظ..." : "إنشاء الاشتراك"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
