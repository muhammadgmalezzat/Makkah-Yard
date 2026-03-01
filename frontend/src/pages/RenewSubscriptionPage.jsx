import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

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
      setTimeout(() => {
        navigate("/subscriptions/search");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تجديد الاشتراك");
    } finally {
      setLoading(false);
    }
  };

  if (subLoading) {
    return <div className="text-center text-gray-500">جاري التحميل...</div>;
  }

  if (!subscription) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        الاشتراك غير موجود
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold">✓ تم تجديد الاشتراك بنجاح</h2>
          <p className="mt-2">جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">تجديد الاشتراك</h1>

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-bold text-blue-900 mb-4">
          معلومات الاشتراك الحالي
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-blue-700">الاسم</p>
            <p className="font-bold text-blue-900">
              {subscription.memberId.fullName}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">الحزمة الحالية</p>
            <p className="font-bold text-blue-900">
              {subscription.packageId.name}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">تاريخ البداية</p>
            <p className="font-bold text-blue-900">
              {new Date(subscription.startDate).toLocaleDateString("ar-SA")}
            </p>
          </div>
          <div>
            <p className="text-sm text-blue-700">تاريخ النهاية</p>
            <p className="font-bold text-blue-900">
              {new Date(subscription.endDate).toLocaleDateString("ar-SA")}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-md space-y-4"
      >
        <div>
          <label className="block text-sm font-medium mb-2">
            اختر حزمة جديدة
          </label>
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
        </div>

        {selectedPackage && (
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-700">
              تاريخ النهاية الجديد:{" "}
              <span className="font-bold">
                {calculateEndDate(startDate, selectedPackage.durationMonths)}
              </span>
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

        <div>
          <label className="block text-sm font-medium mb-2">طريقة الدفع</label>
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
            onClick={() => navigate(-1)}
            className="flex-1 bg-gray-400 text-white py-2 rounded-lg hover:bg-gray-500"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "جاري التجديد..." : "تجديد الاشتراك"}
          </button>
        </div>
      </form>
    </div>
  );
}
