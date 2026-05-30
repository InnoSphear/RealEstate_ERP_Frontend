import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', reimbursed: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['pending', 'approved', 'rejected', 'reimbursed'];

export default function Expenses() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ branch_id: '', project_id: '', category: '', description: '', amount: '', expense_date: '', status: 'pending' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, bRes, pRes] = await Promise.all([API.get('/expenses'), API.get('/branches'), API.get('/interior-projects')]); setData(dRes.data); setBranches(bRes.data); setProjects(pRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ branch_id: '', project_id: '', category: '', description: '', amount: '', expense_date: new Date().toISOString().split('T')[0], status: 'pending' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ branch_id: row.branch_id?._id || row.branch_id, project_id: row.project_id?._id || row.project_id || '', category: row.category || '', description: row.description || '', amount: row.amount || '', expense_date: row.expense_date ? row.expense_date.split('T')[0] : '', status: row.status }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount), project_id: form.project_id || undefined };
      if (selected) { await API.put(`/expenses/${selected._id}`, payload); toast('Expense updated'); }
      else { await API.post('/expenses', payload); toast('Expense created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/expenses/${selected._id}`); toast('Expense deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Category', accessor: 'category' },
    { header: 'Description', accessor: 'description' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.expense_date ? new Date(r.expense_date).toLocaleDateString() : '-' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Expenses</h1><p className="text-stone-500 mt-1">Track business expenses</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Expense</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Expense' : 'Create Expense'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}><option value="">None</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Expense" message="Are you sure?" />
    </div>
  );
}
