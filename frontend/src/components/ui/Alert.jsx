/**
 * Alert Component - Status message with variants and close button
 * Variants: error, success, warning, info
 */
export function Alert({ type = "info", message, onClose, className = "" }) {
  const typeStyles = {
    error: {
      container: "bg-red-50 border border-red-200",
      text: "text-red-700",
      icon: "❌",
    },
    success: {
      container: "bg-green-50 border border-green-200",
      text: "text-green-700",
      icon: "✅",
    },
    warning: {
      container: "bg-yellow-50 border border-yellow-200",
      text: "text-yellow-700",
      icon: "⚠️",
    },
    info: {
      container: "bg-blue-50 border border-blue-200",
      text: "text-blue-700",
      icon: "ℹ️",
    },
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`
        ${styles.container} rounded-lg p-4 flex items-start gap-3
        ${className}
      `}
    >
      <span className="text-xl shrink-0">{styles.icon}</span>
      <p className={`${styles.text} text-sm font-medium flex-1`}>{message}</p>
      {onClose && (
        <button
          onClick={onClose}
          className={`${styles.text} hover:opacity-75 text-xl leading-none shrink-0`}
        >
          ×
        </button>
      )}
    </div>
  );
}
