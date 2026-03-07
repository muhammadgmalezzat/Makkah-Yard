import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

export default function NewAcademySubscription() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if coming from "Add Sport" with pre-filled child data
  const prefilledChildData = location.state?.childData;
  const childId = location.state?.childId;

  // Step 1: Child Type
  const [childType, setChildType] = useState("");
  const [parentAccount, setParentAccount] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Step 2: Child Info
  const [childData, setChildData] = useState(
    prefilledChildData || {
      fullName: "",
      gender: "",
      dateOfBirth: "",
      phone: "",
      guardianName: "",
      guardianPhone: "",
    },
  );
  const [calculatedAge, setCalculatedAge] = useState(null);

  // Step 3: Sport Selection
  const [selectedSport, setSelectedSport] = useState(null);

  // Step 4: Group Selection
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Step 5: Duration & Price
  const [durationMonths, setDurationMonths] = useState(1);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  // Step 6: Payment
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Flow control
  const [step, setStep] = useState(childId ? 2 : 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Fetch sports based on child gender
  const { data: sports = [] } = useQuery({
    queryKey: ["sports", childData.gender],
    queryFn: async () => {
      if (!childData.gender) return [];
      const response = await axios.get(
        `/academy/sports?gender=${childData.gender}`,
      );
      return response.data;
    },
    enabled: !!childData.gender,
  });

  // Fetch groups for selected sport
  const { data: groups = [] } = useQuery({
    queryKey: ["groups", selectedSport?._id],
    queryFn: async () => {
      if (!selectedSport) return [];
      const response = await axios.get(
        `/academy/groups?sportId=${selectedSport._id}`,
      );
      return response.data;
    },
    enabled: !!selectedSport,
  });

  // Fetch monthly academy package for selected sport
  const { data: monthlyPackage } = useQuery({
    queryKey: ["packages-academy-monthly", selectedSport?._id],
    queryFn: async () => {
      if (!selectedSport) return null;

      // Map Arabic sport names to English for API queries
      const sportMap = {
        "كرة القدم": "football",
        سباحة: "swimming",
        قتال: "combat",
      };

      const sportValue =
        sportMap[selectedSport.name] ||
        selectedSport.nameEn ||
        selectedSport.name;
      console.log("Selected sport:", selectedSport);
      console.log("Sport value for API:", sportValue);

      try {
        const monthlyRes = await axios.get("/packages", {
          params: {
            category: "academy_only",
            sport: sportValue,
            isFlexibleDuration: "true",
            isActive: "true",
          },
        });
        console.log("Monthly packages response:", monthlyRes.data);
        const monthlyPkg =
          monthlyRes.data && monthlyRes.data[0] ? monthlyRes.data[0] : null;
        console.log("monthly package:", monthlyPkg);
        return monthlyPkg || null;
      } catch (error) {
        console.error("Error fetching monthly package:", error);
        return null;
      }
    },
    enabled: !!selectedSport,
  });

  // Fetch annual academy package for selected sport
  const { data: annualPackage } = useQuery({
    queryKey: ["packages-academy-annual", selectedSport?._id],
    queryFn: async () => {
      if (!selectedSport) return null;

      // Map Arabic sport names to English for API queries
      const sportMap = {
        "كرة القدم": "football",
        سباحة: "swimming",
        قتال: "combat",
      };

      const sportValue =
        sportMap[selectedSport.name] ||
        selectedSport.nameEn ||
        selectedSport.name;

      try {
        const annualRes = await axios.get("/packages", {
          params: {
            category: "academy_only",
            sport: sportValue,
            isFlexibleDuration: "false",
            isActive: "true",
          },
        });
        console.log("Annual packages response:", annualRes.data);
        const annualPkg =
          annualRes.data && annualRes.data[0] ? annualRes.data[0] : null;
        console.log("annual package:", annualPkg);
        return annualPkg || null;
      } catch (error) {
        console.error("Error fetching annual package:", error);
        return null;
      }
    },
    enabled: !!selectedSport,
  });

  // Calculate price based on months and packages
  const calculatePrice = (months, monthlyPkg, annualPkg) => {
    if (!monthlyPkg) return 0;
    if (months === 12) return annualPkg?.price || monthlyPkg.pricePerMonth * 12;
    if (months === 6) return monthlyPkg.pricePerMonth * 5;
    return monthlyPkg.pricePerMonth * months;
  };

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

  // Calculate price based on duration and academy package
  useEffect(() => {
    const price = calculatePrice(durationMonths, monthlyPackage, annualPackage);
    setCalculatedPrice(price);
  }, [durationMonths, monthlyPackage, annualPackage]);

  // Check if package was found for selected sport
  useEffect(() => {
    if (selectedSport && !monthlyPackage) {
      console.error(
        "No monthly package found for sport:",
        selectedSport.nameEn,
      );
      setError("لا توجد باقة لهذه الرياضة، يرجى التواصل مع الإدارة");
    } else if (selectedSport) {
      // Clear error if package is found
      setError("");
    }
  }, [selectedSport, monthlyPackage]);

  // Handle search for parent account
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
        setSearchResults(response.data);
        setShowSearchResults(true);
      } catch (err) {
        console.error("Search error:", err);
      }
    };

    const timer = setTimeout(searchFamily, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChildDataChange = (e) => {
    const { name, value } = e.target;
    setChildData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectParentAccount = (account) => {
    setParentAccount(account);
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSubmit = async () => {
    console.log("=== SUBMIT DATA ===");
    console.log("childData:", childData);
    console.log("selectedSport:", selectedSport);
    console.log("selectedGroup:", selectedGroup);
    console.log("durationMonths:", durationMonths);
    console.log("startDate:", startDate);
    console.log("paymentMethod:", paymentMethod);
    console.log("calculatedPrice:", calculatedPrice);
    console.log("===================");

    if (step === 0) {
      if (!childType) {
        setError("اختر نوع الاشتراك");
        return;
      }
      if (childType === "linked" && !parentAccount) {
        setError("اختر حساب ولي الأمر");
        return;
      }
      setError("");
      setStep(2);
    }

    if (step === 2) {
      // If adding sport to existing child, skip child data validation and go to sport selection
      if (childId) {
        setError("");
        setStep(3);
        return;
      }

      if (!childData.fullName || !childData.gender || !childData.dateOfBirth) {
        setError("الاسم والنوع وتاريخ الميلاد مطلوبة");
        return;
      }
      if (calculatedAge >= 15) {
        setError("الأكاديمية للأطفال أقل من 15 سنة فقط");
        return;
      }
      setError("");
      setStep(3);
    }

    if (step === 3) {
      if (!selectedSport) {
        setError("اختر الرياضة");
        return;
      }
      setError("");
      setStep(4);
    }

    if (step === 4) {
      if (!selectedGroup) {
        setError("اختر المجموعة");
        return;
      }
      setError("");
      setStep(5);
    }

    if (step === 5) {
      if (!durationMonths || !startDate) {
        setError("حدد المدة وتاريخ البداية");
        return;
      }
      setError("");
      setStep(6);
    }

    if (step === 6) {
      // Validate price before submission
      if (!calculatedPrice || calculatedPrice <= 0 || isNaN(calculatedPrice)) {
        setError("السعر غير صحيح - يرجى إعادة اختيار الرياضة والمدة");
        return;
      }

      setLoading(true);
      setError("");
      try {
        // If adding sport to existing child, use different endpoint
        if (childId) {
          const response = await axios.post(
            `/academy/members/${childId}/add-sport`,
            {
              sportId: selectedSport._id,
              groupId: selectedGroup._id,
              durationMonths: parseInt(durationMonths),
              startDate,
              paymentData: {
                method: paymentMethod,
                amount: calculatedPrice,
                paidAt: new Date(),
              },
              memberType: prefilledChildData?.memberType || "standalone",
              parentSubscriptionId:
                prefilledChildData?.parentSubscriptionId || null,
            },
          );

          setSuccessData({
            childName: response.data.subscription.memberId,
            sportName: selectedSport.name,
            groupName: selectedGroup.name,
            startDate: new Date(startDate).toLocaleDateString("ar-SA"),
            endDate: new Date(
              new Date(startDate).setMonth(
                new Date(startDate).getMonth() + durationMonths,
              ),
            ).toLocaleDateString("ar-SA"),
            price: calculatedPrice,
          });
        } else {
          const payload = {
            childData: {
              fullName: childData.fullName,
              gender: childData.gender,
              dateOfBirth: childData.dateOfBirth,
              phone: childData.phone?.trim() || null,
              guardianName: childData.guardianName?.trim() || null,
              guardianPhone: childData.guardianPhone?.trim() || null,
            },
            sportId: selectedSport._id,
            groupId: selectedGroup._id,
            memberType: childType || "standalone",
            parentSubscriptionId:
              childType === "linked" ? parentAccount?.subscriptionId : null,
            durationMonths: parseInt(durationMonths),
            startDate: startDate,
            paymentData: {
              amount: calculatedPrice,
              method: paymentMethod || "cash",
            },
          };

          console.log("PAYLOAD:", JSON.stringify(payload, null, 2));

          const response = await axios.post("/academy/subscriptions", payload);

          // Extract properly structured response
          const { member, subscription, sport, group } = response.data.data;

          setSuccessData({
            childName: member.fullName,
            sportName: sport.name,
            groupName: group.name,
            startDate: new Date(subscription.startDate).toLocaleDateString(
              "ar-SA",
            ),
            endDate: new Date(subscription.endDate).toLocaleDateString("ar-SA"),
            price: subscription.pricePaid,
          });
        }
        setSuccess(true);
      } catch (err) {
        console.error(
          "Subscription creation error:",
          err.response?.data || err.message,
        );
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "فشل إنشاء الاشتراك، حاول مرة أخرى";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-8 rounded-lg text-center">
          <h2 className="text-2xl font-bold mb-4">✓ تم إنشاء الاشتراك بنجاح</h2>
          <div className="text-right space-y-2 mb-6">
            <p>
              <strong>الطفل:</strong> {successData.childName}
            </p>
            <p>
              <strong>الرياضة:</strong> {successData.sportName}
            </p>
            <p>
              <strong>المجموعة:</strong> {successData.groupName}
            </p>
            <p>
              <strong>من:</strong> {successData.startDate}
            </p>
            <p>
              <strong>إلى:</strong> {successData.endDate}
            </p>
            <p>
              <strong>السعر:</strong> {successData.price} ريال
            </p>
          </div>
          <button
            onClick={() => navigate("/academy/sports")}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            العودة للأكاديمية
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Child Type
  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">
          تسجيل اشتراك أكاديمية جديد
        </h1>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-right">اختر نوع الاشتراك</h2>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setChildType("linked")}
              className={`p-6 rounded-lg border-2 text-center transition ${
                childType === "linked"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-3xl mb-2">👨‍👩‍👧</div>
              <h3 className="font-bold mb-1">ابن مشترك (أ.م)</h3>
              <p className="text-sm text-gray-600">تابع لعضو أسرة موجود</p>
            </button>

            <button
              onClick={() => setChildType("standalone")}
              className={`p-6 rounded-lg border-2 text-center transition ${
                childType === "standalone"
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <div className="text-3xl mb-2">👦</div>
              <h3 className="font-bold mb-1">غير مرتبط (أ.غ.م)</h3>
              <p className="text-sm text-gray-600">اشتراك مستقل للطفل</p>
            </button>
          </div>

          {/* Search for parent account */}
          {childType === "linked" && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold text-right mb-3">
                ابحث عن حساب ولي الأمر
              </h3>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
                placeholder="ابحث باسم أو رقم الهاتف"
              />

              {showSearchResults && (
                <div className="mt-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      لا توجد نتائج
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <button
                        key={result.subscriptionId}
                        onClick={() => handleSelectParentAccount(result)}
                        className="w-full text-right p-3 border-b hover:bg-blue-50 transition"
                      >
                        <p className="font-semibold">{result.memberName}</p>
                        <p className="text-sm text-gray-600">{result.phone}</p>
                        <p className="text-sm text-blue-600">
                          {result.packageName}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {parentAccount && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-right">
                  <p className="font-semibold">{parentAccount.memberName}</p>
                  <p className="text-sm text-gray-600">{parentAccount.phone}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            إلغاء
          </button>
          <button
            onClick={handleSubmit}
            disabled={!childType || (childType === "linked" && !parentAccount)}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  // Step 2: Child Info
  if (step === 2) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">معلومات الطفل</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
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

          <div>
            <label className="block text-right font-semibold mb-2">
              رقم الهاتف (اختياري)
            </label>
            <input
              type="tel"
              name="phone"
              value={childData.phone}
              onChange={handleChildDataChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
            />
          </div>

          <div>
            <label className="block text-right font-semibold mb-2">
              رقم هاتف ولي الأمر (اختياري)
            </label>
            <input
              type="tel"
              name="guardianPhone"
              value={childData.guardianPhone}
              onChange={handleChildDataChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-right"
            />
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(1)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !childData.fullName ||
              !childData.gender ||
              !childData.dateOfBirth ||
              calculatedAge >= 15
            }
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Sport Selection
  if (step === 3) {
    const sportsByCategory = {
      male: sports.filter((s) => s.gender === "male"),
      female: sports.filter((s) => s.gender === "female"),
      both: sports.filter((s) => s.gender === "both"),
    };

    const categories =
      childData.gender === "male" ? ["male", "both"] : ["female", "both"];

    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">اختر الرياضة</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {categories.map((cat) => (
          <div key={cat} className="mb-8">
            <h2 className="text-xl font-bold text-right mb-4">
              {cat === "male"
                ? "رياضات البنين"
                : cat === "female"
                  ? "رياضات البنات"
                  : "رياضات مشتركة"}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {sportsByCategory[cat].map((sport) => (
                <button
                  key={sport._id}
                  onClick={() => setSelectedSport(sport)}
                  className={`p-4 rounded-lg border-2 transition text-right ${
                    selectedSport?._id === sport._id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <h3 className="font-bold mb-1">{sport.name}</h3>
                  <p className="text-sm text-gray-600">
                    العمر: {sport.minAge}-{sport.maxAge}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(2)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedSport}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  // Step 4: Group Selection
  if (step === 4) {
    return (
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-2">اختر المجموعة</h1>
        <p className="text-right text-gray-600 mb-6">{selectedSport?.name}</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <button
              key={group._id}
              onClick={() => setSelectedGroup(group)}
              disabled={group.isFull}
              className={`p-4 rounded-lg border-2 transition text-right ${
                selectedGroup?._id === group._id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              } ${group.isFull ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <h3 className="font-bold mb-2">{group.name}</h3>
              {group.schedule && (
                <p className="text-sm text-gray-600 mb-2">
                  📅 {group.schedule}
                </p>
              )}
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {group.currentCount} / {group.maxCapacity}
                </span>
                <span className="text-sm font-semibold">السعة</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    group.isFull
                      ? "bg-red-500"
                      : (group.currentCount / group.maxCapacity) * 100 >= 80
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (group.currentCount / group.maxCapacity) * 100,
                      100,
                    )}%`,
                  }}
                ></div>
              </div>
              {group.isFull && (
                <p className="text-sm text-red-600 font-semibold mt-2">
                  ممتلئة
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(3)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedGroup || selectedGroup.isFull}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  // Step 5: Duration & Price
  if (step === 5) {
    const parentEndDate = parentAccount
      ? new Date(parentAccount.endDate)
      : null;
    const selectedEndDate = new Date(startDate);
    selectedEndDate.setMonth(selectedEndDate.getMonth() + durationMonths);
    const exceedsParent =
      childType === "linked" &&
      parentEndDate &&
      selectedEndDate > parentEndDate;

    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">المدة والسعر</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-right font-semibold mb-3">
              اختر عدد الأشهر
            </label>
            <div className="flex gap-2 flex-wrap justify-end">
              {[1, 2, 3, 4, 5, 6].map((month) => (
                <button
                  key={month}
                  onClick={() => setDurationMonths(month)}
                  className={`px-4 py-2 rounded border-2 transition ${
                    durationMonths === month
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {month}
                </button>
              ))}
              <button
                onClick={() => setDurationMonths(12)}
                className={`px-4 py-2 rounded border-2 transition ${
                  durationMonths === 12
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                سنة
              </button>
            </div>
          </div>

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

          {childType === "linked" && parentEndDate && (
            <div
              className={`p-3 rounded-lg text-right ${
                exceedsParent
                  ? "bg-red-100 border border-red-400 text-red-700"
                  : "bg-blue-100 border border-blue-400 text-blue-700"
              }`}
            >
              {exceedsParent ? (
                <p>⚠️ تاريخ الانتهاء يتجاوز اشتراك ولي الأمر</p>
              ) : (
                <p>✓ تاريخ الانتهاء ضمن فترة ولي الأمر</p>
              )}
              <p className="text-sm mt-1">
                انتهاء اشتراك ولي الأمر:{" "}
                {parentEndDate.toLocaleDateString("ar-SA")}
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg text-right border border-blue-200">
            <p className="text-sm text-gray-600 mb-1">السعر:</p>
            <p className="text-3xl font-bold text-blue-600">
              {calculatedPrice} ريال
            </p>
            {durationMonths === 6 && (
              <p className="text-sm text-green-600 mt-2">
                ✓ ٦ أشهر بسعر ٥ أشهر = {calculatedPrice} ريال
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(4)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
          <button
            onClick={handleSubmit}
            disabled={exceedsParent}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            التالي
          </button>
        </div>
      </div>
    );
  }

  // Step 6: Payment & Summary
  if (step === 6) {
    return (
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-right mb-6">الدفع والملخص</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700 text-sm font-medium">❌ {error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-right font-semibold mb-3">
              طريقة الدفع
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: "cash", name: "نقد" },
                { id: "network", name: "شبكة" },
                { id: "tabby", name: "تابي" },
                { id: "tamara", name: "تمارا" },
                { id: "transfer", name: "تحويل" },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-2 rounded border-2 transition text-center text-sm ${
                    paymentMethod === method.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {method.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg text-right space-y-3 border border-gray-200">
            <h3 className="font-bold text-lg mb-4">الملخص</h3>
            <div className="flex justify-between">
              <span>{childData.fullName}</span>
              <span className="text-gray-600">الاسم:</span>
            </div>
            <div className="flex justify-between">
              <span>{selectedSport.name}</span>
              <span className="text-gray-600">الرياضة:</span>
            </div>
            <div className="flex justify-between">
              <span>{selectedGroup.name}</span>
              <span className="text-gray-600">المجموعة:</span>
            </div>
            <div className="flex justify-between">
              <span>{durationMonths} شهر</span>
              <span className="text-gray-600">المدة:</span>
            </div>
            <div className="flex justify-between">
              <span>{new Date(startDate).toLocaleDateString("ar-SA")}</span>
              <span className="text-gray-600">البداية:</span>
            </div>
            <div className="flex justify-between">
              <span>
                {new Date(
                  new Date(startDate).setMonth(
                    new Date(startDate).getMonth() + durationMonths,
                  ),
                ).toLocaleDateString("ar-SA")}
              </span>
              <span className="text-gray-600">النهاية:</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>{calculatedPrice} ريال</span>
              <span>الإجمالي:</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4 mt-8">
          <button
            onClick={() => setStep(5)}
            className="flex-1 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            السابق
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "جاري المعالجة..." : "تأكيد الاشتراك"}
          </button>
        </div>
      </div>
    );
  }
}
