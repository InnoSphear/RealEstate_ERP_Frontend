import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatsCard from '../../components/StatsCard';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { HiOutlineCurrencyDollar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineXCircle } from 'react-icons/hi2';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  paid: 'bg-blue-50 text-blue-700 border-blue-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};
const sourceOptions = ['sale', 'rent', 'service', 'brokerage', 'interior', 'referral', 'other'];

export default function MyCommissions() {
  const [commissions, setCommissions] = useState([]);
  const [totals, setTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [requestModal, setRequestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [interiorProjects, setInteriorProjects] = useState([]);
  const [form, setForm] = useState({
    commission_type: 'fixed', commission_value: '', percentage_rate: '',
    source: 'sale', source_description: '', client_id: '', property_id: '', amount_basis: '',
    source_id: ''
  });

  useEffect(() => {
    fetchCommissions();
  }, [statusFilter]);

  const fetchCommissions = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await API.get(`/commissions/my${params}`);
      setCommissions(res.data.commissions);
      setTotals(res.data.totals || []);
    } catch { /* ignore fetch errors */
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setForm({
    commission_type: 'fixed', commission_value: '', percentage_rate: '',
    source: 'sale', source_description: '', client_id: '', property_id: '', amount_basis: '',
    source_id: ''
  });

  const openRequest = async () => {
    resetForm();
    try {
      const [cRes, pRes, iRes] = await Promise.all([
        API.get('/clients'),
        API.get('/properties'),
        API.get('/interior-projects'),
      ]);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
      setProperties(Array.isArray(pRes.data) ? pRes.data : []);
      setInteriorProjects(Array.isArray(iRes.data) ? iRes.data : []);
    } catch { /* ignore */ }
    setRequestModal(true);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        commission_value: form.commission_value !== '' ? Number(form.commission_value) : undefined,
        percentage_rate: form.percentage_rate !== '' ? Number(form.percentage_rate) : undefined,
        amount_basis: form.amount_basis !== '' ? Number(form.amount_basis) : undefined,
        source_id: form.source_id || undefined,
      };
      await API.post('/commissions/request', payload);
      toast('Commission request submitted');
      setRequestModal(false);
      fetchCommissions();
    } catch (err) {
      toast(err.response?.data?.message || 'Error submitting request', 'error');
    }
  };

  const totalPending = (totals.find((t) => t._id === 'pending')?.total || 0).toLocaleString();
  const totalApproved = (totals.find((t) => t._id === 'approved')?.total || 0).toLocaleString();
  const totalPaid = (totals.find((t) => t._id === 'paid')?.total || 0).toLocaleString();
  const totalAll = (totals.filter((t) => t._id !== 'cancelled').reduce((s, t) => s + t.total, 0)).toLocaleString();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Commissions</h1>
          <p className="text-stone-500 mt-1">View your commission history and earnings</p>
        </div>
        <button onClick={openRequest} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Request Commission</button>
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
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Approved By</th>
                  <th className="text-left px-4 py-3 font-semibold text-stone-600">Payment Mode</th>
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
                      {c.approved_by?.full_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {c.status === 'paid' && c.payment_mode ? (
                        <span className="text-xs">{c.payment_mode?.replace(/_/g, ' ')}</span>
                      ) : '-'}
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

      <Modal isOpen={requestModal} onClose={() => setRequestModal(false)} title="Request Commission" size="lg">
        <form onSubmit={handleRequest} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Commission Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
                <option value="fixed">Fixed</option>
                <option value="percentage">Percentage</option>
              </select>
            </div>
            {form.commission_type === 'fixed' && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} required />
              </div>
            )}
            {form.commission_type === 'percentage' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Percentage Rate (%) *</label>
                  <input type="number" step="0.01" min="0" max="100" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.percentage_rate} onChange={(e) => setForm({ ...form, percentage_rate: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount Basis (₹) *</label>
                  <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount_basis} onChange={(e) => setForm({ ...form, amount_basis: e.target.value })} required />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required>
                {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source Description</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.source_description} onChange={(e) => setForm({ ...form, source_description: e.target.value })} placeholder="e.g. Deal #123" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id} - {p.location}</option>)}
              </select>
            </div>
            {form.source === 'interior' && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Interior Project</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source_id} onChange={(e) => setForm({ ...form, source_id: e.target.value })}>
                  <option value="">Select interior project</option>
                  {interiorProjects.map((p) => <option key={p._id} value={p._id}>{p.title} - {p.client_id?.full_name || ''}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRequestModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
