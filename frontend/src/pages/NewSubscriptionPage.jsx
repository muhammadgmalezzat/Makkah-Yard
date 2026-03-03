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
  {
    id: "academy_only",
    label: "أكاديمية",
    description: "طفل غير مشترك (أقل من 15 سنة)",
    icon: "🏃",
  },
];

const stepLabels = ["النوع", "العضو", "الحزمة", "الدفع", "التأكيد"];

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-right";
const labelClass =
  "block text-sm font-semibold text-gray-600 mb-1.5 text-right";
const errorClass = "text-red-500 text-xs mt-1 text-right";

export default function NewSubscriptionPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
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
    reset,
  } = useForm({ resolver: zodResolver(memberSchema) });

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
        primaryName:
          window.primaryData?.fullName || window.memberData?.fullName,
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

  // ─── Success Screen ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-10 text-center border border-gray-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            تم إنشاء الاشتراك بنجاح!
          </h2>
          <p className="text-gray-500 mb-8">
            تم تسجيل الاشتراك الجديد في النظام
          </p>

          <div className="bg-gray-50 rounded-2xl p-6 text-right space-y-3 mb-8">
            <Row
              label="نوع الحساب"
              value={accountTypes.find((t) => t.id === successData.type)?.label}
            />
            <Row label="الحزمة" value={successData.packageName} />
            <Row label="العضو" value={successData.primaryName} />
            {successData.partnerName && (
              <Row label="الشريك" value={successData.partnerName} />
            )}
            <Row label="من" value={successData.startDate} />
            <Row label="إلى" value={successData.endDate} />
          </div>

          <button
            onClick={() => navigate("/subscriptions/search")}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            عرض الاشتراك
          </button>
        </div>
      </div>
    );
  }

  // ─── Main Layout ──────────────────────────────────────────────────────────
  const currentStepIndex = step === 2.5 ? 2 : Math.min(Math.ceil(step), 5);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">اشتراك جديد</h1>
          <p className="text-gray-500 mt-1">أنشئ اشتراكاً جديداً خطوة بخطوة</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {stepLabels.map((label, i) => {
            const n = i + 1;
            const active = n === currentStepIndex;
            const done = n < currentStepIndex;
            return (
              <div key={n} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                      ${done ? "bg-blue-600 text-white" : active ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-white border-2 border-gray-200 text-gray-400"}`}
                  >
                    {done ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      n
                    )}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium ${active ? "text-blue-600" : done ? "text-gray-500" : "text-gray-300"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-1 mb-4 transition-all ${done ? "bg-blue-600" : "bg-gray-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          {/* ── Step 1 ── */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                اختر نوع الحساب
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {accountTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (type.id === "academy_only") {
                        navigate("/subscriptions/academy-only");
                      } else {
                        setSelectedType(type.id);
                        setStep(2);
                      }
                    }}
                    className={`p-5 border-2 rounded-2xl text-center transition-all hover:border-blue-400 hover:bg-blue-50 group
                      ${selectedType === type.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}
                  >
                    <div className="text-3xl mb-2">{type.icon}</div>
                    <p className="font-bold text-gray-800">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit(handleMemberSubmit)}>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                {selectedType === "individual" && "معلومات العضو"}
                {selectedType === "friends" && "معلومات الشخص الأول"}
                {selectedType === "family" && "معلومات العضو الأساسي"}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>الاسم الكامل</label>
                  <input
                    {...register("fullName")}
                    placeholder="أحمد محمد"
                    className={inputClass}
                  />
                  {errors.fullName && (
                    <p className={errorClass}>{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>رقم الهاتف</label>
                  <input
                    {...register("phone")}
                    placeholder="0501234567"
                    className={inputClass}
                  />
                  {errors.phone && (
                    <p className={errorClass}>{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>الجنس</label>
                  <select {...register("gender")} className={inputClass}>
                    <option value="">اختر الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                  {errors.gender && (
                    <p className={errorClass}>{errors.gender.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    البريد الإلكتروني{" "}
                    <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    className={inputClass}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  السابق
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  التالي
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2.5 ── */}
          {step === 2.5 && (
            <form onSubmit={handleSubmit(handlePartnerSubmit)}>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {selectedType === "friends"
                  ? "معلومات الشخص الثاني"
                  : "معلومات الشريك"}
              </h2>
              {selectedType === "family" && (
                <div className="bg-blue-50 border border-blue-100 text-blue-700 text-sm px-4 py-3 rounded-xl mb-5">
                  يمكنك تخطي هذا الجزء إذا لم تكن هناك شريكة
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>الاسم الكامل</label>
                  <input
                    {...register("fullName")}
                    placeholder="علي محمد"
                    className={inputClass}
                  />
                  {errors.fullName && (
                    <p className={errorClass}>{errors.fullName.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>رقم الهاتف</label>
                  <input
                    {...register("phone")}
                    placeholder="0509876543"
                    className={inputClass}
                  />
                  {errors.phone && (
                    <p className={errorClass}>{errors.phone.message}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>الجنس</label>
                  <select {...register("gender")} className={inputClass}>
                    <option value="">اختر الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                  {errors.gender && (
                    <p className={errorClass}>{errors.gender.message}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    window.partnerData = null;
                    setStep(3);
                  }}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  {selectedType === "family" ? "بدون شريك" : "السابق"}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  التالي
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                اختر الحزمة المناسبة
              </h2>
              {filteredPackages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">📦</div>
                  <p>لا توجد حزم لهذا النوع</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredPackages.map((pkg) => (
                    <button
                      key={pkg._id}
                      onClick={() => {
                        setSelectedPackage(pkg);
                        setStep(4);
                      }}
                      className={`w-full flex items-center justify-between px-5 py-4 border-2 rounded-2xl text-right transition-all
                        ${
                          selectedPackage?._id === pkg._id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                    >
                      <div>
                        <p className="font-bold text-gray-800">{pkg.name}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {pkg.durationMonths} أشهر
                        </p>
                      </div>
                      <div className="text-left">
                        <span className="text-2xl font-extrabold text-blue-600">
                          {pkg.price}
                        </span>
                        <span className="text-sm text-gray-500 mr-1">ريال</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  السابق
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4 ── */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                التاريخ وطريقة الدفع
              </h2>

              {selectedPackage && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-6">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">
                      الحزمة المختارة
                    </p>
                    <p className="font-bold text-gray-800 mt-0.5">
                      {selectedPackage.name}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="text-2xl font-extrabold text-blue-600">
                      {selectedPackage.price}
                    </span>
                    <span className="text-sm text-gray-500 mr-1">ريال</span>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className={labelClass}>تاريخ البداية</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={inputClass}
                  />
                </div>

                {selectedPackage && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
                    <span>📅</span>
                    <span>
                      تاريخ الانتهاء:{" "}
                      <strong>
                        {calculateEndDate(
                          startDate,
                          selectedPackage.durationMonths,
                        )}
                      </strong>
                    </span>
                  </div>
                )}

                <div>
                  <label className={labelClass}>طريقة الدفع</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {[
                      { value: "cash", label: "نقدي", icon: "💵" },
                      { value: "network", label: "تحويل بنكي", icon: "🏦" },
                      { value: "tabby", label: "تابي", icon: "💳" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value)}
                        className={`py-3 rounded-xl border-2 text-center text-sm font-semibold transition-all
                          ${
                            paymentMethod === m.value
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-gray-200 text-gray-600 hover:border-blue-300"
                          }`}
                      >
                        <div className="text-xl mb-1">{m.icon}</div>
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  السابق
                </button>
                <button
                  onClick={() => setStep(5)}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
                >
                  مراجعة البيانات
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5 ── */}
          {step === 5 && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                مراجعة البيانات
              </h2>

              <div className="space-y-3 mb-6">
                <SummaryRow
                  label="نوع الحساب"
                  value={accountTypes.find((t) => t.id === selectedType)?.label}
                />
                <SummaryRow
                  label="العضو الأساسي"
                  value={
                    <div>
                      <p className="font-semibold">
                        {window.primaryData?.fullName ||
                          window.memberData?.fullName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {window.primaryData?.phone || window.memberData?.phone}
                      </p>
                    </div>
                  }
                />
                {window.partnerData && (
                  <SummaryRow
                    label="الشريك"
                    value={
                      <div>
                        <p className="font-semibold">
                          {window.partnerData?.fullName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {window.partnerData?.phone}
                        </p>
                      </div>
                    }
                  />
                )}
                <SummaryRow label="الحزمة" value={selectedPackage?.name} />
                <SummaryRow
                  label="الفترة"
                  value={`من ${new Date(startDate).toLocaleDateString("ar-SA")} إلى ${calculateEndDate(startDate, selectedPackage?.durationMonths)}`}
                />
                <SummaryRow
                  label="طريقة الدفع"
                  value={
                    paymentMethod === "cash"
                      ? "نقدي"
                      : paymentMethod === "network"
                        ? "تحويل بنكي"
                        : "تابي"
                  }
                />
              </div>

              <div className="bg-blue-600 rounded-2xl px-6 py-4 flex items-center justify-between mb-6">
                <span className="text-blue-100 font-medium">الإجمالي</span>
                <div className="text-left">
                  <span className="text-3xl font-extrabold text-white">
                    {selectedPackage?.price}
                  </span>
                  <span className="text-blue-200 mr-1">ريال</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
                >
                  السابق
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8z"
                        />
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : (
                    "✓ تأكيد وحفظ"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between items-start bg-gray-50 rounded-xl px-4 py-3">
      <span className="text-gray-500 text-sm pt-0.5 shrink-0 ml-4">
        {label}
      </span>
      <div className="text-right font-semibold text-gray-800">
        {typeof value === "string" ? value : value}
      </div>
    </div>
  );
}
