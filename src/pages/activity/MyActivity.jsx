import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import ActivityFeed from '../../components/ActivityFeed';
import { useAuth } from '../../contexts/AuthContext';

const ROLE_COLORS = {
  admin: { bg: '#6366f1', text: '#ffffff' },
  manager: { bg: '#f59e0b', text: '#ffffff' },
  telecaller: { bg: '#10b981', text: '#ffffff' },
  sales_executive: { bg: '#3b82f6', text: '#ffffff' },
  accounts: { bg: '#8b5cf6', text: '#ffffff' },
  receptionist: { bg: '#ec4899', text: '#ffffff' },
  agent: { bg: '#22c55e', text: '#ffffff' },
  interior_manager: { bg: '#14b8a6', text: '#ffffff' },
  junior_interior_manager: { bg: '#06b6d4', text: '#ffffff' },
};

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

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getRoleColor(role) {
  return ROLE_COLORS[role] || { bg: '#a8a29e', text: '#ffffff' };
}

export default function MyActivity() {
  const { hasRole } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ action: '', resource: '', from_date: '', to_date: '', search: '', search_user: '' });
  const [viewMode, setViewMode] = useState('table');

  const isAdmin = hasRole('admin', 'manager');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    const endpoint = isAdmin ? `/activity-logs${qs ? `?${qs}` : ''}` : `/activity-logs/my${qs ? `?${qs}` : ''}`;
    API.get(endpoint)
      .then((res) => {
        const logs = res.data.logs || res.data;
        setData(Array.isArray(logs) ? logs : []);
      })
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filters]);

  useEffect(() => {
    if (isAdmin) {
      API.get('/users?limit=500')
        .then((res) => {
          const list = res.data.users || res.data || [];
          setUsers(Array.isArray(list) ? list : []);
        })
        .catch(() => {});
    }
  }, []);

  const columns = [
    {
      header: 'Severity',
      render: (r) => <div className={`w-2 h-2 rounded-full ${severityDots[r.severity] || 'bg-stone-300'}`} />,
    },
    {
      header: 'User',
      render: (r) => {
        const u = r.user || {};
        const userName = r.user_name || u.full_name || '-';
        const userRole = r.user_role || u.role_slug || '';
        const roleColor = getRoleColor(userRole);
        return (
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
              title={`${userName} (${userRole || 'No role'})`}
            >
              {getInitials(userName)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate">{userName}</p>
              {userRole && (
                <p className="text-[10px] uppercase tracking-wider text-stone-400">{userRole.replace(/_/g, ' ')}</p>
              )}
            </div>
          </div>
        );
      },
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

  if (!isAdmin) {
    const userColIdx = columns.findIndex(c => c.header === 'User');
    if (userColIdx >= 0) columns.splice(userColIdx, 1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Activity Log</h1>
          <p className="text-stone-500 mt-1">{isAdmin ? 'All system activity' : 'Your personal activity history'}</p>
        </div>
        <div className="flex items-center gap-2 bg-stone-100 rounded-xl p-1">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'table' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('feed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'feed' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
          >
            Feed
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {isAdmin && (
          <select
            value={filters.search_user}
            onChange={(e) => setFilters({ ...filters, search_user: e.target.value })}
            className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors min-w-[180px]"
          >
            <option value="">All Users</option>
            {users.map((u) => (
              <option key={u._id} value={u.full_name}>{u.full_name}</option>
            ))}
          </select>
        )}
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

      {viewMode === 'table' ? (
        <DataTable columns={columns} data={data} loading={loading} searchable={false} />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
            </div>
          ) : (
            <ActivityFeed activities={data} showUser={true} />
          )}
        </div>
      )}
    </div>
  );
}
