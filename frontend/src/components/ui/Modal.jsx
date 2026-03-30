/**
 * Modal Component - Bottom sheet on mobile, centered on desktop
 * Features:
 * - Overlay with dark background
 * - RTL support with dir="rtl"
 * - Mobile: full screen from bottom
 * - Desktop: centered with max width
 */
export function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;

  const sizeStyles = {
    sm: "sm:max-w-sm",
    md: "sm:max-w-md",
    lg: "sm:max-w-lg",
    xl: "sm:max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
      dir="rtl"
    >
      <div
        className={`
          bg-white rounded-none sm:rounded-xl p-4 sm:p-6 w-full
          shadow-xl min-h-screen sm:min-h-0 overflow-y-auto
          ${sizeStyles[size]}
        `}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
