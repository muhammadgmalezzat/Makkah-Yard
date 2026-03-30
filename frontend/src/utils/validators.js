/**
 * Validation utilities for forms and data
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (basic check)
 * @param {string} phone - Phone to validate
 * @returns {boolean} True if valid
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const phoneRegex = /^[\d\s\-+()]+$/;
  return phoneRegex.test(phone) && phone.length >= 9;
};

/**
 * Validate national ID format (Saudi ID - 10 digits)
 * @param {string} nationalId - National ID to validate
 * @returns {boolean} True if valid
 */
export const isValidNationalId = (nationalId) => {
  if (!nationalId) return true; // Optional field
  return /^\d{10}$/.test(nationalId.toString());
};

/**
 * Validate name (at least 2 characters)
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid
 */
export const isValidName = (name) => {
  if (!name) return false;
  return name.trim().length >= 2;
};

/**
 * Validate age within range
 * @param {number} age - Age to validate
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {boolean} True if valid
 */
export const isValidAge = (age, minAge = 1, maxAge = 100) => {
  const ageNum = parseInt(age, 10);
  return !isNaN(ageNum) && ageNum >= minAge && ageNum <= maxAge;
};

/**
 * Validate date format (should be valid date)
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return !isNaN(dateObj.getTime());
};

/**
 * Validate date is not in past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if date is today or future
 */
export const isDateNotInPast = (date) => {
  if (!isValidDate(date)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  return dateObj >= today;
};

/**
 * Validate date is in past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} True if date is in past
 */
export const isDateInPast = (date) => {
  if (!isValidDate(date)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);

  return dateObj < today;
};

/**
 * Validate that end date is after start date
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {boolean} True if end > start
 */
export const isEndDateAfterStartDate = (startDate, endDate) => {
  if (!isValidDate(startDate) || !isValidDate(endDate)) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  return end > start;
};

/**
 * Validate number is positive
 * @param {number} value - Value to validate
 * @returns {boolean} True if positive
 */
export const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Validate number is within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
export const isNumberInRange = (value, min = 0, max = 100) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean} True if value is not empty
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value);
};

/**
 * Validate member form data
 * @param {object} data - Member data object
 * @returns {object} Validation result { valid: boolean, errors: {...} }
 */
export const validateMemberData = (data) => {
  const errors = {};

  if (!isValidName(data.fullName)) {
    errors.fullName = "الاسم مطلوب (حد أدنى 2 أحرف)";
  }

  if (!isValidPhone(data.phone)) {
    errors.phone = "رقم الهاتف غير صحيح";
  }

  if (data.email && !isValidEmail(data.email)) {
    errors.email = "البريد الإلكتروني غير صحيح";
  }

  if (data.nationalId && !isValidNationalId(data.nationalId)) {
    errors.nationalId = "رقم الهوية يجب أن يكون 10 أرقام";
  }

  if (data.dateOfBirth && !isValidDate(data.dateOfBirth)) {
    errors.dateOfBirth = "تاريخ الميلاد غير صحيح";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate subscription form data
 * @param {object} data - Subscription data object
 * @returns {object} Validation result { valid: boolean, errors: {...} }
 */
export const validateSubscriptionData = (data) => {
  const errors = {};

  if (!data.packageId) {
    errors.packageId = "الحزمة مطلوبة";
  }

  if (!isValidDate(data.startDate)) {
    errors.startDate = "تاريخ البداية مطلوب";
  }

  if (data.startDate && !isDateNotInPast(data.startDate)) {
    errors.startDate = "تاريخ البداية يجب أن يكون اليوم أو المستقبل";
  }

  if (!data.paymentMethod) {
    errors.paymentMethod = "طريقة الدفع مطلوبة";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Validate price is reasonable
 * @param {number} price - Price to validate
 * @returns {boolean} True if price seems reasonable
 */
export const isReasonablePrice = (price) => {
  const priceNum = parseFloat(price);
  // Assuming prices are less than 10,000 SAR
  return !isNaN(priceNum) && priceNum > 0 && priceNum < 10000;
};

/**
 * Sanitize user input (basic XSS prevention)
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export const sanitizeInput = (input) => {
  if (typeof input !== "string") return input;

  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
};
