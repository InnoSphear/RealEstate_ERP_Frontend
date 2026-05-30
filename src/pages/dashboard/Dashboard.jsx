import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import {
  HiOutlineHome, HiOutlineUserGroup, HiOutlineCurrencyDollar,
  HiOutlineReceiptPercent, HiOutlineClipboardDocumentList,
  HiOutlineChartBar, HiOutlineBuildingOffice, HiOutlineUsers
} from 'react-icons/hi2';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard/stats')
      .then((res) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  const cards = [
    { title: 'Active Projects', value: stats?.activeProjects, icon: HiOutlineHome, color: 'primary' },
    { title: 'Active Listings', value: stats?.activeListings, icon: HiOutlineBuildingOffice, color: 'info' },
    { title: 'Total Clients', value: stats?.totalClients, icon: HiOutlineUserGroup, color: 'success' },
    { title: 'Total Invoiced', value: stats?.totalInvoiced ? `₹${(stats.totalInvoiced).toLocaleString()}` : '₹0', icon: HiOutlineCurrencyDollar, color: 'warning' },
    { title: 'Total Collected', value: stats?.totalCollected ? `₹${(stats.totalCollected).toLocaleString()}` : '₹0', icon: HiOutlineReceiptPercent, color: 'success' },
    { title: 'Outstanding', value: stats?.outstanding ? `₹${(stats.outstanding).toLocaleString()}` : '₹0', icon: HiOutlineChartBar, color: 'danger' },
    { title: 'Approved Expenses', value: stats?.approvedExpenses ? `₹${(stats.approvedExpenses).toLocaleString()}` : '₹0', icon: HiOutlineClipboardDocumentList, color: 'warning' },
    { title: 'Total Users', value: stats?.totalUsers, icon: HiOutlineUsers, color: 'primary' },
  ];

  return (
    <div className="space-y-6">
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
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Recent Sales</h3>
          {stats?.recentSales?.length > 0 ? (
            <div className="space-y-1">
              {stats.recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{sale.sale_code || 'N/A'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">₹{(sale.sale_price || 0).toLocaleString()}</p>
                  </div>
                  <span className="bg-stone-100 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{sale.status?.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No recent sales</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Recent Invoices</h3>
          {stats?.recentInvoices?.length > 0 ? (
            <div className="space-y-1">
              {stats.recentInvoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{inv.invoice_number || 'N/A'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">₹{(inv.total_amount || 0).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : inv.status === 'overdue' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-stone-400 text-center py-8">No recent invoices</p>
          )}
        </div>
      </div>
    </div>
  );
}
