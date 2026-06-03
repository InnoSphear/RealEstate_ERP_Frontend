import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatsCard from '../../components/StatsCard';
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
} from 'react-icons/hi2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#ec4899'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err?.response?.data?.message || 'Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-stone-900 border-t-transparent dark:border-stone-100" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-6 py-4 rounded-xl border border-red-200 dark:border-red-800 flex items-center gap-3">
          <HiOutlineExclamationCircle size={24} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    );
  }

  const trendEl = (key) => {
    const t = stats?.trends?.[key];
    if (t === undefined || t === null) return null;
    const up = t >= 0;
    const color = up ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
    return (
      <span className={`text-xs font-semibold ${color}`}>
        {up ? '\u2191' : '\u2193'} {Math.abs(t).toFixed(1)}%
      </span>
    );
  };

  const fmt = (val) => (val != null ? `\u20B9${Number(val).toLocaleString()}` : '\u20B90');

  const cards = [
    { title: 'Total Leads', value: stats?.totalLeads, icon: HiOutlineUsers, color: 'primary', subtitle: trendEl('totalLeads') },
    { title: 'Hot Leads', value: stats?.hotLeads, icon: HiOutlineFire, color: 'danger', subtitle: trendEl('hotLeads') },
    { title: 'Warm Leads', value: stats?.warmLeads, icon: HiOutlineSun, color: 'warning', subtitle: trendEl('warmLeads') },
    { title: 'Cold Leads', value: stats?.coldLeads, icon: HiOutlineCloud, color: 'info', subtitle: trendEl('coldLeads') },
    { title: 'Total Clients', value: stats?.totalClients, icon: HiOutlineUserGroup, color: 'success', subtitle: trendEl('totalClients') },
    { title: 'Total Properties', value: stats?.totalProperties, icon: HiOutlineHome, color: 'primary', subtitle: trendEl('totalProperties') },
    { title: 'Total Projects', value: stats?.totalProjects, icon: HiOutlineBuildingOffice, color: 'info', subtitle: trendEl('totalProjects') },
    { title: 'Revenue', value: fmt(stats?.revenue), icon: HiOutlineCurrencyDollar, color: 'success', subtitle: trendEl('revenue') },
    { title: 'Expenses', value: fmt(stats?.expenses), icon: HiOutlineReceiptPercent, color: 'warning', subtitle: trendEl('expenses') },
    { title: 'Profit', value: fmt(stats?.profit), icon: HiOutlineArrowTrendingUp, color: 'success', subtitle: trendEl('profit') },
    { title: 'Pending Payments', value: fmt(stats?.pendingPayments), icon: HiOutlineCreditCard, color: 'danger', subtitle: trendEl('pendingPayments') },
    { title: 'Upcoming Follow Ups', value: stats?.upcomingFollowUps, icon: HiOutlineCalendarDays, color: 'warning', subtitle: trendEl('upcomingFollowUps') },
  ];

  const leadDistribution = stats?.leadStatusDistribution || [];
  const monthlyData = stats?.monthlyData || [];
  const recentActivities = stats?.recentActivities || [];
  const followUps = stats?.followUps || [];
  const employeePerformance = stats?.employeePerformance || [];
  const revenueTrend = stats?.revenueTrend || [];

  const formatDate = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatTime = (str) => {
    if (!str) return '';
    const d = new Date(str);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">Dashboard</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1">Overview of your real estate &amp; interior business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Lead Status Distribution</h3>
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
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">No lead data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Monthly Revenue vs Expenses</h3>
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
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">No monthly data available</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Recent Activities</h3>
          {recentActivities.length > 0 ? (
            <div className="space-y-1">
              {recentActivities.map((act) => (
                <div key={act._id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors -mx-3">
                  <div className="p-2 rounded-lg bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 mt-0.5 shrink-0">
                    <HiOutlineClock size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-800 dark:text-stone-200">{act.action || act.message}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      {act.user && <span className="font-medium text-stone-500 dark:text-stone-400">{act.user.full_name || act.user.name || act.user} &middot; </span>}
                      {formatDate(act.timestamp || act.createdAt)} {formatTime(act.timestamp || act.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-8">No recent activities</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Upcoming Follow Ups</h3>
          {followUps.length > 0 ? (
            <div className="space-y-1">
              {followUps.map((fu) => (
                <div key={fu._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors -mx-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{fu.title || (fu.lead?.full_name || fu.lead?.name || fu.lead) || (fu.client?.full_name || fu.client?.name || fu.client) || 'Follow Up'}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      {fu.assigned_to && <span>Assigned to: {fu.assigned_to?.full_name || fu.assigned_to?.name || fu.assigned_to}</span>}
                    </p>
                  </div>
                  <div className="shrink-0 ml-4 text-right">
                    <p className="text-xs font-semibold text-stone-600 dark:text-stone-400">{formatDate(fu.follow_up_date || fu.date)}</p>
                    {fu.status && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 dark:bg-stone-700 text-stone-600 dark:text-stone-400">
                        {fu.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-8">No upcoming follow ups</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Employee Performance</h3>
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
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">No performance data</p>
          )}
        </div>

        <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-6">
          <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100 mb-5">Revenue Trend</h3>
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
            <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-12">No revenue trend data</p>
          )}
        </div>
      </div>
    </div>
  );
}
