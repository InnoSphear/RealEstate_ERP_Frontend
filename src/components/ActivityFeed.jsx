import { HiOutlineClock } from 'react-icons/hi2';

const ACTION_COLORS = {
  created: 'text-emerald-600 bg-emerald-50',
  updated: 'text-blue-600 bg-blue-50',
  deleted: 'text-red-600 bg-red-50',
  login: 'text-emerald-600 bg-emerald-50',
  logout: 'text-rose-600 bg-rose-50',
  viewed: 'text-stone-600 bg-stone-50',
  approved: 'text-emerald-600 bg-emerald-50',
  rejected: 'text-red-600 bg-red-50',
  imported: 'text-purple-600 bg-purple-50',
  exported: 'text-indigo-600 bg-indigo-50',
};

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

function getInitials(name) {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}

function getRoleColor(role) {
  return ROLE_COLORS[role] || { bg: '#a8a29e', text: '#ffffff' };
}

function getActionColor(action) {
  if (!action) return 'text-stone-600 bg-stone-50';
  const key = Object.keys(ACTION_COLORS).find(k => action.toLowerCase().includes(k));
  return ACTION_COLORS[key] || 'text-stone-600 bg-stone-50';
}

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ActivityFeed({ activities, showUser = true, maxHeight }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="text-sm text-stone-400 text-center py-8">No activity yet</div>
    );
  }

  return (
    <div className="space-y-1" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>
      {activities.map((act) => {
        const user = act.user || {};
        const userName = act.user_name || user.full_name || 'Unknown';
        const userRole = act.user_role || user.role_slug || '';
        const roleColor = getRoleColor(userRole);
        const actionColor = getActionColor(act.action);

        return (
          <div key={act._id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
            {showUser ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: roleColor.bg, color: roleColor.text }}
                title={`${userName} (${userRole || 'No role'})`}
              >
                {getInitials(userName)}
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-stone-100 text-stone-500 mt-0.5 shrink-0">
                <HiOutlineClock size={16} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                {showUser && (
                  <span className="font-semibold text-stone-900 text-sm">{userName}</span>
                )}
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${actionColor}`}>
                  {act.action}
                </span>
              </div>
              <p className="text-sm text-stone-600 mt-0.5">{act.description || act.message}</p>
              <p className="text-xs text-stone-400 mt-1">
                {formatDate(act.createdAt)}
                {userRole && <span className="ml-1.5 text-stone-300">·</span>}
                {userRole && (
                  <span className="ml-1.5 capitalize text-stone-400">{userRole.replace(/_/g, ' ')}</span>
                )}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
