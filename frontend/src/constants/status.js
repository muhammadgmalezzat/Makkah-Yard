/**
 * Status configurations for badges, labels, and colors
 */

export const STATUS_CONFIG = {
  active: {
    label: "نشط",
    badge: "bg-green-100 text-green-700",
    color: "bg-green-500",
    textColor: "text-green-700",
  },
  expired: {
    label: "منتهي",
    badge: "bg-red-100 text-red-700",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
  cancelled: {
    label: "ملغى",
    badge: "bg-red-100 text-red-700",
    color: "bg-red-500",
    textColor: "text-red-700",
  },
  renewed: {
    label: "مجدد",
    badge: "bg-blue-100 text-blue-700",
    color: "bg-blue-500",
    textColor: "text-blue-700",
  },
  pending: {
    label: "قيد الانتظار",
    badge: "bg-yellow-100 text-yellow-700",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
  },
  frozen: {
    label: "مجمد",
    badge: "bg-cyan-100 text-cyan-700",
    color: "bg-cyan-500",
    textColor: "text-cyan-700",
  },
};

export const ROLE_CONFIG = {
  primary: {
    label: "أساسي",
    badge: "bg-blue-100 text-blue-700",
    icon: "👤",
  },
  partner: {
    label: "شريك",
    badge: "bg-purple-100 text-purple-700",
    icon: "👥",
  },
  child: {
    label: "طفل",
    badge: "bg-orange-100 text-orange-700",
    icon: "👧",
  },
  sub_adult: {
    label: "فرعي بالغ",
    badge: "bg-teal-100 text-teal-700",
    icon: "👨",
  },
};

export const SUBSCRIPTION_TYPE_CONFIG = {
  new: "جديد",
  renewal: "تجديد",
  transfer_fee: "رسم نقل",
  upgrade_diff: "فرق ترقية",
};

export const SUBSCRIPTION_STATUS_OPTIONS = [
  { value: "active", label: "نشط" },
  { value: "expired", label: "منتهي" },
  { value: "cancelled", label: "ملغى" },
  { value: "renewed", label: "مجدد" },
];

export const STATUS_COLORS = {
  active: "green",
  expired: "red",
  cancelled: "red",
  renewed: "blue",
  pending: "yellow",
  frozen: "cyan",
};

export const STATUS_BORDER_COLORS = {
  active: "border-l-4 border-l-green-500",
  expired: "border-l-4 border-l-red-500",
  cancelled: "border-l-4 border-l-gray-500",
  renewed: "border-l-4 border-l-blue-500",
  frozen: "border-l-4 border-l-cyan-500",
};

/**
 * Get status config by status code
 * @param {string} status - Status code
 * @returns {object} Status configuration
 */
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG.expired;
};

/**
 * Get role config by role code
 * @param {string} role - Role code
 * @returns {object} Role configuration
 */
export const getRoleConfig = (role) => {
  return ROLE_CONFIG[role] || ROLE_CONFIG.child;
};

/**
 * Get all status options for select dropdown
 */
export const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(
  ([code, config]) => ({
    value: code,
    label: config.label,
  }),
);
