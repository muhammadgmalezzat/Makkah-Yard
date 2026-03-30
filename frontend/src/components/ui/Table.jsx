/**
 * Table Component - Reusable table with RTL support and overflow handling
 * Props:
 *   headers: array of header objects { key, label }
 *   rows: array of row objects { key, cells: {} or use key directly }
 *   emptyMessage: message when no rows
 *   onRowClick: optional handler for row clicks
 */
export function Table({
  headers = [],
  rows = [],
  emptyMessage = "لا توجد بيانات",
  onRowClick,
  className = "",
}) {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-full">
          {/* Header */}
          {headers.length > 0 && (
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {headers.map((header, idx) => (
                  <th
                    key={`header-${idx}`}
                    className="px-6 py-3 text-right font-semibold text-gray-700"
                  >
                    {header.label || header}
                  </th>
                ))}
              </tr>
            </thead>
          )}

          {/* Body */}
          <tbody className="divide-y divide-gray-200">
            {rows.length > 0 ? (
              rows.map((row, rowIdx) => (
                <tr
                  key={`row-${rowIdx}`}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-gray-50 ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {headers.map((header, cellIdx) => {
                    const headerKey = header.key || header;
                    const cellValue = row[headerKey];
                    return (
                      <td
                        key={`cell-${rowIdx}-${cellIdx}`}
                        className="px-6 py-3 text-gray-900"
                      >
                        {cellValue}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
