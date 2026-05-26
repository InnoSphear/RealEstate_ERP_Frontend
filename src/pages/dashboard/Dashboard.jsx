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
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
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
        <h1 className="text-2xl font-bold text-text">Dashboard</h1>
        <p className="text-text-secondary">Overview of your real estate & interior business</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Recent Sales</h3>
          {stats?.recentSales?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentSales.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text">{sale.sale_code || 'N/A'}</p>
                    <p className="text-xs text-text-secondary">₹{(sale.sale_price || 0).toLocaleString()}</p>
                  </div>
                  <span className="bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{sale.status?.replace('_', ' ')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No recent sales</p>
          )}
        </div>

        <div className="bg-surface rounded-xl border border-border shadow-sm p-6">
          <h3 className="text-lg font-semibold text-text mb-4">Recent Invoices</h3>
          {stats?.recentInvoices?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentInvoices.map((inv) => (
                <div key={inv._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text">{inv.invoice_number || 'N/A'}</p>
                    <p className="text-xs text-text-secondary">₹{(inv.total_amount || 0).toLocaleString()}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.status === 'paid' ? 'bg-green-100 text-green-800' : inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No recent invoices</p>
          )}
        </div>
      </div>
    </div>
  );
}
