import { HiOutlineMagnifyingGlass, HiOutlineChevronUpDown, HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';
import { useState, useMemo } from 'react';

export default function DataTable({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  loading,
  searchable = true,
  title,
}) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = col.accessor ? row[col.accessor] : '';
        return val?.toString().toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortField) return filtered;
    return [...filtered].sort((a, b) => {
      const va = a[sortField] ?? '';
      const vb = b[sortField] ?? '';
      const cmp = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border shadow-sm p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
      {(title || searchable) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-b border-border">
          {title && <h3 className="text-lg font-semibold text-text">{title}</h3>}
          {searchable && (
            <div className="relative w-full sm:w-64">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors pl-10"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg/50">
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={`px-4 py-3 text-left font-medium text-text-secondary ${col.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1">
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      <HiOutlineChevronUpDown size={14} className={`transition-colors ${sortField === col.accessor ? 'text-primary' : 'text-text-secondary'}`} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-4 py-3 text-right font-medium text-text-secondary">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onEdit || onDelete || onView ? 1 : 0)} className="px-4 py-12 text-center text-text-secondary">
                  No data found
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr key={row._id || i} className="border-b border-border hover:bg-bg/30 transition-colors">
                  {columns.map((col) => (
                    <td key={col.accessor || col.header} className="px-4 py-3">
                      {col.render ? col.render(row) : row[col.accessor] ?? '-'}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onView && (
                          <button onClick={() => onView(row)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border p-1.5 text-xs" title="View">👁</button>
                        )}
                        {onEdit && (
                          <button onClick={() => onEdit(row)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border p-1.5 text-xs text-primary" title="Edit">✎</button>
                        )}
                        {onDelete && (
                          <button onClick={() => onDelete(row)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border p-1.5 text-xs text-danger" title="Delete">✕</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-text-secondary">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border p-1.5"
            >
              <HiOutlineChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${i === page ? 'bg-primary text-white' : 'text-text-secondary hover:bg-border'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border p-1.5"
            >
              <HiOutlineChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
