import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../api/axios";

const SPORTS = [
  { id: "football", name: "كرة القدم", icon: "⚽" },
  { id: "swimming", name: "سباحة", icon: "🏊" },
  { id: "combat", name: "قتال", icon: "🥊" },
];

export default function AddSubMember() {
  const navigate = useNavigate();

  // Section 1: Find account
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [primaryMember, setPrimaryMember] = useState(null);
  const [accountError, setAccountError] = useState("");

  // Section 2: Add sub member steps
  const [step, setStep] = useState(0);
  const [memberType, setMemberType] = useState(""); // "sub_adult" or "sub_child"
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedMonths, setSelectedMonths] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const [memberData, setMemberData] = useState({
    fullName: "",
    gender: "",
    phone: "",
    dateOfBirth: "",
  });

  const [calculatedAge, setCalculatedAge] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Fetch sub member packages
  const { data: subAdultPackages = [] } = useQuery({
    queryKey: ["packages-sub-adult"],
    queryFn: async () => {
      const response = await axios.get(
        "/packages?category=sub_adult&isActive=true",
      );
      return response.data;
    },
  });

  const { data: subChildPackages = [] } = useQuery({
    queryKey: ["packages-sub-child"],
    queryFn: async () => {
      const response = await axios.get(
        "/packages?category=sub_child&isActive=true",
      );
      console.log("sub_child packages:", response.data);
      response.data.forEach((pkg) => {
        console.log(
          "sub_child package:",
          pkg.name,
          "pricePerMonth:",
          pkg.pricePerMonth,
        );
      });
      return response.data;
    },
  });

  // Handle search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    const searchFamily = async () => {
      try {
        const response = await axios.get(
          `/subscriptions/search?q=${encodeURIComponent(searchQuery)}`,
        );
        // Filter for family accounts only
        const familyResults = response.data.filter((sub) => {
          // We need to fetch account details to check type
          // For now, we'll get all and verify later
          return true;
        });
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search failed", err);
      }
    };

    const timer = setTimeout(searchFamily, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Calculate age from birthdate
  useEffect(() => {
    if (memberData.dateOfBirth) {
      const birthDate = new Date(memberData.dateOfBirth);
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
  }, [memberData.dateOfBirth]);

  // Handle account selection
  const handleSelectAccount = async (result) => {
    setAccountError("");
    setError("");
    try {
      const subDetails = await axios.get(
        `/subscriptions/${result.subscriptionId}`,
      );
      const subscription = subDetails.data;

      // Verify it's a family account
      if (subscription.accountId.type !== "family") {
        setAccountError("هذا الحساب ليس حساباً عائلياً");
        return;
      }

      setSelectedAccount(subscription.accountId._id);
      setPrimaryMember(subscription.memberId);
      setSearchQuery("");
      setShowSearchResults(false);
      setStep(1);
    } catch (err) {
      setAccountError("فشل تحميل بيانات الحساب");
    }
  };

  const handleMemberDataChange = (e) => {
    const { name, value } = e.target;
    setMemberData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculatePrice = () => {
    if (memberType === "sub_adult" && selectedPackage) {
      return selectedPackage.price;
    }
    if (memberType === "sub_child" && selectedPackage && selectedMonths) {
      const numMonths = parseInt(selectedMonths, 10);
      console.log(
        "calculatePrice - months:",
        selectedMonths,
        "parsed:",
        numMonths,
        "pricePerMonth:",
        selectedPackage.pricePerMonth,
      );
      let price;
      if (numMonths <= 5) {
        price = selectedPackage.pricePerMonth * numMonths;
      } else {
        // 6+ months gets 5-month price (discount)
        price = selectedPackage.pricePerMonth * 5;
      }
      console.log("calculatePrice result:", price);
      return price;
    }
    return 0;
  };

  const calculateSubEndDate = () => {
    const start = new Date(startDate);
    const end = new Date(start);

    if (memberType === "sub_adult" && selectedPackage) {
      end.setMonth(end.getMonth() + (selectedPackage.durationMonths || 3));
    } else if (memberType === "sub_child" && selectedMonths) {
      end.setMonth(end.getMonth() + parseInt(selectedMonths));
    }

    return end;
  };

  const subEndDate = calculateSubEndDate();
  const primaryEndDate = primaryMember?.subscription?.endDate
    ? new Date(primaryMember.subscription.endDate)
    : null;
  const exceedsEndDate = primaryEndDate && subEndDate > primaryEndDate;
  const currentPrice = calculatePrice();

  const handleSubmit = async () => {
    if (step === 1) {
      if (!memberType) {
        setError("يرجى اختيار نوع العضو الفرعي");
        return;
      }
      setError("");
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!selectedPackage) {
        setError("يرجى اختيار باقة");
        return;
      }
      if (memberType === "sub_child" && !selectedMonths) {
        setError("يرجى اختيار عدد الأشهر");
        return;
      }
      if (exceedsEndDate) {
        setError("تاريخ الانتهاء يتجاوز اشتراك الحساب الأساسي");
        return;
      }
      setError("");
      setStep(3);
      return;
    }

    if (step === 3) {
      if (!memberData.fullName) {
        setError("الاسم الكامل مطلوب");
        return;
      }
      if (!memberData.gender) {
        setError("النوع مطلوب");
        return;
      }
      if (memberType === "sub_child" && !memberData.dateOfBirth) {
        setError("تاريخ الميلاد مطلوب للأطفال");
        return;
      }
      if (memberType === "sub_child" && calculatedAge >= 15) {
        setError("باقة الأطفال للأعمار أقل من 15 سنة فقط");
        return;
      }
      if (memberType === "sub_adult" && !memberData.phone) {
        setError("رقم الهاتف مطلوب للبالغين");
        return;
      }
      setError("");
      setStep(4);
      return;
    }

    if (step === 4) {
      if (exceedsEndDate) {
        setError("تاريخ الانتهاء يتجاوز اشتراك الحساب الأساسي");
        return;
      }

      setLoading(true);
      setError("");
      try {
        const numMonths =
          memberType === "sub_child" ? parseInt(selectedMonths, 10) : null;
        const response = await axios.post("/subscriptions/add-sub-member", {
          accountId: selectedAccount,
          memberData,
          packageId: selectedPackage._id,
          months: numMonths,
          startDate,
          paymentMethod,
          calculatedPrice: currentPrice,
        });

        setSuccessData({
          memberName: response.data.member.fullName,
          packageName: selectedPackage.name,
          startDate: new Date(startDate).toLocaleDateString("ar-SA"),
          endDate: subEndDate.toLocaleDateString("ar-SA"),
          price: currentPrice,
          primaryName: primaryMember.fullName,
        });
        setSuccess(true);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "فشل إضافة العضو الفرعي، حاول مرة أخرى",
        );
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">
            ✓ تم إضافة العضو الفرعي بنجاح
          </h2>
          <p className="text-lg mb-2">
            الحساب الأساسي: {successData.primaryName}
          </p>
          <p className="text-lg mb-2">اسم العضو: {successData.memberName}</p>
          <p className="text-lg mb-2">الباقة: {successData.packageName}</p>
          <p className="text-lg mb-2">السعر: {successData.price} ريال</p>
          <p className="text-lg mb-4">
            من {successData.startDate} إلى {successData.endDate}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setStep(1);
                setMemberType("");
                setSelectedPackage(null);
                setMemberData({
                  fullName: "",
                  gender: "",
                  phone: "",
                  dateOfBirth: "",
                });
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
            >
              إضافة عضو آخر
            </button>
            <button
              onClick={() => navigate("/subscriptions/search")}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              عرض الاشتراكات
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Section 1: Search for family account
  if (!selectedAccount) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">إضافة عضو فرعي</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-right mb-4">
            1. البحث عن حساب عائلي
          </h2>

          <label className="block text-right font-semibold mb-2">
            ابحث باسم العضو الأساسي أو رقم الهاتف
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="أدخل الاسم أو رقم الهاتف"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right mb-4"
          />

          {accountError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              ⚠️ {accountError}
            </div>
          )}

          {showSearchResults && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((result) => (
                <button
                  key={result.subscriptionId}
                  onClick={() => handleSelectAccount(result)}
                  className="w-full p-3 text-right border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition"
                >
                  <div className="font-semibold">{result.memberName}</div>
                  <div className="text-sm text-gray-600">{result.phone}</div>
                  <div className="text-sm text-gray-500">
                    {result.packageName}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSearchResults &&
            searchResults.length === 0 &&
            searchQuery.length >= 2 && (
              <div className="text-center text-gray-500 py-4">
                لا توجد نتائج
              </div>
            )}
        </div>
      </div>
    );
  }

  // Section 2: Add Sub Member Steps
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-right mb-6">إضافة عضو فرعي</h1>

      {/* Account info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-right">
        <h3 className="font-bold text-lg mb-2">{primaryMember.fullName}</h3>
        <p className="text-sm text-gray-600">حساب عائلي</p>
        <div className="mt-2 text-sm">
          <p>
            انتهاء الاشتراك:{" "}
            <span className="font-bold text-green-700">
              {new Date(
                primaryMember.subscription?.endDate || new Date(),
              ).toLocaleDateString("ar-SA")}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          ⚠️ {error}
        </div>
      )}

      {/* Step 1: Member Type */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-right">
            اختر نوع العضو الفرعي
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMemberType("sub_adult")}
              className={`p-6 rounded-lg border-2 text-center transition ${
                memberType === "sub_adult"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-3xl mb-2">👨</div>
              <h3 className="font-bold mb-1">بالغ فرعي</h3>
              <p className="text-sm text-gray-600">15 سنة فأكثر</p>
              <p className="text-sm text-green-600 mt-1">سعر مخفض</p>
            </button>

            <button
              onClick={() => setMemberType("sub_child")}
              className={`p-6 rounded-lg border-2 text-center transition ${
                memberType === "sub_child"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-3xl mb-2">👦</div>
              <h3 className="font-bold mb-1">طفل أكاديمية</h3>
              <p className="text-sm text-gray-600">أقل من 15 سنة</p>
              <p className="text-sm text-blue-600 mt-1">رياضة محددة</p>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Package Selection */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-right">اختر الباقة</h2>

          {memberType === "sub_adult" && (
            <div className="grid grid-cols-3 gap-4">
              {subAdultPackages.map((pkg) => {
                const pkgMonths = pkg.durationMonths || 3;
                const testEndDate = new Date(startDate);
                testEndDate.setMonth(testEndDate.getMonth() + pkgMonths);
                const disabled = primaryEndDate && testEndDate > primaryEndDate;

                return (
                  <button
                    key={pkg._id}
                    onClick={() => !disabled && setSelectedPackage(pkg)}
                    disabled={disabled}
                    className={`p-4 rounded-lg border-2 text-center transition ${
                      disabled
                        ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        : selectedPackage?._id === pkg._id
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    <h3 className="font-bold">{pkg.name}</h3>
                    <p className="text-sm text-gray-600">{pkgMonths} شهور</p>
                    <p className="text-lg font-bold text-blue-600 mt-2">
                      {pkg.price} ريال
                    </p>
                    {disabled && (
                      <p className="text-xs text-red-600 mt-2">
                        يتجاوز تاريخ انتهاء الأساسي
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {memberType === "sub_child" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-right mb-4">اختر الرياضة</h3>
                <div className="grid grid-cols-3 gap-4">
                  {SPORTS.map((sport) => {
                    const pkg = subChildPackages.find(
                      (p) => p.sport === sport.id,
                    );
                    return (
                      <button
                        key={sport.id}
                        onClick={() => {
                          setSelectedSport(sport.id);
                          setSelectedPackage(pkg);
                        }}
                        className={`p-4 rounded-lg border-2 text-center transition ${
                          selectedSport === sport.id
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="text-3xl mb-2">{sport.icon}</div>
                        <div className="font-semibold text-sm">
                          {sport.name}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedPackage && (
                <div>
                  <h3 className="font-bold text-right mb-3">اختر عدد الأشهر</h3>
                  <div className="flex gap-2 flex-wrap justify-end">
                    {[1, 2, 3, 4, 5, 6].map((month) => {
                      const testEndDate = new Date(startDate);
                      testEndDate.setMonth(testEndDate.getMonth() + month);
                      const disabled =
                        primaryEndDate && testEndDate > primaryEndDate;

                      return (
                        <button
                          key={month}
                          onClick={() =>
                            !disabled && setSelectedMonths(month.toString())
                          }
                          disabled={disabled}
                          className={`px-4 py-2 rounded-lg border-2 transition ${
                            disabled
                              ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                              : selectedMonths === month.toString()
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300 hover:border-gray-400"
                          }`}
                        >
                          {month} شهور
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {selectedPackage && selectedMonths && (
                <div className="bg-blue-50 p-4 rounded-lg text-right">
                  <p className="text-sm text-gray-600 mb-1">السعر:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentPrice} ريال
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedPackage.pricePerMonth} × {selectedMonths}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Member Info */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-right mb-6">معلومات العضو</h2>

          <div>
            <label className="block text-right font-semibold mb-2">
              الاسم الكامل *
            </label>
            <input
              type="text"
              name="fullName"
              value={memberData.fullName}
              onChange={handleMemberDataChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
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
                  checked={memberData.gender === "female"}
                  onChange={handleMemberDataChange}
                />
                أنثى
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={memberData.gender === "male"}
                  onChange={handleMemberDataChange}
                />
                ذكر
              </label>
            </div>
          </div>

          {memberType === "sub_child" && (
            <div>
              <label className="block text-right font-semibold mb-2">
                تاريخ الميلاد *
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={memberData.dateOfBirth}
                onChange={handleMemberDataChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {calculatedAge !== null && (
                <div
                  className={`mt-2 text-right text-sm ${
                    calculatedAge >= 15 ? "text-red-600 font-bold" : ""
                  }`}
                >
                  {calculatedAge >= 15 && "⚠️ "}
                  العمر: {calculatedAge} سنة
                </div>
              )}
            </div>
          )}

          {memberType === "sub_adult" && (
            <div>
              <label className="block text-right font-semibold mb-2">
                رقم الهاتف *
              </label>
              <input
                type="tel"
                name="phone"
                value={memberData.phone}
                onChange={handleMemberDataChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
              />
            </div>
          )}

          {memberType === "sub_child" && (
            <div>
              <label className="block text-right font-semibold mb-2">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                name="phone"
                value={memberData.phone}
                onChange={handleMemberDataChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
              />
            </div>
          )}
        </div>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-right">مراجعة البيانات</h2>

          <div>
            <label className="block text-right font-semibold mb-2">
              تاريخ البداية
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-right font-semibold mb-3">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "cash", name: "نقد" },
                { id: "network", name: "شبكة" },
                { id: "tabby", name: "تابي" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-lg border-2 transition text-center ${
                    paymentMethod === method.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <span className="font-semibold">{method.name}</span>
                </button>
              ))}
            </div>
          </div>
          {exceedsEndDate && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              ⚠️ تاريخ الانتهاء ({subEndDate.toLocaleDateString("ar-SA")})
              يتجاوز اشتراك الحساب الأساسي (
              {primaryEndDate.toLocaleDateString("ar-SA")})
            </div>
          )}

          <div className="bg-gray-50 p-6 rounded-lg text-right space-y-3 border border-gray-200">
            <h3 className="font-bold text-lg mb-4">الملخص</h3>
            <div className="flex justify-between">
              <span>{memberData.fullName}</span>
              <span className="text-gray-600">الاسم:</span>
            </div>
            <div className="flex justify-between">
              <span>{selectedPackage.name}</span>
              <span className="text-gray-600">الباقة:</span>
            </div>
            <div className="flex justify-between">
              <span>{new Date(startDate).toLocaleDateString("ar-SA")}</span>
              <span className="text-gray-600">البداية:</span>
            </div>
            <div className="flex justify-between">
              <span>{subEndDate.toLocaleDateString("ar-SA")}</span>
              <span className="text-gray-600">النهاية:</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>{currentPrice} ريال</span>
              <span>الإجمالي:</span>
            </div>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-between gap-4 mt-6">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading || exceedsEndDate}
          className={`flex-1 px-6 py-2 rounded-lg text-white ${
            exceedsEndDate
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
          }`}
        >
          {loading
            ? "جاري المعالجة..."
            : step === 4
              ? "إضافة العضو الفرعي"
              : "التالي"}
        </button>
      </div>
    </div>
  );
}
