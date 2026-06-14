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
  selectable,
  selectedIds = [],
  onSelectionChange,
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
      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
      {(title || searchable) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 border-b border-stone-100">
          {title && <h3 className="text-base font-semibold text-stone-900">{title}</h3>}
          {searchable && (
            <div className="relative w-full sm:w-64">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors pl-10"
              />
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50/50">
              {selectable && (
                <th className="px-5 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < data.length}
                    onChange={(e) => onSelectionChange?.(e.target.checked ? data.map((r) => r._id) : [])}
                    className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.accessor || col.header}
                  className={`px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer select-none' : ''}`}
                  onClick={() => col.sortable !== false && handleSort(col.accessor)}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable !== false && col.accessor && (
                      <HiOutlineChevronUpDown size={13} className={`transition-colors ${sortField === col.accessor ? 'text-stone-900' : 'text-stone-300'}`} />
                    )}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0) + (onEdit || onDelete || onView ? 1 : 0)} className="px-5 py-14 text-center text-stone-400">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-2xl">—</span>
                    <span className="text-sm">No data found</span>
                  </div>
                </td>
              </tr>
            ) : (
              paged.map((row, i) => {
                const checked = selectedIds.includes(row._id)
                return (
                <tr
                  key={row._id || i}
                  onClick={() => onView?.(row)}
                  className={`border-b border-stone-100 hover:bg-stone-50/50 transition-colors ${onView ? 'cursor-pointer' : ''}`}>
                  {selectable && (
                    <td className="px-5 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onSelectionChange?.(
                          checked ? selectedIds.filter((id) => id !== row._id) : [...selectedIds, row._id]
                        )}
                        className="rounded border-stone-300 text-stone-900 focus:ring-stone-900 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.accessor || col.header} className="px-5 py-3.5 text-stone-700">
                      {col.render ? col.render(row) : row[col.accessor] ?? '-'}
                    </td>
                  ))}
                  {(onEdit || onDelete || onView) && (
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onView && (
                          <button onClick={(e) => { e.stopPropagation(); onView(row); }} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all" title="View">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          </button>
                        )}
                        {onEdit && (
                          <button onClick={(e) => { e.stopPropagation(); onEdit(row); }} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all" title="Edit">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                          </button>
                        )}
                        {onDelete && (
                          <button onClick={(e) => { e.stopPropagation(); onDelete(row); }} className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-stone-100">
          <p className="text-xs text-stone-500">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${i === page ? 'bg-stone-900 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <HiOutlineChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
