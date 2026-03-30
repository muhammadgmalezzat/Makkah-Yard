/**
 * Package and account type configurations
 */

export const ACCOUNT_TYPES = [
  {
    id: "individual",
    label: "فردي",
    description: "عضو واحد",
    icon: "👤",
  },
  {
    id: "friends",
    label: "أصدقاء",
    description: "شخصان",
    icon: "👥",
  },
  {
    id: "family",
    label: "عائلي",
    description: "عائلة",
    icon: "👨‍👩‍👧",
  },
  {
    id: "academy_only",
    label: "أكاديمية",
    description: "طفل غير مشترك (أقل من 15 سنة)",
    icon: "🏃",
  },
];

export const PACKAGE_CATEGORIES = [
  { value: "", label: "الكل" },
  { value: "individual", label: "فردي" },
  { value: "friends", label: "أصدقاء" },
  { value: "family_essential", label: "عائلي أساسي" },
  { value: "sub_adult", label: "عضو إضافي بالغ" },
  { value: "sub_child", label: "عضو إضافي أطفال" },
  { value: "academy_only", label: "أكاديمية فقط" },
];

export const PACKAGE_COLORS = {
  individual: "bg-blue-100 text-blue-700",
  friends: "bg-purple-100 text-purple-700",
  family_essential: "bg-green-100 text-green-700",
  sub_adult: "bg-orange-100 text-orange-700",
  sub_child: "bg-pink-100 text-pink-700",
  academy_only: "bg-teal-100 text-teal-700",
};

export const PACKAGE_DURATION_OPTIONS = [
  { value: 1, label: "شهر", months: 1 },
  { value: 3, label: "3 أشهر", months: 3 },
  { value: 6, label: "6 أشهر (مع خصم)", months: 6 },
  { value: 12, label: "سنة (مع خصم)", months: 12 },
];

export const MEMBER_TYPES_FOR_SUB = [
  {
    id: "sub_adult",
    label: "بالغ فرعي",
    description: "15 سنة فأكثر",
    icon: "👨",
    minAge: 15,
  },
  {
    id: "sub_child",
    label: "طفل فرعي",
    description: "أقل من 15 سنة",
    icon: "👦",
    maxAge: 14,
  },
];

export const STEP_LABELS = ["النوع", "العضو", "الحزمة", "الدفع", "التأكيد"];

export const STEP_LABELS_SUB_MEMBER = [
  "البحث",
  "نوع العضو",
  "الحزمة",
  "بيانات التفاصيل",
  "التأكيد",
];

/**
 * Get category label from value
 * @param {string} categoryValue - Category code
 * @returns {string} Category label
 */
export const getCategoryLabel = (categoryValue) => {
  const category = PACKAGE_CATEGORIES.find((c) => c.value === categoryValue);
  return category?.label || categoryValue;
};

/**
 * Get category color from category code
 * @param {string} categoryValue - Category code
 * @returns {string} Tailwind CSS classes
 */
export const getCategoryColor = (categoryValue) => {
  return PACKAGE_COLORS[categoryValue] || "bg-gray-100 text-gray-600";
};

/**
 * Get account type config by ID
 * @param {string} typeId - Account type ID
 * @returns {object} Account type configuration
 */
export const getAccountType = (typeId) => {
  return ACCOUNT_TYPES.find((t) => t.id === typeId) || ACCOUNT_TYPES[0];
};

/**
 * Get package duration info
 * @param {number} months - Month count
 * @returns {string} Duration label
 */
export const getDurationLabel = (months) => {
  const option = PACKAGE_DURATION_OPTIONS.find((o) => o.months === months);
  return option?.label || `${months} شهر`;
};
