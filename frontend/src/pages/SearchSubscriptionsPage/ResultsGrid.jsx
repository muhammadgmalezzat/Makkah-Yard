import { SkeletonCard } from "../../components/ui";
import { ResultCard } from "./ResultCard";

/**
 * ResultsGrid - Grid with pagination and result cards
 */
export function ResultsGrid({
  isLoading,
  results,
  totalPages,
  currentPage,
  onPageChange,
  onViewAccount,
  onViewProfile,
  onDelete,
  deletingId,
  canDelete,
  statusConfig,
  isExpired,
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">🔎</p>
        <p className="text-amber-900 font-semibold mb-1">
          لم يتم العثور على نتائج
        </p>
        <p className="text-sm text-amber-700">
          حاول تغيير معايير البحث أو التصفية
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
          >
            السابق
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2,
              )
              .reduce((acc, p, idx, arr) => {
                if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === "..." ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium min-w-[40px] transition min-h-[44px] flex items-center justify-center ${
                      currentPage === p
                        ? "bg-blue-600 text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ),
              )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition min-h-[44px]"
          >
            التالي
          </button>
        </div>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map((result) => (
          <ResultCard
            key={result.member._id}
            result={result}
            onViewAccount={onViewAccount}
            onViewProfile={onViewProfile}
            onDelete={onDelete}
            isDeleting={deletingId === result.accountId}
            canDelete={canDelete}
            statusConfig={statusConfig}
            isExpired={isExpired}
          />
        ))}
      </div>
    </div>
  );
}
