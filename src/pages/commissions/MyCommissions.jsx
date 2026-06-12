import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import { HiOutlineCurrencyDollar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi2';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function MyCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await API.get(`/commissions/my${params}`);
      setCommissions(res.data.commissions);
      setTotals(res.data.totals || []);
    } catch (err) {
      console.error('Failed to load commissions', err);
    } finally {
      setLoading(false);
    }
  };

  const totalPending = (totals.find((t) => t._id === 'pending')?.total || 0).toLocaleString();
  const totalApproved = (totals.find((t) => t._id === 'approved')?.total || 0).toLocaleString();
  const totalPaid = (totals.find((t) => t._id === 'paid')?.total || 0).toLocaleString();
  const totalAll = (totals.reduce((s, t) => s + t.total, 0)).toLocaleString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Commissions</h1>
        <p className="text-stone-500 mt-1">View your commission history and earnings</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Earnings" value={totalAll} icon={HiOutlineCurrencyDollar} color="primary" />
        <StatsCard title="Pending" value={totalPending} icon={HiOutlineClock} color="warning" />
        <StatsCard title="Approved" value={totalApproved} icon={HiOutlineCheckCircle} color="success" />
        <StatsCard title="Paid" value={totalPaid} icon={HiOutlineXCircle} color="info" />
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-stone-700">Filter:</span>
        {['', 'pending', 'approved', 'paid', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              statusFilter === s
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-400">Loading...</div>
        ) : commissions.length === 0 ? (
          <div className="p-8 text-center text-stone-400">No commissions found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Type</th>
                  <th className="text-right px-4 py-3 font-semibold text-stone-600">Amount</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Source</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Paid At</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c) => (
                  <tr key={c._id} className="border-b border-stone-100 hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-stone-700">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-stone-700">{c.commission_type}</span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      ₹{c.commission_amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className="capitalize text-stone-700">{c.source}</span>
                    </td>
                    <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">
                      {c.source_description || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium border ${statusStyles[c.status] || ''}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
