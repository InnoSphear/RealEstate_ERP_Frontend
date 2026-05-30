import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  draft: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cancelled: 'bg-stone-50 text-stone-500 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
};
const statuses = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];
const refTypes = ['interior_project', 'property_sale'];

export default function Invoices() {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [projects, setProjects] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ client_id: '', ref_type: 'interior_project', ref_id: '', invoice_number: '', invoice_date: '', due_date: '', subtotal: '', tax_pct: '18', discount: '0', total_amount: '', status: 'draft', notes: '', branch_id: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const qs = params.toString();
      const [dRes, cRes, bRes, pRes, sRes] = await Promise.all([
        API.get(`/invoices${qs ? `?${qs}` : ''}`),
        API.get('/clients'),
        API.get('/branches'),
        API.get('/interior-projects'),
        API.get('/property-sales')
      ]);
      setData(dRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
      setProjects(pRes.data);
      setSales(sRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus]);

  const openCreate = () => { setSelected(null); setForm({ client_id: '', ref_type: 'interior_project', ref_id: '', invoice_number: '', invoice_date: '', due_date: '', subtotal: '', tax_pct: '18', discount: '0', total_amount: '', status: 'draft', notes: '', branch_id: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ client_id: row.client_id?._id || row.client_id, ref_type: row.ref_type, ref_id: row.ref_id?._id || row.ref_id || '', invoice_number: row.invoice_number || '', invoice_date: row.invoice_date ? row.invoice_date.split('T')[0] : '', due_date: row.due_date ? row.due_date.split('T')[0] : '', subtotal: row.subtotal || '', tax_pct: row.tax_pct || '', discount: row.discount || '0', total_amount: row.total_amount || '', status: row.status, notes: row.notes || '', branch_id: row.branch_id?._id || row.branch_id || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, ref_id: form.ref_id || undefined, subtotal: Number(form.subtotal) || 0, tax_pct: Number(form.tax_pct) || 0, discount: Number(form.discount) || 0, total_amount: Number(form.total_amount) || 0, branch_id: form.branch_id || undefined };
      if (selected) { await API.put(`/invoices/${selected._id}`, payload); toast('Invoice updated'); }
      else { await API.post('/invoices', payload); toast('Invoice created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/invoices/${selected._id}`); toast('Invoice deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Invoice #', accessor: 'invoice_number' },
    { header: 'Client', render: (r) => r.client_id?.full_name || '-' },
    { header: 'Date', render: (r) => r.invoice_date ? new Date(r.invoice_date).toLocaleDateString() : '-' },
    { header: 'Total', render: (r) => r.total_amount ? `₹${r.total_amount.toLocaleString()}` : '-' },
    { header: 'Paid', render: (r) => r.amount_paid ? `₹${r.amount_paid.toLocaleString()}` : '₹0' },
    { header: 'Due', render: (r) => r.amount_due ? `₹${r.amount_due.toLocaleString()}` : '-' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Invoices</h1><p className="text-stone-500 mt-1">Manage invoices for projects and sales</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Invoice</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Invoice' : 'Create Invoice'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice Number</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required><option value="">Select client</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Ref Type</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.ref_type} onChange={(e) => setForm({ ...form, ref_type: e.target.value, ref_id: '' })}>{refTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.ref_id} onChange={(e) => setForm({ ...form, ref_id: e.target.value })}><option value="">-- None --</option>{(form.ref_type === 'interior_project' ? projects : sales).map((item) => <option key={item._id} value={item._id}>{item.title || item.sale_number || item._id}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Due Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Subtotal (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tax %</label><input type="number" step="0.01" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Discount (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Amount (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Invoice" message="Are you sure you want to delete this invoice?" />
    </div>
  );
}
