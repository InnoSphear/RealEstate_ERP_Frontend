import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import API from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineUsers,
  HiOutlineFire,
  HiOutlineSun,
  HiOutlineCloud,
  HiOutlineUserGroup,
  HiOutlineHome,
  HiOutlineBuildingOffice,
  HiOutlineCurrencyDollar,
  HiOutlineReceiptPercent,
  HiOutlineArrowTrendingUp,
  HiOutlineCreditCard,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckBadge,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function formatTime(str) {
  if (!str) return '';
  return new Date(str).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmt(val) {
  return val != null ? `\u20B9${Number(val).toLocaleString()}` : '\u20B90';
}

function trendEl(stats, key) {
  const t = stats?.trends?.[key];
  if (t === undefined || t === null) return null;
  const up = t >= 0;
  const color = up ? 'text-emerald-600' : 'text-red-600';
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {up ? '\u2191' : '\u2193'} {Math.abs(t).toFixed(1)}%
    </span>
  );
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isEmployee = !hasRole('admin', 'manager');

  useEffect(() => {
    API.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-200 flex items-center gap-3">
          <HiOutlineExclamationCircle size={24} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (isEmployee) {
    return <EmployeeDashboard stats={stats} />;
  }

  return <AdminDashboard stats={stats} />;
}

function EmployeeDashboard({ stats }) {
  const leads = stats?.leads || {};
  const followUps = stats?.todayFollowUps || [];
  const recentActivities = stats?.recentActivities || [];
  const todayAtt = stats?.todayAttendance;
  const [recentCommissions, setRecentCommissions] = useState([]);

  useEffect(() => {
    API.get('/commissions/my')
      .then((res) => setRecentCommissions((res.data.commissions || []).slice(0, 5)))
      .catch(() => {});
  }, []);

  const cards = [
    { title: 'Assigned Leads', value: leads.total || 0, icon: HiOutlineUsers, color: 'primary' },
    { title: 'Hot Leads', value: leads.hot || 0, icon: HiOutlineFire, color: 'danger' },
    { title: 'Warm Leads', value: leads.warm || 0, icon: HiOutlineSun, color: 'warning' },
    { title: 'Cold Leads', value: leads.cold || 0, icon: HiOutlineCloud, color: 'info' },
    { title: 'Today Follow Ups', value: followUps.length, icon: HiOutlineCalendarDays, color: 'warning' },
    {
      title: 'Today Attendance',
      value: todayAtt ? todayAtt.status?.replace('_', ' ') : 'Not Marked',
      icon: todayAtt ? HiOutlineCheckBadge : HiOutlineXCircle,
      color: todayAtt ? 'success' : 'danger',
    },
    { title: 'Pending Leaves', value: stats?.pendingLeaves || 0, icon: HiOutlineClock, color: 'warning' },
    { title: 'Pending Commission', value: fmt(stats?.commission), icon: HiOutlineCurrencyDollar, color: 'warning' },
    { title: 'Commission Paid', value: fmt(stats?.commission_paid), icon: HiOutlineCheckBadge, color: 'success' },
  ];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Dashboard</h1>
        <p className="text-stone-500 mt-1">Your personal overview</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">My Follow Ups Today</h3>
          {followUps.length > 0 ? (
            <div className="space-y-1">
              {followUps.map((fu) => (
                <div key={fu._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">
                      {fu.lead?.full_name || fu.client?.full_name || 'Follow Up'}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {fu.lead && <span>Lead: {fu.lead.full_name}</span>}
                      {fu.client && <span>Client: {fu.client.full_name}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <p className="text-xs font-semibold text-stone-600">{formatDate(fu.follow_up_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No follow ups today</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">My Recent Activity</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div className="p-2 rounded-lg bg-stone-100 text-stone-500 mt-0.5 shrink-0">
                    <HiOutlineClock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-800">{act.description || act.action}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(act.createdAt)} {formatTime(act.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {stats?.todayAttendance && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Today's Attendance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-stone-500">Status</p>
              <p className="text-sm font-semibold text-stone-800 capitalize">{stats.todayAttendance.status?.replace('_', ' ')}</p>
            </div>
            {stats.todayAttendance.check_in && (
              <div>
                <p className="text-xs text-stone-500">Check In</p>
                <p className="text-sm font-semibold text-stone-800">{formatTime(stats.todayAttendance.check_in)}</p>
              </div>
            )}
            {stats.todayAttendance.check_out && (
              <div>
                <p className="text-xs text-stone-500">Check Out</p>
                <p className="text-sm font-semibold text-stone-800">{formatTime(stats.todayAttendance.check_out)}</p>
              </div>
            )}
            {stats.todayAttendance.working_hours > 0 && (
              <div>
                <p className="text-xs text-stone-500">Hours</p>
                <p className="text-sm font-semibold text-stone-800">{stats.todayAttendance.working_hours.toFixed(1)}h</p>
              </div>
            )}
          </div>
        </div>
      )}

      {recentCommissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Recent Commissions</h3>
            <NavLink to="/my-commissions" className="text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors">
              View All
            </NavLink>
          </div>
          <div className="space-y-1">
            {recentCommissions.map((c) => (
              <div key={c._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-800">₹{c.commission_amount?.toLocaleString()}</p>
                  <p className="text-xs text-stone-400 mt-0.5">{c.source_description || c.source} · {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${
                  c.status === 'paid' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  c.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  c.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ stats }) {
  const cards = [
    { title: 'Total Leads', value: stats?.leads?.total, icon: HiOutlineUsers, color: 'primary', subtitle: trendEl(stats, 'totalLeads') },
    { title: 'Hot Leads', value: stats?.leads?.hot, icon: HiOutlineFire, color: 'danger', subtitle: trendEl(stats, 'hotLeads') },
    { title: 'Warm Leads', value: stats?.leads?.warm, icon: HiOutlineSun, color: 'warning', subtitle: trendEl(stats, 'warmLeads') },
    { title: 'Cold Leads', value: stats?.leads?.cold, icon: HiOutlineCloud, color: 'info', subtitle: trendEl(stats, 'coldLeads') },
    { title: 'Total Clients', value: stats?.totalClients, icon: HiOutlineUserGroup, color: 'success', subtitle: trendEl(stats, 'totalClients') },
    { title: 'Total Properties', value: stats?.totalProperties, icon: HiOutlineHome, color: 'primary', subtitle: trendEl(stats, 'totalProperties') },
    { title: 'Total Projects', value: stats?.totalProjects, icon: HiOutlineBuildingOffice, color: 'info', subtitle: trendEl(stats, 'totalProjects') },
    { title: 'Revenue', value: fmt(stats?.revenue), icon: HiOutlineCurrencyDollar, color: 'success', subtitle: trendEl(stats, 'revenue') },
    { title: 'Expenses', value: fmt(stats?.expenses), icon: HiOutlineReceiptPercent, color: 'warning', subtitle: trendEl(stats, 'expenses') },
    { title: 'Profit', value: fmt(stats?.profit), icon: HiOutlineArrowTrendingUp, color: 'success', subtitle: trendEl(stats, 'profit') },
    { title: 'Pending Payments', value: fmt(stats?.pendingPayments?.total), icon: HiOutlineCreditCard, color: 'danger', subtitle: trendEl(stats, 'pendingPayments') },
    { title: 'Upcoming Follow Ups', value: stats?.todayFollowUps?.length ?? 0, icon: HiOutlineCalendarDays, color: 'warning', subtitle: trendEl(stats, 'upcomingFollowUps') },
  ];

  const leadDistribution = stats?.leads ? [
    { name: 'Hot', value: stats.leads.hot },
    { name: 'Warm', value: stats.leads.warm },
    { name: 'Cold', value: stats.leads.cold },
  ].filter((l) => l.value > 0) : [];

  const monthlyData = stats?.monthlyData || [];
  const recentActivities = stats?.recentActivities || [];
  const followUps = stats?.todayFollowUps || [];
  const employeePerformance = stats?.topEmployees || [];
  const revenueTrend = stats?.revenueTrend || [];

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Dashboard</h1>
        <p className="text-stone-500 mt-1">Overview of your real estate & interior business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Lead Status Distribution</h3>
          {leadDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={leadDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {leadDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-stone-400 text-center py-12">No lead data available</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Monthly Revenue vs Expenses</h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <Tooltip />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#f59e0b" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-stone-400 text-center py-12">No monthly data available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Recent Activities</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div className="p-2 rounded-lg bg-stone-100 text-stone-500 mt-0.5 shrink-0">
                    <HiOutlineClock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-800">{act.description || act.message}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {act.user && <span className="font-medium text-stone-500">{act.user.full_name || act.user} · </span>}
                      {formatDate(act.createdAt)} {formatTime(act.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No recent activities</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Upcoming Follow Ups</h3>
          {followUps.length > 0 ? (
            <div className="space-y-1">
              {followUps.map((fu) => (
                <div key={fu._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 truncate">{fu.title || (fu.lead?.full_name || fu.lead) || (fu.client?.full_name || fu.client) || 'Follow Up'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {fu.assigned_to && <span>Assigned to: {fu.assigned_to?.full_name || fu.assigned_to}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <p className="text-xs font-semibold text-stone-600">{formatDate(fu.follow_up_date || fu.date)}</p>
                    {fu.status && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-600">
                        {fu.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No upcoming follow ups</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Employee Performance</h3>
          {employeePerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={employeePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#a8a29e" width={80} />
                <Tooltip />
                <Bar dataKey="deals" fill="#6366f1" name="Deals Closed" radius={[0, 4, 4, 0]} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue Generated" radius={[0, 4, 4, 0]} hide />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-stone-400 text-center py-12">No performance data</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Revenue Trend</h3>
          {revenueTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <YAxis tick={{ fontSize: 12 }} stroke="#a8a29e" />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} dot={{ r: 4, fill: '#6366f1' }} name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-stone-400 text-center py-12">No revenue trend data</p>
          )}
        </div>
      </div>
    </div>
  );
}