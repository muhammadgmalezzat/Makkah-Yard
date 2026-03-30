/**
 * Input Component - Form input with label, error, and multiple variants
 * Variants: text, email, tel, date, number, select, textarea
 * RTL support with dir="rtl"
 */
export function Input({
  label,
  error,
  placeholder,
  value,
  onChange,
  type = "text",
  required = false,
  className = "",
  disabled = false,
  dir = "rtl",
  children, // For select options
  ...props
}) {
  const baseInputClass =
    "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-right";

  return (
    <div dir={dir} className="space-y-1">
      {label && (
        <label className="block text-sm font-semibold text-gray-600 mb-1.5 text-right">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {type === "select" ? (
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${baseInputClass} ${className}`}
          {...props}
        >
          {children}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseInputClass} resize-none ${className}`}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`${baseInputClass} ${className}`}
          {...props}
        />
      )}

      {error && <p className="text-red-500 text-xs mt-1 text-right">{error}</p>}
    </div>
  );
}
