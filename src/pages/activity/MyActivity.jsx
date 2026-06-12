import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import { useAuth } from '../../contexts/AuthContext';

const typeColors = {
  auth: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  crud: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  system: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
  login: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  logout: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  error: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const severityDots = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  critical: 'bg-red-600',
};

export default function MyActivity() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: '', resource: '', from_date: '', to_date: '', search: '' });

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    const endpoint = hasRole('admin', 'manager') ? `/activity-logs${qs ? `?${qs}` : ''}` : `/activity-logs/my${qs ? `?${qs}` : ''}`;
    API.get(endpoint)
      .then((res) => setData(res.data.logs || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filters]);

  const columns = [
    {
      header: 'Severity',
      render: (r) => <div className={`w-2 h-2 rounded-full ${severityDots[r.severity] || 'bg-stone-300'}`} />,
    },
    { header: 'Action', accessor: 'action' },
    { header: 'Resource', render: (r) => r.resource || '-' },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Type',
      render: (r) => <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[r.type] || typeColors.auth}`}>{r.type}</span>,
    },
    {
      header: 'Date',
      render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleString() : '-',
    },
  ];

  if (!hasRole('admin', 'manager')) {
    columns.splice(1, 0, { header: 'User', render: (r) => r.user?.full_name || '-' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Activity</h1>
        <p className="text-stone-500 mt-1">Your personal activity history</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
        />
        <input
          type="text"
          placeholder="Filter by resource..."
          value={filters.resource}
          onChange={(e) => setFilters({ ...filters, resource: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
        />
        <input
          type="date"
          value={filters.from_date}
          onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.to_date}
          onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          placeholder="To"
        />
        <input
          type="text"
          placeholder="Search..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors w-48"
        />
      </div>

      <DataTable columns={columns} data={data} loading={loading} searchable={false} />
    </div>
  );
}