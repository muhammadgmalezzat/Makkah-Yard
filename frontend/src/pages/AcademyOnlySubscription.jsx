import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";

const SPORTS = [
  { id: "football", name: "كرة القدم", icon: "⚽" },
  { id: "swimming", name: "سباحة", icon: "🏊" },
  { id: "combat", name: "قتال", icon: "🥊" },
];

const VALID_MONTHS = [1, 2, 3, 4, 5, 6, 12];

export default function AcademyOnlySubscription() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedMonths, setSelectedMonths] = useState("");
  const [prices, setPrices] = useState({});

  const [childData, setChildData] = useState({
    fullName: "",
    gender: "",
    dateOfBirth: "",
    phone: "",
    guardianName: "",
    guardianPhone: "",
  });

  const [calculatedAge, setCalculatedAge] = useState(null);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Fetch prices
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await axios.get(
          "/packages?category=academy_only&isActive=true",
        );
        const priceMap = {};
        response.data.forEach((pkg) => {
          if (pkg.sport && pkg.isFlexibleDuration) {
            priceMap[`${pkg.sport}_month`] = pkg.pricePerMonth;
          }
          if (pkg.sport && !pkg.isFlexibleDuration && pkg.durationMonths === 12) {
            priceMap[`${pkg.sport}_annual`] = pkg.price;
          }
        });
        setPrices(priceMap);
      } catch (err) {
        console.error("Failed to fetch prices", err);
      }
    };
    fetchPrices();
  }, []);

  // Calculate age from birthdate
  useEffect(() => {
    if (childData.dateOfBirth) {
      const birthDate = new Date(childData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      setCalculatedAge(age);
    } else {
      setCalculatedAge(null);
    }
  }, [childData.dateOfBirth]);

  // Calculate end date
  useEffect(() => {
    if (startDate && selectedMonths) {
      const start = new Date(startDate);
      const end = new Date(start);
      end.setMonth(end.getMonth() + parseInt(selectedMonths));
      setEndDate(end.toISOString().split("T")[0]);
    }
  }, [startDate, selectedMonths]);

  const calculatePrice = () => {
    if (!selectedSport || !selectedMonths) return 0;

    const pricePerMonth = prices[`${selectedSport}_month`];
    if (!pricePerMonth) return 0;

    const months = parseInt(selectedMonths);
    if (months <= 5) {
      return pricePerMonth * months;
    } else if (months === 6) {
      return pricePerMonth * 5;
    } else if (months === 12) {
      return prices[`${selectedSport}_annual`] || pricePerMonth * 12;
    }
    return 0;
  };

  const currentPrice = calculatePrice();

  const handleChildDataChange = (e) => {
    const { name, value } = e.target;
    setChildData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    if (step === 1) {
      if (!selectedSport || !selectedMonths) {
        setError("يرجى اختيار الرياضة والمدة");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!childData.fullName) {
        setError("الاسم الكامل مطلوب");
        return;
      }
      if (!childData.gender) {
        setError("النوع مطلوب");
        return;
      }
      if (!childData.dateOfBirth) {
        setError("تاريخ الميلاد مطلوب");
        return;
      }
      if (calculatedAge >= 15) {
        setError("الأكاديمية للأطفال أقل من 15 سنة فقط");
        return;
      }
      setError("");
      setStep(3);
      return;
    }

    if (step === 3) {
      setLoading(true);
      setError("");
      try {
        const response = await axios.post("/subscriptions/academy-only", {
          childData: {
            fullName: childData.fullName,
            gender: childData.gender,
            dateOfBirth: childData.dateOfBirth,
            phone: childData.phone || null,
            guardianName: childData.guardianName || null,
            guardianPhone: childData.guardianPhone || null,
          },
          sport: selectedSport,
          months: parseInt(selectedMonths),
          startDate,
          paymentMethod,
          paymentDate: new Date().toISOString(),
        });

        setSuccessData({
          childName: response.data.child.fullName,
          sport: selectedSport,
          months: selectedMonths,
          price: currentPrice,
          startDate: new Date(startDate).toLocaleDateString("ar-SA"),
          endDate: new Date(endDate).toLocaleDateString("ar-SA"),
        });
        setSuccess(true);
      } catch (err) {
        setError(
          err.response?.data?.message || "فشل إنشاء الاشتراك، حاول مرة أخرى",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">✓ تم التسجيل بنجاح</h2>
          <p className="text-lg mb-2">اسم الطفل: {successData.childName}</p>
          <p className="text-lg mb-2">الرياضة: {successData.sport}</p>
          <p className="text-lg mb-2">المدة: {successData.months} شهور</p>
          <p className="text-lg mb-2">السعر: {successData.price} ريال</p>
          <p className="text-lg mb-2">
            من {successData.startDate} إلى {successData.endDate}
          </p>
          <button
            onClick={() => navigate("/subscriptions/search")}
            className="mt-6 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            عرض الاشتراكات
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold text-right mb-6">أكاديمية جديدة</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Sport & Duration */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-right mb-4">1. اختر الرياضة</h2>
            <div className="grid grid-cols-3 gap-4">
              {SPORTS.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`p-4 rounded-lg border-2 text-center transition ${
                    selectedSport === sport.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <div className="text-4xl mb-2">{sport.icon}</div>
                  <div className="font-semibold">{sport.name}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-right mb-4">2. اختر المدة</h2>
            <div className="flex gap-2 flex-wrap justify-end">
              {VALID_MONTHS.map((month) => (
                <button
                  key={month}
                  onClick={() => setSelectedMonths(month.toString())}
                  className={`px-4 py-2 rounded-lg border-2 transition ${
                    selectedMonths === month.toString()
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {month === 12 ? "سنة" : `${month} شهر`}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-right">
            <h3 className="font-bold mb-2">السعر:</h3>
            {selectedSport && selectedMonths ? (
              <div>
                <p className="text-2xl text-blue-600 font-bold">
                  {currentPrice} ريال
                </p>
                {selectedMonths === "6" && (
                  <p className="text-sm text-gray-600 mt-2">
                    ✓ 6 شهور بسعر 5 شهور
                  </p>
                )}
                {selectedMonths === "12" && (
                  <p className="text-sm text-gray-600 mt-2">
                    ✓ سنة كاملة
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">اختر الرياضة والمدة لمعرفة السعر</p>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Child Info */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="block text-right font-semibold mb-2">
              الاسم الكامل *
            </label>
            <input
              type="text"
              name="fullName"
              value={childData.fullName}
              onChange={handleChildDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
              placeholder="أدخل الاسم الكامل"
            />
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              النوع *
            </label>
            <div className="flex gap-4 justify-end">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={childData.gender === "female"}
                  onChange={handleChildDataChange}
                />
                أنثى
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={childData.gender === "male"}
                  onChange={handleChildDataChange}
                />
                ذكر
              </label>
            </div>
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              تاريخ الميلاد *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={childData.dateOfBirth}
              onChange={handleChildDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {calculatedAge !== null && (
              <div
                className={`mt-2 text-right ${
                  calculatedAge >= 15 ? "text-red-600 font-bold" : ""
                }`}
              >
                {calculatedAge >= 15 && "⚠️ "}
                العمر: {calculatedAge} سنة
              </div>
            )}
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              الهاتف (اختياري)
            </label>
            <input
              type="tel"
              name="phone"
              value={childData.phone}
              onChange={handleChildDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              اسم ولي الأمر (اختياري)
            </label>
            <input
              type="text"
              name="guardianName"
              value={childData.guardianName}
              onChange={handleChildDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              هاتف ولي الأمر (اختياري)
            </label>
            <input
              type="tel"
              name="guardianPhone"
              value={childData.guardianPhone}
              onChange={handleChildDataChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
            />
          </div>
        </div>
      )}

      {/* Step 3: Payment & Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="block text-right font-semibold mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg text-right">
            <p className="font-semibold">
              تاريخ النهاية: {new Date(endDate).toLocaleDateString("ar-SA")}
            </p>
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              طريقة الدفع
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-right"
            >
              <option value="cash">نقد</option>
              <option value="network">تحويل</option>
              <option value="tabby">تقسيط</option>
            </select>
          </div>

          <div className="bg-gray-100 p-4 rounded-lg text-right space-y-2">
            <h3 className="font-bold text-lg mb-3">الملخص</h3>
            <div className="flex justify-between">
              <span>{childData.fullName}</span>
              <span>الطفل:</span>
            </div>
            <div className="flex justify-between">
              <span>
                {SPORTS.find((s) => s.id === selectedSport)?.name}
              </span>
              <span>الرياضة:</span>
            </div>
            <div className="flex justify-between">
              <span>{selectedMonths === "12" ? "سنة" : `${selectedMonths} شهور`}</span>
              <span>المدة:</span>
            </div>
            <div className="border-t my-2 pt-2 flex justify-between font-bold text-lg">
              <span>{currentPrice} ريال</span>
              <span>الإجمالي:</span>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6 gap-4">
        <button
          onClick={() => setStep(step - 1)}
          disabled={step === 1}
          className="px-6 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-100"
        >
          السابق
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "جاري المعالجة..."
            : step === 3
              ? "تسجيل الاشتراك"
              : "التالي"}
        </button>
      </div>
    </div>
  );
}
