/**
 * Payment method configurations
 */

export const PAYMENT_METHODS = [
  {
    value: "cash",
    label: "نقد",
    icon: "💵",
    color: "bg-green-100 text-green-700",
  },
  {
    value: "network",
    label: "تحويل بنكي",
    icon: "🏦",
    color: "bg-blue-100 text-blue-700",
  },
  {
    value: "tabby",
    label: "تابي",
    icon: "💳",
    color: "bg-purple-100 text-purple-700",
  },
  {
    value: "tamara",
    label: "تمارة",
    icon: "🛍️",
    color: "bg-orange-100 text-orange-700",
  },
  {
    value: "transfer",
    label: "تحويل",
    icon: "↔️",
    color: "bg-cyan-100 text-cyan-700",
  },
];

export const PAYMENT_METHOD_MAP = {
  cash: "نقد",
  network: "تحويل بنكي",
  tabby: "تابي",
  tamara: "تمارة",
  transfer: "تحويل",
};

export const PAYMENT_METHOD_ICONS = {
  cash: "💵",
  network: "🏦",
  tabby: "💳",
  tamara: "🛍️",
  transfer: "↔️",
};

export const PAYMENT_METHOD_COLORS = {
  cash: "bg-green-100 text-green-700",
  network: "bg-blue-100 text-blue-700",
  tabby: "bg-purple-100 text-purple-700",
  tamara: "bg-orange-100 text-orange-700",
  transfer: "bg-cyan-100 text-cyan-700",
};

export const PAYMENT_status = {
  pending: "قيد الانتظار",
  completed: "مكتمل",
  failed: "فشل",
  refunded: "استرجاع",
};

/**
 * Get payment method label
 * @param {string} method - Payment method code
 * @returns {string} Label
 */
export const getPaymentMethodLabel = (method) => {
  return PAYMENT_METHOD_MAP[method] || method;
};

/**
 * Get payment method icon
 * @param {string} method - Payment method code
 * @returns {string} Icon emoji
 */
export const getPaymentMethodIcon = (method) => {
  return PAYMENT_METHOD_ICONS[method] || "💰";
};

/**
 * Get payment method color
 * @param {string} method - Payment method code
 * @returns {string} Tailwind CSS classes
 */
export const getPaymentMethodColor = (method) => {
  return PAYMENT_METHOD_COLORS[method] || "bg-gray-100 text-gray-700";
};

/**
 * Get payment method config
 * @param {string} method - Payment method code
 * @returns {object} Payment method configuration
 */
export const getPaymentMethodConfig = (method) => {
  return PAYMENT_METHODS.find((m) => m.value === method) || PAYMENT_METHODS[0];
};
