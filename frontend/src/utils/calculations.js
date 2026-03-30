/**
 * Business logic calculations (price, dates, counts, etc.)
 */

/**
 * Calculate subscription price for sub-child package
 * @param {object} packageData - Package object with pricePerMonth
 * @param {number} months - Number of months
 * @returns {number} Calculated price
 */
export const calculateSubChildPrice = (packageData, months) => {
  if (!packageData || !packageData.pricePerMonth) return 0;

  const numMonths = parseInt(months, 10);

  if (numMonths <= 5) {
    return packageData.pricePerMonth * numMonths;
  } else {
    // 6+ months gets 5-month price (discount)
    return packageData.pricePerMonth * 5;
  }
};

/**
 * Calculate subscription price for academy package
 * @param {number} durationMonths - Duration in months
 * @param {object} monthlyPackage - Monthly package object
 * @param {object} annualPackage - Annual package object (optional)
 * @returns {number} Calculated price
 */
export const calculateAcademyPrice = (
  durationMonths,
  monthlyPackage,
  annualPackage = null,
) => {
  if (!monthlyPackage) return 0;

  const months = parseInt(durationMonths, 10);

  if (months === 12 && annualPackage) {
    return annualPackage.price;
  }

  if (months === 6) {
    return monthlyPackage.pricePerMonth * 5;
  }

  return monthlyPackage.pricePerMonth * months;
};

/**
 * Calculate subscription end date
 * @param {string|Date} startDate - Start date
 * @param {number} durationMonths - Duration in months
 * @returns {Date} Calculated end date
 */
export const getSubscriptionEndDate = (startDate, durationMonths) => {
  if (!startDate) return new Date();

  const date = new Date(startDate);
  date.setMonth(date.getMonth() + parseInt(durationMonths, 10));
  return date;
};

/**
 * Check if subscription exceeds primary member's end date
 * @param {string|Date} subEndDate - Sub member end date
 * @param {string|Date} primaryEndDate - Primary member end date
 * @returns {boolean} True if exceeds
 */
export const exceedsEndDate = (subEndDate, primaryEndDate) => {
  if (!subEndDate || !primaryEndDate) return false;

  const subEnd = new Date(subEndDate);
  const primaryEnd = new Date(primaryEndDate);

  return subEnd > primaryEnd;
};

/**
 * Calculate group capacity percentage
 * @param {number} currentCount - Current members
 * @param {number} maxCapacity - Max capacity
 * @returns {number} Percentage (0-100)
 */
export const calculateCapacityPercentage = (currentCount, maxCapacity) => {
  if (!maxCapacity || maxCapacity === 0) return 0;
  const percentage = Math.round((currentCount / maxCapacity) * 100);
  return Math.min(Math.max(percentage, 0), 100);
};

/**
 * Determine if group is full, nearly full, or available
 * @param {number} percentage - Capacity percentage
 * @returns {string} Status: 'full', 'almost-full', 'available'
 */
export const getGroupCapacityStatus = (percentage) => {
  if (percentage >= 100) return "full";
  if (percentage >= 80) return "almost-full";
  return "available";
};

/**
 * Get capacity status color
 * @param {number} percentage - Capacity percentage
 * @returns {object} Color info { bg, text, badgeBg, badgeText }
 */
export const getCapacityColor = (percentage) => {
  if (percentage >= 100) {
    return {
      bg: "bg-red-500",
      text: "text-red-700",
      badgeBg: "bg-red-100",
      badgeText: "text-red-700",
      label: "ممتلئة",
    };
  }

  if (percentage >= 80) {
    return {
      bg: "bg-yellow-500",
      text: "text-yellow-700",
      badgeBg: "bg-yellow-100",
      badgeText: "text-yellow-700",
      label: "قريبة من الامتلاء",
    };
  }

  return {
    bg: "bg-green-500",
    text: "text-green-700",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    label: "متاحة",
  };
};

/**
 * Check if member age is valid for package
 * @param {number} age - Member age
 * @param {number} minAge - Minimum age
 * @param {number} maxAge - Maximum age
 * @returns {boolean} True if within range
 */
export const isAgeValid = (age, minAge, maxAge) => {
  if (age === null || age === undefined) return false;
  return age >= minAge && age <= maxAge;
};

/**
 * Calculate total revenue by category
 * @param {array} subscriptions - Array of subscription objects
 * @returns {object} Revenue breakdown { gym, academy, total }
 */
export const calculateRevenueByCategory = (subscriptions = []) => {
  let gymRevenue = 0;
  let academyRevenue = 0;

  subscriptions.forEach((sub) => {
    const amount = parseFloat(sub.pricePaid) || 0;

    if (sub.type === "academy") {
      academyRevenue += amount;
    } else {
      gymRevenue += amount;
    }
  });

  return {
    gym: gymRevenue,
    academy: academyRevenue,
    total: gymRevenue + academyRevenue,
  };
};

/**
 * Group subscriptions by month
 * @param {array} subscriptions - Array of subscription objects
 * @returns {object} Subscriptions grouped by month { 'Jan': [...], ... }
 */
export const groupSubscriptionsByMonth = (subscriptions = []) => {
  const grouped = {};

  subscriptions.forEach((sub) => {
    const date = new Date(sub.startDate);
    const monthKey = date.toLocaleDateString("ar-SA", {
      month: "long",
      year: "numeric",
    });

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }

    grouped[monthKey].push(sub);
  });

  return grouped;
};

/**
 * Count active subscriptions by status
 * @param {array} subscriptions - Array of subscription objects
 * @returns {object} Count by status { active: 5, expired: 2, ... }
 */
export const countByStatus = (subscriptions = []) => {
  const counts = {
    active: 0,
    expired: 0,
    cancelled: 0,
    renewed: 0,
  };

  subscriptions.forEach((sub) => {
    const status = sub.status || "active";
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  });

  return counts;
};

/**
 * Calculate average subscription price
 * @param {array} subscriptions - Array of subscription objects
 * @returns {number} Average price
 */
export const calculateAveragePrice = (subscriptions = []) => {
  if (subscriptions.length === 0) return 0;

  const totalPrice = subscriptions.reduce((sum, sub) => {
    return sum + (parseFloat(sub.pricePaid) || 0);
  }, 0);

  return Math.round(totalPrice / subscriptions.length);
};
