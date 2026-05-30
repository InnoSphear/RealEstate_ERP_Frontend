import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = { pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', approved: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['pending', 'approved', 'paid'];

export default function Commissions() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ sale_id: '', user_id: '', amount: '', pct: '', status: 'pending', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, uRes, sRes] = await Promise.all([API.get('/commissions'), API.get('/users'), API.get('/property-sales')]); setData(dRes.data); setUsers(uRes.data); setSales(sRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ sale_id: '', user_id: '', amount: '', pct: '', status: 'pending', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ sale_id: row.sale_id?._id || row.sale_id, user_id: row.user_id?._id || row.user_id, amount: row.amount || '', pct: row.pct || '', status: row.status, notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount), pct: form.pct ? Number(form.pct) : undefined };
      if (selected) { await API.put(`/commissions/${selected._id}`, payload); toast('Commission updated'); }
      else { await API.post('/commissions', payload); toast('Commission created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const columns = [
    { header: 'Sale', render: (r) => r.sale_id?.sale_code || '-' },
    { header: 'Agent', render: (r) => r.user_id?.full_name || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: '%', accessor: 'pct', render: (r) => r.pct ? `${r.pct}%` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Commissions</h1><p className="text-stone-500 mt-1">Manage agent commissions</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Commission</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Commission' : 'Create Commission'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Sale *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.sale_id} onChange={(e) => setForm({ ...form, sale_id: e.target.value })} required><option value="">Select sale</option>{sales.map((s) => <option key={s._id} value={s._id}>{s.sale_code}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Agent *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} required><option value="">Select agent</option>{users.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Percentage</label><input type="number" step="0.01" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.pct} onChange={(e) => setForm({ ...form, pct: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
