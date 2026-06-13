import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const leaveTypes = [
  { value: 'sick', label: 'Sick' },
  { value: 'casual', label: 'Casual' },
  { value: 'annual', label: 'Annual' },
  { value: 'personal', label: 'Personal' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'paternity', label: 'Paternity' },
  { value: 'other', label: 'Other' },
];

const statusBadge = (status) => {
  const map = {
    pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    cancelled: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || map.pending}`}>{status}</span>;
};

export default function MyLeaves() {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: 'sick', from_date: '', to_date: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesRes, balanceRes] = await Promise.all([
        API.get('/leaves/my'),
        API.get('/leaves/balance'),
      ]);
      setLeaves(Array.isArray(leavesRes.data) ? leavesRes.data : []);
      setBalance(balanceRes.data || null);
    } catch {
      toast('Failed to load leaves', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openApply = () => {
    setForm({ leave_type: 'sick', from_date: '', to_date: '', reason: '' });
    setModalOpen(true);
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!form.from_date || !form.to_date) return toast('Select from and to dates', 'error');
    setSubmitting(true);
    try {
      await API.post('/leaves/apply', form);
      toast('Leave applied');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to apply leave', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">My Leaves</h1>
          <p className="text-stone-500 mt-1">Apply for leave and view your history</p>
        </div>
        <button onClick={openApply} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          + Apply Leave
        </button>
      </div>

      {balance && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(balance).map(([key, val]) => (
            <div key={key} className="bg-white rounded-2xl border border-stone-200 p-4">
              <p className="text-xs text-stone-500 capitalize">{key} Leave</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Leave History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Type</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">From</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">To</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Days</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Reason</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Status</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase">Applied</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-stone-400">No leave records</td>
                </tr>
              ) : leaves.map((l) => (
                <tr key={l._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="px-5 py-3.5 capitalize text-stone-700">{l.leave_type}</td>
                  <td className="px-5 py-3.5 text-stone-700">{new Date(l.from_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-stone-700">{new Date(l.to_date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-stone-700">{l.total_days}</td>
                  <td className="px-5 py-3.5 text-stone-700 max-w-[200px] truncate">{l.reason || '-'}</td>
                  <td className="px-5 py-3.5">{statusBadge(l.status)}</td>
                  <td className="px-5 py-3.5 text-stone-500 text-xs">{new Date(l.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave" size="sm">
        <form onSubmit={handleApply} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Leave Type *</label>
            <select className={inputClass + " appearance-none cursor-pointer"} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })}>
              {leaveTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">From Date *</label>
              <input type="date" className={inputClass} value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">To Date *</label>
              <input type="date" className={inputClass} value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason</label>
            <textarea className={inputClass} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Optional reason for leave..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{submitting ? 'Applying...' : 'Apply'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
