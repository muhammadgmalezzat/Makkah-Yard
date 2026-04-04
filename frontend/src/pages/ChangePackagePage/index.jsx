import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "../../api/axios";

// ─── helpers ────────────────────────────────────────────────────────────────

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function fmt(date) {
  return new Date(date).toLocaleDateString("ar-SA");
}

// ─── static config ──────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { key: "individual", label: "فردي", category: "individual" },
  { key: "friends", label: "أصدقاء", category: "friends" },
  { key: "family", label: "عائلي", category: "family_essential" },
];

const ACCOUNT_TYPE_LABEL = {
  individual: "فردي",
  friends: "أصدقاء",
  family: "عائلي",
  academy_only: "أكاديمية فقط",
};

const ROLE_LABEL = {
  partner: "شريك",
  sub_adult: "فرعي بالغ",
  child: "طفل",
};

const WARNING = {
  "family→individual":
    "⚠️ سيتم إلغاء ربط الشريك والأعضاء الفرعيين والأطفال بهذا الحساب. ستبقى بياناتهم محفوظة ويمكن الوصول إليها لأغراض التسويق.",
  "family→friends":
    "⚠️ سيتم إلغاء ربط الشريك الحالي والأعضاء الفرعيين والأطفال. سيتم إضافة شريك جديد للحساب.",
  "friends→individual": "⚠️ سيتم إلغاء ربط الشريك الحالي من الحساب.",
  "friends→family": "⚠️ سيتم إلغاء ربط الشريك الحالي وإضافة شريك جديد.",
  "individual→family": "سيتم إضافة شريك جديد للحساب.",
  "individual→friends": "سيتم إضافة شريك جديد للحساب.",
};

const ARCHIVE_SCENARIOS = [
  "family→individual",
  "family→friends",
  "friends→individual",
  "friends→family",
];

// ─── sub-components ──────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

function StepDot({ n, current }) {
  const done = n < current;
  const active = n === current;
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
      done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
    }`}>
      {done ? "✓" : n}
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">
      {children}
    </h2>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="font-semibold text-gray-800 text-sm">{value}</span>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

export default function ChangePackagePage() {
  const { accountId } = useParams();
  const navigate = useNavigate();

  // steps: 1=info, 2=package, 3=partner, 4=payment, 5=confirm
  const [step, setStep] = useState(1);
  const [selectedTab, setSelectedTab] = useState("individual");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [partnerData, setPartnerData] = useState({ fullName: "", phone: "", gender: "male" });
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["account", accountId],
    queryFn: async () => {
      const res = await axios.get(`/subscriptions/account-profile/${accountId}`);
      return res.data.data;
    },
  });

  const { data: allPackages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const res = await axios.get("/packages");
      return res.data;
    },
  });

  // ── loading / error states ────────────────────────────────────────────────

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <Spinner />
          <span className="text-sm">جاري التحميل...</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div dir="rtl" className="max-w-lg mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl">
          لم يتم العثور على بيانات الحساب
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]" dir="rtl">
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full p-10 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">تم تغيير الباقة بنجاح</h2>
          <p className="text-sm text-gray-400">جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  // ── derived values ────────────────────────────────────────────────────────

  const { account, primarySubscription, members } = profileData;
  const currentType = account.type;
  const primarySub =
    primarySubscription ||
    members?.find((m) => m.member?.role === "primary")?.gymSubscription;

  const newType = selectedTab; // 'individual' | 'friends' | 'family'
  const scenario = `${currentType}→${newType}`;

  const needsPartner =
    (currentType === "individual" && (newType === "friends" || newType === "family")) ||
    (currentType === "friends" && newType === "family") ||
    (currentType === "family" && newType === "friends");

  const willArchive = ARCHIVE_SCENARIOS.includes(scenario);
  const nonPrimaryMembers = members?.filter((m) => m.member?.role !== "primary") || [];

  const filteredPackages = allPackages.filter((p) => {
    const tabCategory = CATEGORY_TABS.find((t) => t.key === selectedTab)?.category;
    return p.category === tabCategory && p.isActive !== false;
  });

  const duration = selectedPackage?.durationMonths || null;
  const price = selectedPackage?.price || 0;
  const endDate = duration && startDate ? addMonths(new Date(startDate), duration) : null;

  // ── navigation logic ──────────────────────────────────────────────────────

  const getNextStep = () => {
    if (step === 2) return needsPartner ? 3 : 4;
    if (step === 3) return 4;
    return step + 1;
  };

  const getPrevStep = () => {
    if (step === 4) return needsPartner ? 3 : 2;
    if (step === 5) return 4;
    return step - 1;
  };

  const canProceed = () => {
    if (step === 2) return !!selectedPackage;
    if (step === 3) return !!partnerData.fullName.trim();
    if (step === 4) return !!startDate;
    return true;
  };

  // ── submit ────────────────────────────────────────────────────────────────

  const handleConfirm = async () => {
    setLoading(true);
    setError("");
    try {
      await axios.post("/subscriptions/change-package", {
        accountId,
        newPackageId: selectedPackage._id,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate.toISOString(),
        durationMonths: duration,
        pricePaid: price,
        paymentMethod,
        partnerData: needsPartner ? partnerData : null,
      });
      setSuccess(true);
      setTimeout(() => navigate(`/accounts/${accountId}`), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "فشل تغيير الباقة");
      setLoading(false);
    }
  };

  // ── render ────────────────────────────────────────────────────────────────

  const totalSteps = needsPartner ? 5 : 4;
  const displayStep = needsPartner ? step : step > 2 ? step - 1 : step;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-0 space-y-6" dir="rtl">
      {/* Back + Header */}
      <div>
        <button
          onClick={() => (step === 1 ? navigate(-1) : setStep(getPrevStep()))}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1 mb-4"
        >
          ← {step === 1 ? "رجوع" : "السابق"}
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">تغيير الباقة</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {ACCOUNT_TYPE_LABEL[currentType]} ← {ACCOUNT_TYPE_LABEL[newType] || "..."}
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, ...(needsPartner ? [3] : []), needsPartner ? 4 : 3, needsPartner ? 5 : 4].map((n, i, arr) => (
            <div key={n} className="flex items-center gap-2">
              <StepDot n={n} current={step} />
              {i < arr.length - 1 && (
                <div className={`h-0.5 w-8 ${step > n ? "bg-green-400" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── STEP 1: Account info ────────────────────────────────────────── */}
      {step === 1 && (
        <Card>
          <SectionTitle>معلومات الحساب الحالي</SectionTitle>
          <div className="space-y-1 mb-5">
            <InfoRow label="نوع الحساب" value={ACCOUNT_TYPE_LABEL[currentType] || currentType} />
            {primarySub && (
              <>
                <InfoRow label="الباقة الحالية" value={primarySub.packageId?.name || "-"} />
                <InfoRow label="تاريخ الانتهاء" value={fmt(primarySub.endDate)} />
                <InfoRow
                  label="الحالة"
                  value={primarySub.status === "active" ? "نشط" : primarySub.status}
                />
              </>
            )}
          </div>

          {/* Active non-primary members */}
          {nonPrimaryMembers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-600 mb-2">الأعضاء الحاليون</p>
              <div className="space-y-2">
                {nonPrimaryMembers.map((md) => (
                  <div
                    key={md.member._id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {md.member.fullName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {ROLE_LABEL[md.member.role] || md.member.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ── STEP 2: Select package ──────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Category tabs */}
          <Card>
            <SectionTitle>اختر نوع الباقة الجديدة</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSelectedTab(tab.key);
                    setSelectedPackage(null);
                  }}
                  className={`py-3 rounded-xl border-2 text-sm font-bold transition-all ${
                    selectedTab === tab.key
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-gray-200 text-gray-600 hover:border-blue-300"
                  }`}
                >
                  {tab.label}
                  {tab.key === currentType && (
                    <span className="block text-xs font-normal opacity-70">الحالي</span>
                  )}
                </button>
              ))}
            </div>

            {/* Scenario warning */}
            {WARNING[scenario] && (
              <div className={`mt-4 rounded-xl px-4 py-3 text-sm ${
                willArchive
                  ? "bg-amber-50 border border-amber-200 text-amber-800"
                  : "bg-blue-50 border border-blue-100 text-blue-700"
              }`}>
                {WARNING[scenario]}
              </div>
            )}
          </Card>

          {/* Package cards */}
          {filteredPackages.length > 0 ? (
            <Card>
              <SectionTitle>الباقات المتاحة</SectionTitle>
              <div className="space-y-3">
                {filteredPackages.map((pkg) => (
                  <button
                    key={pkg._id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`w-full flex items-center justify-between px-5 py-4 border-2 rounded-2xl text-right transition-all ${
                      selectedPackage?._id === pkg._id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-gray-800">{pkg.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {pkg.durationMonths} {pkg.durationMonths === 1 ? "شهر" : "أشهر"}
                      </p>
                    </div>
                    <div className="text-left">
                      <span className="text-2xl font-extrabold text-blue-600">{pkg.price}</span>
                      <span className="text-xs text-gray-500 mr-1">ريال</span>
                    </div>
                  </button>
                ))}
              </div>

            </Card>
          ) : (
            <Card>
              <p className="text-center text-gray-400 text-sm py-4">
                لا توجد باقات متاحة لهذا النوع
              </p>
            </Card>
          )}
        </div>
      )}

      {/* ── STEP 3: Partner info (conditional) ─────────────────────────── */}
      {step === 3 && needsPartner && (
        <Card>
          <SectionTitle>بيانات الشريك الجديد</SectionTitle>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                الاسم الكامل <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={partnerData.fullName}
                onChange={(e) => setPartnerData({ ...partnerData, fullName: e.target.value })}
                placeholder="اسم الشريك"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                رقم الجوال
              </label>
              <input
                type="text"
                value={partnerData.phone}
                onChange={(e) => setPartnerData({ ...partnerData, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">الجنس</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "male", label: "ذكر" },
                  { value: "female", label: "أنثى" },
                ].map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setPartnerData({ ...partnerData, gender: g.value })}
                    className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                      partnerData.gender === g.value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:border-blue-300"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ── STEP 4: Dates + payment ─────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <SectionTitle>تاريخ البداية</SectionTitle>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
            />
            {endDate && (
              <div className="mt-4 flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-500">تاريخ الانتهاء الجديد</span>
                <span className="font-bold text-blue-600">{fmt(endDate)}</span>
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>طريقة الدفع</SectionTitle>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "cash", label: "نقد", icon: "💵" },
                { value: "network", label: "شبكة", icon: "💳" },
              ].map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentMethod(m.value)}
                  className={`py-4 rounded-xl border-2 text-sm font-semibold transition-all flex flex-col items-center gap-1 ${
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
          </Card>

          {price > 0 && (
            <div className="bg-blue-600 rounded-2xl px-6 py-4 flex items-center justify-between">
              <span className="text-blue-100 font-medium">الإجمالي</span>
              <div>
                <span className="text-3xl font-extrabold text-white">{price}</span>
                <span className="text-blue-200 mr-1 text-sm">ريال</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 5: Confirmation summary ────────────────────────────────── */}
      {step === 5 && (
        <div className="space-y-4">
          <Card>
            <SectionTitle>ملخص التغيير</SectionTitle>
            <div className="space-y-1">
              <InfoRow
                label="من باقة"
                value={primarySub?.packageId?.name || ACCOUNT_TYPE_LABEL[currentType]}
              />
              <InfoRow label="إلى باقة" value={selectedPackage?.name || "-"} />
              <InfoRow
                label="نوع الحساب"
                value={`${ACCOUNT_TYPE_LABEL[currentType]} ← ${ACCOUNT_TYPE_LABEL[newType]}`}
              />
              <InfoRow label="تاريخ البداية" value={fmt(new Date(startDate))} />
              {endDate && <InfoRow label="تاريخ الانتهاء" value={fmt(endDate)} />}
              <InfoRow
                label="المدة"
                value={`${duration} ${duration === 1 ? "شهر" : "أشهر"}`}
              />
              <InfoRow
                label="طريقة الدفع"
                value={paymentMethod === "cash" ? "نقد" : "شبكة"}
              />
            </div>
            <div className="mt-4 bg-blue-600 rounded-2xl px-5 py-3 flex justify-between items-center">
              <span className="text-blue-100">الإجمالي</span>
              <span className="text-2xl font-extrabold text-white">
                {price} <span className="text-sm font-normal text-blue-200">ريال</span>
              </span>
            </div>
          </Card>

          {/* Archived members warning */}
          {willArchive && nonPrimaryMembers.length > 0 && (
            <Card>
              <SectionTitle>الأعضاء الذين سيتم أرشفتهم</SectionTitle>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3">
                <p className="text-amber-800 text-sm font-medium">
                  ⚠️ {WARNING[scenario]}
                </p>
              </div>
              <div className="space-y-2">
                {nonPrimaryMembers.map((md) => (
                  <div
                    key={md.member._id}
                    className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {md.member.fullName}
                    </span>
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                      سيتم أرشفته
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* New partner */}
          {needsPartner && partnerData.fullName && (
            <Card>
              <SectionTitle>الشريك الجديد</SectionTitle>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <span className="text-sm font-medium text-gray-700">
                  {partnerData.fullName}
                </span>
                <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">
                  سيتم إضافته
                </span>
              </div>
            </Card>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm font-medium">❌ {error}</p>
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[52px]"
          >
            {loading ? (
              <>
                <Spinner />
                جاري تغيير الباقة...
              </>
            ) : (
              "تأكيد تغيير الباقة"
            )}
          </button>
        </div>
      )}

      {/* ── Next button (steps 1–4) ──────────────────────────────────────── */}
      {step < 5 && (
        <button
          onClick={() => setStep(getNextStep())}
          disabled={!canProceed()}
          className="w-full py-4 rounded-xl bg-blue-600 text-white font-bold text-base hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px]"
        >
          {step === 4 ? "مراجعة التغييرات" : "التالي ←"}
        </button>
      )}
    </div>
  );
}
