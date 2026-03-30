/**
 * Common Arabic UI messages and labels
 */

export const MESSAGES = {
  // Loading
  loading: "جاري التحميل...",
  loadingData: "جاري تحميل البيانات...",
  loadingProfile: "جاري تحميل الملف الشخصي...",

  // Success
  successSave: "✅ تم الحفظ بنجاح",
  successDelete: "✅ تم الحذف بنجاح",
  successCreate: "✅ تم الإنشاء بنجاح",
  successUpdate: "✅ تم التحديث بنجاح",
  successSubmit: "✅ تم الإرسال بنجاح",

  // Error
  errorGeneral: "حدث خطأ، حاول مرة أخرى",
  errorNetwork: "خطأ في الاتصال، تحقق من الإنترنت",
  errorNotFound: "غير موجود",
  errorPermission: "ليس لديك صلاحية للوصول",
  errorValidation: "بيانات غير صحيحة",

  // Confirmations
  confirmDelete: "⚠️ تحذير: هل أنت متأكد من الحذف؟",
  confirmCancel: "هل تريد إلغاء العملية الحالية؟",

  // Empty states
  emptyResults: "لم يتم العثور على نتائج",
  emptyData: "لا توجد بيانات للعرض",
  emptyList: "القائمة فارغة",

  // Common labels
  name: "الاسم",
  email: "البريد الإلكتروني",
  phone: "رقم الهاتف",
  date: "التاريخ",
  startDate: "تاريخ البداية",
  endDate: "تاريخ النهاية",
  status: "الحالة",
  action: "الإجراء",
  actions: "الإجراءات",
  save: "حفظ",
  cancel: "إلغاء",
  delete: "حذف",
  edit: "تعديل",
  add: "إضافة",
  next: "التالي",
  previous: "السابق",
  back: "العودة",
  search: "بحث",
  filter: "تصفية",
  reset: "إعادة تعيين",
  print: "طباعة",
  download: "تنزيل",
  upload: "رفع",
  export: "تصدير",
  import: "استيراد",
  close: "إغلاق",
  confirm: "تأكيد",

  // Form-related
  required: "مطلوب",
  optional: "اختياري",
  invalid: "غير صحيح",
  enterValue: "أدخل القيمة",
  selectOption: "اختر خيار",
  chooseFile: "اختر ملف",

  // Pagination
  page: "صفحة",
  of: "من",
  showing: "عرض",
  total: "الإجمالي",

  // Time-related
  today: "اليوم",
  tomorrow: "غداً",
  yesterday: "أمس",
  thisWeek: "هذا الأسبوع",
  thisMonth: "هذا الشهر",
  thisYear: "هذا العام",
};

export const ERROR_MESSAGES = {
  emailRequired: "البريد الإلكتروني مطلوب",
  emailInvalid: "البريد الإلكتروني غير صحيح",
  phoneRequired: "رقم الهاتف مطلوب",
  phoneInvalid: "رقم الهاتف غير صحيح",
  nameRequired: "الاسم مطلوب",
  nameMinLength: "الاسم يجب أن يكون حد أدنى 2 أحرف",
  passwordRequired: "كلمة المرور مطلوبة",
  passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
  dateRequired: "التاريخ مطلوب",
  dateInvalid: "التاريخ غير صحيح",
  dateInPast: "التاريخ يجب أن يكون اليوم أو المستقبل",
  fieldRequired: "هذا الحقل مطلوب",
  selectRequired: "يرجى الاختيار",
  optionRequired: "يرجى اختيار خيار",
};

export const SUCCESS_MESSAGES = {
  loginSuccess: "✅ تم تسجيل الدخول بنجاح",
  logoutSuccess: "✅ تم تسجيل الخروج بنجاح",
  memberAdded: "✅ تم إضافة العضو بنجاح",
  memberUpdated: "✅ تم تحديث بيانات العضو",
  subscriptionCreated: "✅ تم إنشاء الاشتراك بنجاح",
  subscriptionRenewed: "✅ تم تجديد الاشتراك بنجاح",
  subscriptionUpdated: "✅ تم تحديث الاشتراك بنجاح",
  paymentRecorded: "✅ تم تسجيل الدفع بنجاح",
};

export const VALIDATION_MESSAGES = {
  required: "هذا الحقل مطلوب",
  minLength: (length) => `الحد الأدنى ${length} أحرف`,
  maxLength: (length) => `الحد الأقصى ${length} أحرف`,
  email: "البريد الإلكتروني غير صحيح",
  phone: "رقم الهاتف غير صحيح",
  number: "يجب أن تكون قيمة رقمية",
  positiveNumber: "يجب أن تكون قيمة موجبة",
  date: "التاريخ غير صحيح",
  password: "كلمة المرور ضعيفة",
};

export const BUTTON_LABELS = {
  save: "✓ حفظ",
  saveChanges: "✓ حفظ التغييرات",
  submit: "✓ إرسال",
  create: "✓ إنشاء",
  add: "+ إضافة",
  edit: "✏️ تعديل",
  delete: "🗑️ حذف",
  cancel: "← إلغاء",
  back: "← العودة",
  next: "التالي →",
  previous: "← السابق",
  search: "🔍 بحث",
  filter: "⚙️ تصفية",
  reset: "↻ إعادة تعيين",
  print: "🖨️ طباعة",
  download: "📥 تنزيل",
  logout: "→ تسجيل الخروج",
  login: "دخول",
  register: "تسجيل",
  confirm: "✓ تأكيد",
  close: "✕ إغلاق",
};

export const PLACEHOLDERS = {
  search: "ابحث هنا...",
  enterName: "أدخل الاسم",
  enterEmail: "أدخل البريد الإلكتروني",
  enterPhone: "أدخل رقم الهاتف",
  enterPassword: "أدخل كلمة المرور",
  confirmPassword: "أكد كلمة المرور",
  selectOption: "اختر خيار",
  selectDate: "اختر التاريخ",
};

/**
 * Get error message
 * @param {string} key - Message key
 * @returns {string} Localized error message
 */
export const getErrorMessage = (key) => {
  return ERROR_MESSAGES[key] || MESSAGES.errorGeneral;
};

/**
 * Get success message
 * @param {string} key - Message key
 * @returns {string} Localized success message
 */
export const getSuccessMessage = (key) => {
  return SUCCESS_MESSAGES[key] || MESSAGES.successSubmit;
};

/**
 * Get button label
 * @param {string} key - Button key
 * @returns {string} Button label
 */
export const getButtonLabel = (key) => {
  return BUTTON_LABELS[key] || key;
};
