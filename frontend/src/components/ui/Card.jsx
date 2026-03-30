/**
 * Card Component - White rounded container with border and shadow
 * Simple wrapper for content grouping
 */
export function Card({ children, className = "", padding = "p-5" }) {
  return (
    <div
      className={`
        bg-white rounded-2xl border border-gray-100 shadow-sm
        ${padding}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
