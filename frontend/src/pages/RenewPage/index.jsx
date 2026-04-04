import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
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
  );
}

function monthLabel(m) {
  if (m === 12) return "سنة";
  if (m === 1) return "شهر";
  return `${m} أشهر`;
}

const statusLabel = {
  active: "نشط",
  expired: "منتهي",
  renewed: "مجدد",
  cancelled: "ملغى",
};

const statusBadge = {
  active: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  renewed: "bg-blue-100 text-blue-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function RenewPage() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();

  const [durationMonths, setDurationMonths] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Fetch subscription
  const { data: subscription, isLoading } = useQuery({
    queryKey: ["subscription", subscriptionId],
    queryFn: async () => {
      const res = await axios.get(`/subscriptions/${subscriptionId}`);
      return res.data;
    },
  });

  // Fetch packages for this account category — only runs once subscription is loaded
  const { data: packages = [] } = useQuery({
    queryKey: ["packages-for-renewal", subscription?.packageId?.category],
    queryFn: async () => {
      const category = subscription?.packageId?.category;
      if (!category) return [];
      const res = await axios.get("/packages", { params: { category } });
      return res.data || [];
    },
    enabled: !!subscription?.packageId?.category,
  });

  // Build duration options from actual packages, sorted by duration
  const durationOptions = packages
    .map((p) => ({ months: p.durationMonths, price: p.price, packageId: p._id }))
    .sort((a, b) => a.months - b.months);

  // ── loading states ──────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
          الاشتراك غير موجود
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

  // ── derived values ──────────────────────────────────────────────────────────

  const pkg = subscription.packageId;
  const currentEndDate = new Date(subscription.endDate);
  const accountId = subscription.accountId?._id || subscription.accountId;

  const selectedPkg = durationOptions.find((p) => p.months === durationMonths);
  const calculatedPrice = selectedPkg?.price || 0;
  const newEndDate = durationMonths ? addMonths(currentEndDate, durationMonths) : null;

  // ── submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!durationMonths || !selectedPkg) {
      setError("يجب اختيار مدة التجديد");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await axios.post(`/subscriptions/${subscriptionId}/renew`, {
        packageId: selectedPkg.packageId,
        startDate: currentEndDate.toISOString(),
        paymentMethod,
        paymentDate: new Date().toISOString(),
        months: durationMonths,
        pricePaid: calculatedPrice,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/accounts/${accountId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تجديد الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-0 space-y-6" dir="rtl">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-4"
        >
          ← رجوع
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">تجديد الاشتراك</h1>
        <p className="text-gray-500 mt-1 text-sm">تمديد نفس الباقة بمدة إضافية</p>
      </div>

      {/* Current subscription card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          الاشتراك الحالي
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoBox label="العضو" value={subscription.memberId?.fullName || "-"} />
          <InfoBox label="الباقة" value={pkg?.name || "-"} />
          <InfoBox
            label="تاريخ الانتهاء"
            value={currentEndDate.toLocaleDateString("ar-SA")}
            highlight={currentEndDate < new Date()}
          />
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-400 mb-1">الحالة</p>
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                statusBadge[subscription.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabel[subscription.status] || subscription.status}
            </span>
          </div>
        </div>
      </div>

      {/* Duration selector — options from real packages */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          مدة التجديد
        </h2>

        {durationOptions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">جاري تحميل الخيارات...</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {durationOptions.map((opt) => (
              <button
                key={opt.months}
                onClick={() => setDurationMonths(opt.months)}
                className={`px-6 py-3 rounded-xl border-2 font-semibold text-sm transition-all min-w-[100px] text-center ${
                  durationMonths === opt.months
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div>{monthLabel(opt.months)}</div>
                <div className="text-xs mt-1 font-normal text-gray-500">
                  {opt.price.toLocaleString("ar-SA")} ريال
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Price + new end date */}
      {durationMonths && selectedPkg && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
            تفاصيل التجديد
          </h2>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600 text-sm">المدة</span>
            <span className="font-bold text-gray-900">{monthLabel(durationMonths)}</span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-gray-100">
            <span className="text-gray-600 text-sm">تاريخ الانتهاء الجديد</span>
            <span className="font-bold text-blue-600">
              {newEndDate.toLocaleDateString("ar-SA")}
            </span>
          </div>

          <div className="bg-blue-600 rounded-2xl px-6 py-4 flex items-center justify-between">
            <span className="text-blue-100 font-medium">الإجمالي</span>
            <div>
              <span className="text-3xl font-extrabold text-white">
                {calculatedPrice.toLocaleString("ar-SA")}
              </span>
              <span className="text-blue-200 mr-1 text-sm">ريال</span>
            </div>
          </div>
        </div>
      )}

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
          طريقة الدفع
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: "cash", label: "نقد", icon: "💵" },
            { value: "network", label: "شبكة", icon: "💳" },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => setPaymentMethod(m.value)}
              className={`py-4 rounded-xl border-2 text-center text-sm font-semibold transition-all flex flex-col items-center justify-center gap-1 ${
                paymentMethod === m.value
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:border-blue-300"
              }`}
            >
              <span className="text-xl">{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm font-medium">❌ {error}</p>
        </div>
      )}

      {/* Confirm */}
      <button
        onClick={handleSubmit}
        disabled={loading || !durationMonths}
        className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
      >
        {loading ? (
          <>
            <Spinner />
            جاري التجديد...
          </>
        ) : (
          "تأكيد التجديد"
        )}
      </button>
    </div>
  );
}

function InfoBox({ label, value, highlight }) {
  return (
    <div className="bg-gray-50 rounded-xl px-4 py-3">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`font-semibold ${highlight ? "text-red-500" : "text-gray-800"}`}>
        {value}
      </p>
    </div>
  );
}
