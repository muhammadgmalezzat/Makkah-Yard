import { Spinner } from "./Spinner";

/**
 * Button Component - Reusable button with multiple variants and sizes
 * Variants: primary (blue), secondary (gray), danger (red), success (green), warning (yellow)
 * Sizes: sm, md, lg
 */
export function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  onClick,
  children,
  className = "",
  type = "button",
  ...props
}) {
  // Variant styles
  const variantStyles = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600",
    secondary:
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600",
    success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-600",
    warning:
      "bg-yellow-600 text-white hover:bg-yellow-700 disabled:bg-yellow-600",
  };

  // Size styles
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs sm:text-sm",
    md: "px-4 py-2 text-sm sm:text-base",
    lg: "px-6 py-3 text-base sm:text-lg",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        rounded-lg font-semibold transition-all
        min-h-[44px] flex items-center justify-center
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
