/**
 * Badge Component - Status indicator with multiple variants
 * Variants: active, expired, frozen, cancelled, academy, partner, child, sub_adult
 */
export function Badge({ status = "active", label, className = "" }) {
  const variants = {
    active: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-600",
    frozen: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-700",
    renewed: "bg-blue-100 text-blue-700",
    academy: "bg-purple-100 text-purple-700",
    partner: "bg-purple-100 text-purple-700",
    child: "bg-orange-100 text-orange-700",
    sub_adult: "bg-teal-100 text-teal-700",
    primary: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
    warning: "bg-yellow-100 text-yellow-700",
    info: "bg-blue-100 text-blue-700",
    success: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`
        inline-block px-3 py-1 text-xs font-semibold rounded-full
        ${variants[status] || variants.active}
        ${className}
      `}
    >
      {label || status}
    </span>
  );
}
