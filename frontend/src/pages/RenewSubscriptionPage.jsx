import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

const inputClass =
  "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-right";
const labelClass =
  "block text-sm font-semibold text-gray-600 mb-1.5 text-right";

export default function RenewSubscriptionPage() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: async () => {
      const response = await axios.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    },
  });

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await axios.get("/packages");
      return response.data;
    },
  });

  const calculateEndDate = (start, durationMonths) => {
    const date = new Date(start);
    date.setMonth(date.getMonth() + durationMonths);
    return date.toLocaleDateString("ar-SA");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) {
      setError("يجب اختيار حزمة");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`/subscriptions/${subscriptionId}/renew`, {
        packageId: selectedPackage._id,
        startDate,
        paymentMethod,
        paymentDate: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => navigate("/subscriptions/search"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تجديد الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <svg
            className="animate-spin w-8 h-8 text-blue-500"
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
          <span className="text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (!subscription) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          الاشتراك غير موجود
        </div>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex items-center justify-center h-64" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
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
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            تم تجديد الاشتراك بنجاح
          </h2>
          <p className="text-sm text-gray-400">جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  // ── Main ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">تجديد الاشتراك</h1>
        <p className="text-gray-500 mt-1">
          اختر الحزمة الجديدة وأكمل بيانات الدفع
        </p>
      </div>

      {/* Current Subscription Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          الاشتراك الحالي
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="الاسم" value={subscription.memberId.fullName} />
          <InfoItem
            label="الحزمة الحالية"
            value={subscription.packageId.name}
          />
          <InfoItem
            label="تاريخ البداية"
            value={new Date(subscription.startDate).toLocaleDateString("ar-SA")}
          />
          <InfoItem
            label="تاريخ النهاية"
            value={new Date(subscription.endDate).toLocaleDateString("ar-SA")}
            highlight={new Date(subscription.endDate) < new Date()}
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Package Selection */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block mb-4">
            اختر الحزمة الجديدة
          </label>
          <div className="grid gap-3">
            {packages.map((pkg) => (
              <button
                key={pkg._id}
                type="button"
                onClick={() => setSelectedPackage(pkg)}
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

          {selectedPackage && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3 mt-4">
              <span>📅</span>
              <span>
                تاريخ الانتهاء الجديد:{" "}
                <strong>
                  {calculateEndDate(startDate, selectedPackage.durationMonths)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Date & Payment */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <label className="text-sm font-semibold text-gray-400 uppercase tracking-wide block">
            بيانات الدفع
          </label>

          <div>
            <label className={labelClass}>تاريخ البداية</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
          </div>

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
                  type="button"
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

          {selectedPackage && (
            <div className="bg-blue-600 rounded-2xl px-6 py-4 flex items-center justify-between">
              <span className="text-blue-100 font-medium">الإجمالي</span>
              <div className="text-left">
                <span className="text-3xl font-extrabold text-white">
                  {selectedPackage.price}
                </span>
                <span className="text-blue-200 mr-1">ريال</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition"
          >
            إلغاء
          </button>
          <button
            type="submit"
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
                جاري التجديد...
              </span>
            ) : (
              "✓ تجديد الاشتراك"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p
        className={`font-semibold ${highlight ? "text-red-500" : "text-gray-800"}`}
      >
        {value}
      </p>
    </div>
  );
}
