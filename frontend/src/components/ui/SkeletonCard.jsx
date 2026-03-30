/**
 * SkeletonCard Component - Placeholder for loading state
 * Exact replica from SearchSubscriptionsPage
 */
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-24"></div>
          </div>
        </div>
        <div className="h-6 bg-gray-200 rounded-full w-16 shrink-0"></div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 rounded-xl p-3 h-16"></div>
        <div className="bg-gray-50 rounded-xl p-3 h-16"></div>
      </div>
      <div className="h-10 bg-gray-200 rounded-xl"></div>
    </div>
  );
}
