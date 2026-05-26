import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const sourceTypes = ['interior', 'property_sale', 'combined'];

export default function Revenue() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ branch_id: '', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), source_type: 'combined', total_invoiced: '', total_collected: '', total_expenses: '', total_material_cost: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, bRes] = await Promise.all([API.get('/revenue-summaries'), API.get('/branches')]); setData(dRes.data); setBranches(bRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ branch_id: '', period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear(), source_type: 'combined', total_invoiced: '', total_collected: '', total_expenses: '', total_material_cost: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ branch_id: row.branch_id?._id || row.branch_id, period_month: row.period_month, period_year: row.period_year, source_type: row.source_type, total_invoiced: row.total_invoiced || '', total_collected: row.total_collected || '', total_expenses: row.total_expenses || '', total_material_cost: row.total_material_cost || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, period_month: Number(form.period_month), period_year: Number(form.period_year), total_invoiced: Number(form.total_invoiced) || 0, total_collected: Number(form.total_collected) || 0, total_expenses: Number(form.total_expenses) || 0, total_material_cost: Number(form.total_material_cost) || 0 };
      if (selected) { await API.put(`/revenue-summaries/${selected._id}`, payload); toast('Revenue summary updated'); }
      else { await API.post('/revenue-summaries', payload); toast('Revenue summary created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const columns = [
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Period', render: (r) => `${monthNames[r.period_month]} ${r.period_year}` },
    { header: 'Source', render: (r) => <span className="bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{r.source_type?.replace('_', ' ')}</span> },
    { header: 'Invoiced', render: (r) => r.total_invoiced ? `₹${r.total_invoiced.toLocaleString()}` : '₹0' },
    { header: 'Collected', render: (r) => r.total_collected ? `₹${r.total_collected.toLocaleString()}` : '₹0' },
    { header: 'Expenses', render: (r) => r.total_expenses ? `₹${r.total_expenses.toLocaleString()}` : '₹0' },
    { header: 'Net Revenue', render: (r) => r.net_revenue ? `₹${r.net_revenue.toLocaleString()}` : '₹0' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Revenue Summaries</h1><p className="text-text-secondary">Track revenue by branch and period</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add Summary</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Revenue Summary' : 'Create Revenue Summary'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Branch *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Source Type</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.source_type} onChange={(e) => setForm({ ...form, source_type: e.target.value })}>{sourceTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Month</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.period_month} onChange={(e) => setForm({ ...form, period_month: e.target.value })}>{monthNames.slice(1).map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Year</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.period_year} onChange={(e) => setForm({ ...form, period_year: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Total Invoiced (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_invoiced} onChange={(e) => setForm({ ...form, total_invoiced: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Total Collected (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_collected} onChange={(e) => setForm({ ...form, total_collected: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Total Expenses (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_expenses} onChange={(e) => setForm({ ...form, total_expenses: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Material Cost (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_material_cost} onChange={(e) => setForm({ ...form, total_material_cost: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
