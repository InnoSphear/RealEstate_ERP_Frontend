import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineUserGroup, HiOutlinePlus } from 'react-icons/hi2';
import API from '../../api/axios';
import { toast } from '../../components/Toast';

const statusColors = {
  not_started: 'bg-stone-100 text-stone-700 ring-1 ring-stone-200',
  running: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
};

export default function InteriorDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    API.get('/interior-projects/dashboard')
      .then((res) => setData(res.data))
      .catch(() => toast('Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const formatCurrency = (val) => `₹${(val || 0).toLocaleString()}`;

  const statusLabel = (s) => s ? s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>;
  }

  const summary = data?.summary || {};
  const statusCounts = data?.status_counts || {};
  const projects = data?.projects || [];

  const totalCost = summary.total_cost || 0;
  const totalContract = summary.total_contract || 0;
  const totalReceived = summary.total_received || 0;
  const totalProfitLoss = summary.total_profit_loss || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Interior Work Dashboard</h1>
          <p className="text-stone-500 mt-1">Flat-wise profit/loss, pending client balance, material cost &amp; payment summary</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/interior-projects/new')} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
            <HiOutlinePlus size={16} /> New Flat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200">
          <HiOutlineCurrencyDollar size={20} className="text-emerald-600 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Total Contract</p>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(totalContract)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
          <HiOutlineShoppingCart size={20} className="text-blue-600 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700/70">Total Cost</p>
          <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(totalCost)}</p>
          <p className="text-xs text-blue-600/60 mt-0.5">Material: {formatCurrency(summary.total_material)} | Other: {formatCurrency(summary.total_other_cost)}</p>
        </div>
        <div className={`p-5 rounded-2xl bg-gradient-to-br border ${totalProfitLoss >= 0 ? 'from-emerald-50 to-emerald-100/50 border-emerald-200' : 'from-red-50 to-red-100/50 border-red-200'}`}>
          <HiOutlineChartBar size={20} className={totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'} />
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500/70">Profit / Loss</p>
          <p className={`text-2xl font-bold mt-1 ${totalProfitLoss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>{formatCurrency(totalProfitLoss)}</p>
        </div>
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200">
          <HiOutlineUserGroup size={20} className="text-amber-600 mb-2" />
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">Client Balance</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">{formatCurrency(summary.total_balance)}</p>
          <p className="text-xs text-amber-600/60 mt-0.5">Received: {formatCurrency(totalReceived)}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider self-center">Status:</span>
        {['not_started', 'running', 'on_hold', 'completed', 'closed'].map((s) => (
          <span key={s} className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${statusColors[s]}`}>
            {statusLabel(s)} <span className="font-bold">{statusCounts[s] || 0}</span>
          </span>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Flat ID</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Contract</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Material</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Other Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Total Cost</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Received</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Balance</th>
                <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Profit / Loss</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => {
                const totalCost = (p.material_cost || 0) + (p.other_cost || 0);
                const balance = (p.contract_amount || 0) - (p.received_amount || 0);
                const profitLoss = (p.contract_amount || 0) - totalCost;
                return (
                  <tr key={p._id} onClick={() => navigate(`/interior-projects/${p._id}`)} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-stone-900">{p.flat_id || p.project_code || '-'}</td>
                    <td className="px-4 py-3 text-stone-700">{p.client_id?.full_name || '-'}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[p.status] || statusColors.not_started}`}>{statusLabel(p.status)}</span></td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900">{formatCurrency(p.contract_amount)}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{formatCurrency(p.material_cost)}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{formatCurrency(p.other_cost)}</td>
                    <td className="px-4 py-3 text-right text-blue-700 font-medium">{formatCurrency(totalCost)}</td>
                    <td className="px-4 py-3 text-right text-stone-700">{formatCurrency(p.received_amount)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{formatCurrency(balance)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${profitLoss >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(profitLoss)}</td>
                  </tr>
                );
              })}
              {projects.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-10 text-center text-stone-400">No interior projects found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Cost Breakdown</p>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between text-sm"><span className="text-stone-600">Material</span><span className="font-semibold text-stone-900">{formatCurrency(summary.total_material)}</span></div>
              <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-blue-500" style={{ width: `${totalCost > 0 ? ((summary.total_material || 0) / totalCost) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span className="text-stone-600">Labour / Other</span><span className="font-semibold text-stone-900">{formatCurrency(summary.total_other_cost)}</span></div>
              <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${totalCost > 0 ? ((summary.total_other_cost || 0) / totalCost) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-semibold"><span className="text-stone-800">Total Cost</span><span className="text-blue-800">{formatCurrency(totalCost)}</span></div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Payment Summary</p>
          <div className="mt-3 space-y-3">
            <div>
              <div className="flex justify-between text-sm"><span className="text-stone-600">Received</span><span className="font-semibold text-emerald-700">{formatCurrency(totalReceived)}</span></div>
              <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${totalContract > 0 ? (totalReceived / totalContract) * 100 : 0}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm"><span className="text-stone-600">Pending</span><span className="font-semibold text-amber-700">{formatCurrency(summary.total_balance)}</span></div>
              <div className="mt-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-amber-500" style={{ width: `${totalContract > 0 ? ((summary.total_balance || 0) / totalContract) * 100 : 0}%` }} />
              </div>
            </div>
            <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-semibold"><span className="text-stone-800">Total Contract</span><span className="text-stone-900">{formatCurrency(totalContract)}</span></div>
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-stone-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Project Count by Status</p>
          <div className="mt-3 space-y-2">
            {['not_started', 'running', 'on_hold', 'completed', 'closed'].map((s) => (
              <div key={s} className="flex justify-between text-sm">
                <span className="text-stone-600">{statusLabel(s)}</span>
                <span className="font-bold text-stone-900">{statusCounts[s] || 0}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-stone-100 flex justify-between text-sm font-semibold"><span className="text-stone-800">Total</span><span className="text-stone-900">{projects.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
