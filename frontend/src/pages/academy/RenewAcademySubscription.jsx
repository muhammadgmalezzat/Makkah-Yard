import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6, 12];

export default function RenewAcademySubscription() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();

  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Fetch subscription details
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["academy-sub", subscriptionId],
    queryFn: async () => {
      const res = await axios.get(`/academy/subscriptions/${subscriptionId}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (subscription?.endDate) {
      setStartDate(
        new Date(subscription.endDate).toISOString().split("T")[0],
      );
    }
  }, [subscription?.endDate]);

  // Fetch monthly package for this sport
  const { data: monthlyPackage, isLoading: pkgLoading } = useQuery({
    queryKey: ["academy-monthly-pkg", subscription?.sportId?.nameEn],
    queryFn: async () => {
      const sportNameEn = subscription?.sportId?.nameEn;
      if (!sportNameEn) return null;
      const res = await axios.get("/packages", {
        params: {
          category: "academy_only",
          sport: sportNameEn,
          isFlexibleDuration: "true",
          isActive: "true",
        },
      });
      return res.data?.[0] || null;
    },
    enabled: !!subscription?.sportId?.nameEn,
  });

  const pricePerMonth = monthlyPackage?.pricePerMonth || 0;

  const calculatePrice = (months) => {
    if (months === 12) return pricePerMonth * 10;
    if (months === 6) return pricePerMonth * 5;
    return pricePerMonth * months;
  };

  const calculatedPrice = calculatePrice(selectedMonths);

  const newEndDate = useMemo(() => {
    if (!startDate) return null;
    const d = new Date(startDate); // ← من startDate مش من endDate
    d.setMonth(d.getMonth() + selectedMonths);
    return d;
  }, [startDate, selectedMonths]);

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const map = {
      active: { text: "نشط", cls: "bg-green-100 text-green-700" },
      expired: { text: "منتهي", cls: "bg-red-100 text-red-700" },
      cancelled: { text: "ملغى", cls: "bg-gray-100 text-gray-700" },
    };
    const cfg = map[status] || map.expired;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
        {cfg.text}
      </span>
    );
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      await axios.post(`/academy/subscriptions/${subscriptionId}/renew`, {
        months: selectedMonths,
        amount: calculatedPrice,
        paymentMethod,
         startDate,
      });
      navigate(-1);
    } catch (err) {
      setError(err.response?.data?.message || "حدث خطأ أثناء التجديد");
    } finally {
      setLoading(false);
    }
  };

  if (subLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center m-6" dir="rtl">
        <p className="text-red-700 font-semibold">لم يتم العثور على الاشتراك</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6" dir="rtl">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2 text-sm"
      >
        ← العودة
      </button>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">
        تجديد اشتراك أكاديمية
      </h1>

      {/* Current subscription info card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-2">
          معلومات الاشتراك الحالي
        </h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">اسم الطفل</p>
            <p className="font-semibold text-gray-900">
              {subscription.memberId?.fullName || "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">الرياضة</p>
            <p className="font-semibold text-gray-900">
              {subscription.sportId?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">المجموعة</p>
            <p className="font-semibold text-gray-900">
              {subscription.groupId?.name || "-"}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">الحالة</p>
            {getStatusBadge(subscription.status)}
          </div>
          <div className="col-span-2">
            <p className="text-gray-500 text-xs mb-1">تاريخ الانتهاء الحالي</p>
            <p className="font-semibold text-gray-900">
              {formatDate(subscription.endDate)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-bold text-gray-900 mb-3">تاريخ البداية</h3>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Duration selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-700 mb-4">
          اختر مدة التجديد
        </h2>
        {pkgLoading ? (
          <p className="text-gray-500 text-sm">جاري تحميل الأسعار...</p>
        ) : !monthlyPackage ? (
          <p className="text-amber-600 text-sm bg-amber-50 border border-amber-200 rounded-lg p-3">
            ⚠️ لم يتم العثور على باقة شهرية لهذه الرياضة
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {DURATION_OPTIONS.map((months) => {
              const price = calculatePrice(months);
              const isSelected = selectedMonths === months;
              const hasDiscount = months === 6 || months === 12;
              return (
                <button
                  key={months}
                  onClick={() => setSelectedMonths(months)}
                  className={`relative p-3 rounded-xl border-2 text-center transition ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-green-300"
                  }`}
                >
                  {hasDiscount && (
                    <span className="absolute -top-2 right-1 bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      خصم
                    </span>
                  )}
                  <p
                    className={`text-sm font-bold ${isSelected ? "text-green-700" : "text-gray-900"}`}
                  >
                    {months === 12 ? "سنة" : `${months} شهر`}
                  </p>
                  <p
                    className={`text-xs mt-1 font-semibold ${isSelected ? "text-green-600" : "text-gray-600"}`}
                  >
                    {price} ر.س
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* New end date display */}
      {newEndDate && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <p className="text-blue-600 text-xs mb-1">تاريخ الانتهاء الجديد</p>
          <p className="text-blue-900 font-bold text-base">
            {formatDate(newEndDate)}
          </p>
        </div>
      )}

      {/* Price summary card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-b border-gray-100 pb-2">
          ملخص التجديد
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">المدة</span>
            <span className="font-semibold text-gray-900">
              {selectedMonths === 12
                ? "سنة (12 شهر)"
                : `${selectedMonths} ${selectedMonths === 1 ? "شهر" : "أشهر"}`}
            </span>
          </div>
          {(selectedMonths === 6 || selectedMonths === 12) && (
            <div className="flex justify-between text-orange-600">
              <span>خصم مطبق</span>
              <span className="font-semibold">
                {selectedMonths === 6
                  ? `توفير ${pricePerMonth} ر.س (شهر مجاني)`
                  : `توفير ${pricePerMonth * 2} ر.س (شهران مجانيان)`}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">السعر</span>
            <span className="font-bold text-green-700 text-base">
              {calculatedPrice} ر.س
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">تاريخ الانتهاء الجديد</span>
            <span className="font-semibold text-gray-900">
              {formatDate(newEndDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment method selector */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-base font-bold text-gray-700 mb-4">طريقة الدفع</h2>
        <div className="flex gap-3">
          {[
            { value: "cash", label: "نقد" },
            { value: "network", label: "شبكة" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPaymentMethod(opt.value)}
              className={`flex-1 py-3 rounded-xl border-2 font-semibold text-sm transition ${
                paymentMethod === opt.value
                  ? "border-green-500 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-700 hover:border-green-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={handleSubmit}
        disabled={loading || !monthlyPackage || calculatedPrice === 0}
        className="w-full py-4 bg-green-600 text-white font-bold text-base rounded-xl hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "جاري التجديد..." : `تأكيد التجديد — ${calculatedPrice} ر.س`}
      </button>
    </div>
  );
}
