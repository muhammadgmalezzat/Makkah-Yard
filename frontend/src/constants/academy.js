/**
 * Academy-specific configurations (sports, genders, roles, etc.)
 */

export const GENDERS = [
  { value: "male", label: "ذكر", icon: "👦" },
  { value: "female", label: "أنثى", icon: "👧" },
];

export const GENDER_MAP = {
  male: "ذكر",
  female: "أنثى",
};

export const GENDER_BADGES = {
  male: "bg-blue-100 text-blue-700",
  female: "bg-pink-100 text-pink-700",
};

export const SPORT_GENDERS = [
  { value: "male", label: "أولاد" },
  { value: "female", label: "بنات" },
  { value: "both", label: "مشترك" },
];

export const SPORT_GENDER_MAP = {
  male: "أولاد",
  female: "بنات",
  both: "مشترك",
};

export const SPORT_GENDER_BADGES = {
  male: "bg-blue-100 text-blue-700",
  female: "bg-pink-100 text-pink-700",
  both: "bg-purple-100 text-purple-700",
};

export const ACADEMY_ROLE_CONFIG = {
  primary: "أساسي",
  partner: "شريك",
  child: "طفل",
  sub_adult: "فرعي بالغ",
};

export const GUARDIAN_RELATIONS = [
  { value: "father", label: "والد" },
  { value: "mother", label: "والدة" },
  { value: "brother", label: "أخ" },
  { value: "sister", label: "أخت" },
  { value: "uncle", label: "عم" },
  { value: "aunt", label: "عمة" },
  { value: "grandfather", label: "جد" },
  { value: "grandmother", label: "جدة" },
  { value: "other", label: "آخر" },
];

export const ACADEMY_CHILD_AGE_RANGE = {
  min: 4,
  max: 14,
};

export const AGE_GROUPS = [
  { label: "4-6 سنوات", min: 4, max: 6 },
  { label: "7-9 سنوات", min: 7, max: 9 },
  { label: "10-12 سنة", min: 10, max: 12 },
  { label: "13-14 سنة", min: 13, max: 14 },
];

export const GROUP_ICONS = {
  male: "👦",
  female: "👧",
  both: "👫",
};

export const GROUP_STATUS_BADGES = {
  full: "bg-red-100 text-red-700",
  almost_full: "bg-yellow-100 text-yellow-700",
  available: "bg-green-100 text-green-700",
};

export const GROUP_STATUS_LABELS = {
  full: "ممتلئة",
  almost_full: "قريبة من الامتلاء",
  available: "متاحة",
};

export const ACADEMY_EXPIRY_DAYS = [
  { value: 5, label: "5 أيام" },
  { value: 10, label: "10 أيام" },
  { value: 30, label: "شهر" },
];

export const ACADEMY_COACH_ACTIONS = [
  { value: "change_sport", label: "تغيير الرياضة" },
  { value: "change_group", label: "تغيير المجموعة" },
  { value: "edit_dates", label: "تعديل التواريخ" },
  { value: "renew", label: "تجديد" },
];

/**
 * Get gender label
 * @param {string} gender - Gender code
 * @returns {string} Gender label
 */
export const getGenderLabel = (gender) => {
  return GENDER_MAP[gender] || gender;
};

/**
 * Get guardian relation label
 * @param {string} relation - Relation code
 * @returns {string} Relation label
 */
export const getGuardianRelationLabel = (relation) => {
  const rel = GUARDIAN_RELATIONS.find((r) => r.value === relation);
  return rel?.label || relation;
};

/**
 * Get sport gender label
 * @param {string} gender - Sport gender code
 * @returns {string} Sport gender label
 */
export const getSportGenderLabel = (gender) => {
  return SPORT_GENDER_MAP[gender] || gender;
};

/**
 * Check if child is within valid academy age range
 * @param {number} age - Child age
 * @returns {boolean} True if within range
 */
export const isValidAcademyAge = (age) => {
  return (
    age >= ACADEMY_CHILD_AGE_RANGE.min && age <= ACADEMY_CHILD_AGE_RANGE.max
  );
};

/**
 * Get age group category
 * @param {number} age - Child age
 * @returns {string} Age group label or empty string
 */
export const getAgeGroup = (age) => {
  const group = AGE_GROUPS.find((g) => age >= g.min && age <= g.max);
  return group?.label || "";
};
