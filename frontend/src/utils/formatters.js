/**
 * Formatting utilities for dates, currency, status, and other common values
 */

/**
 * Format date to Arabic locale
 * @param {string|Date} dateString - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string or "-" if empty
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return "-";

  const defaults = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  };

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-SA", defaults);
  } catch (error) {
    return "-";
  }
};

/**
 * Format date to ISO format (YYYY-MM-DD) for input[type="date"]
 * @param {string|Date} dateString - Date to format
 * @returns {string} ISO date string
 */
export const formatDateToISO = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  } catch (error) {
    return "";
  }
};

/**
 * Calculate age from birth date
 * @param {string|Date} dateOfBirth - Birth date
 * @returns {number|null} Age in years or null if invalid
 */
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;

  try {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  } catch (error) {
    return null;
  }
};

/**
 * Format currency to SAR with Arabic locale
 * @param {number} value - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value) => {
  if (typeof value !== "number") return "0 ريال";

  try {
    return value.toLocaleString("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch (error) {
    return `${value} ريال`;
  }
};

/**
 * Format currency without currency symbol (just number)
 * @param {number} value - Amount to format
 * @returns {string} Formatted number string
 */
export const formatNumber = (value) => {
  if (typeof value !== "number") return "0";

  try {
    return value.toLocaleString("ar-SA");
  } catch (error) {
    return String(value);
  }
};

/**
 * Format phone number (basic formatting)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone
 */
export const formatPhone = (phone) => {
  if (!phone) return "-";
  return String(phone).trim();
};

/**
 * Calculate days until a date
 * @param {string|Date} endDate - End date
 * @returns {number} Days remaining (negative if past)
 */
export const getDaysUntilExpiry = (endDate) => {
  if (!endDate) return 0;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    const diff = end - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
};

/**
 * Check if date is expired
 * @param {string|Date} dateStr - Date to check
 * @returns {boolean} True if expired
 */
export const isDateExpired = (dateStr) => {
  if (!dateStr) return false;
  return getDaysUntilExpiry(dateStr) < 0;
};

/**
 * Calculate end date from start date and duration in months
 * @param {string|Date} startDate - Start date
 * @param {number} durationMonths - Duration in months
 * @returns {string} Formatted end date
 */
export const calculateEndDate = (startDate, durationMonths) => {
  if (!startDate || !durationMonths) return "-";

  try {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + parseInt(durationMonths));
    return formatDate(date);
  } catch (error) {
    return "-";
  }
};

/**
 * Format subscription price based on category
 * @param {number} price - Price amount
 * @param {number} months - Duration in months
 * @returns {object} Price info { displayPrice, perMonth }
 */
export const formatSubscriptionPrice = (price, months = 1) => {
  const displayPrice = formatNumber(price);
  const perMonth = months > 0 ? Math.round(price / months) : price;

  return {
    displayPrice,
    perMonth: formatNumber(perMonth),
    total: formatCurrency(price),
  };
};

/**
 * Get text label from status value
 * @param {string} status - Status code
 * @param {object} statusConfig - Status configuration mapping
 * @returns {string} Status label
 */
export const getStatusLabel = (status, statusConfig = {}) => {
  return statusConfig[status]?.label || status || "-";
};

/**
 * Get badge CSS class from status value
 * @param {string} status - Status code
 * @param {object} statusConfig - Status configuration mapping
 * @returns {string} Tailwind CSS classes
 */
export const getStatusBadgeClass = (status, statusConfig = {}) => {
  return statusConfig[status]?.badge || "bg-gray-100 text-gray-700";
};

/**
 * Format member role for display
 * @param {string} role - Role code (primary, partner, child, sub_adult)
 * @returns {string} Formatted role label
 */
export const formatMemberRole = (role) => {
  const roleMap = {
    primary: "أساسي",
    partner: "شريك",
    child: "طفل",
    sub_adult: "فرعي بالغ",
  };
  return roleMap[role] || role;
};

/**
 * Format gender for display
 * @param {string} gender - Gender code (male, female)
 * @returns {string} Formatted gender label
 */
export const formatGender = (gender) => {
  const genderMap = {
    male: "ذكر",
    female: "أنثى",
  };
  return genderMap[gender] || gender;
};

/**
 * Format account type for display
 * @param {string} type - Account type code
 * @returns {string} Formatted type label
 */
export const formatAccountType = (type) => {
  const typeMap = {
    individual: "فردي",
    friends: "أصدقاء",
    family: "عائلي",
    academy_only: "أكاديمية فقط",
  };
  return typeMap[type] || type;
};

/**
 * Format payment method for display
 * @param {string} method - Payment method code
 * @returns {string} Formatted method label
 */
export const formatPaymentMethod = (method) => {
  const methodMap = {
    cash: "نقد",
    network: "تحويل بنكي",
    tabby: "تابي",
    tamara: "تمارة",
    transfer: "تحويل",
  };
  return methodMap[method] || method;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Max length
 * @returns {string} Truncated text with ellipsis
 */
export const truncateText = (text, length = 50) => {
  if (!text || text.length <= length) return text;
  return text.substring(0, length) + "...";
};

/**
 * Calculate percentage with safety
 * @param {number} current - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export const calculatePercentage = (current, total) => {
  if (!total || total === 0) return 0;
  const percentage = Math.round((current / total) * 100);
  return Math.min(Math.max(percentage, 0), 100);
};
