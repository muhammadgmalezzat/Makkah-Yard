import { Button } from "./Button";

/**
 * EmptyState Component - Icon + title + description for empty states
 */
export function EmptyState({
  icon = "🔎",
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div
      className={`
        bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center
        ${className}
      `}
    >
      {icon && <p className="text-4xl mb-3">{icon}</p>}
      {title && <p className="text-amber-900 font-semibold mb-1">{title}</p>}
      {description && (
        <p className="text-sm text-amber-700 mb-4">{description}</p>
      )}
      {action && (
        <Button
          variant="warning"
          size="sm"
          onClick={action.onClick}
          className="mt-4"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
