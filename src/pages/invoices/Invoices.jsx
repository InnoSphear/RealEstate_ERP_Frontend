import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { draft: 'bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', sent: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', partial: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paid: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', overdue: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cancelled: 'bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled'];
const refTypes = ['interior_project', 'property_sale'];

export default function Invoices() {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ client_id: '', ref_type: 'interior_project', ref_id: '', invoice_number: '', invoice_date: '', due_date: '', subtotal: '', tax_pct: '', discount: '', total_amount: '', status: 'draft', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, cRes, bRes] = await Promise.all([API.get('/invoices'), API.get('/clients'), API.get('/branches')]); setData(dRes.data); setClients(cRes.data); setBranches(bRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ client_id: '', ref_type: 'interior_project', ref_id: '', invoice_number: '', invoice_date: '', due_date: '', subtotal: '', tax_pct: '18', discount: '0', total_amount: '', status: 'draft', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ client_id: row.client_id?._id || row.client_id, ref_type: row.ref_type, ref_id: row.ref_id || '', invoice_number: row.invoice_number || '', invoice_date: row.invoice_date ? row.invoice_date.split('T')[0] : '', due_date: row.due_date ? row.due_date.split('T')[0] : '', subtotal: row.subtotal || '', tax_pct: row.tax_pct || '', discount: row.discount || '0', total_amount: row.total_amount || '', status: row.status, notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, subtotal: Number(form.subtotal) || 0, tax_pct: Number(form.tax_pct) || 0, discount: Number(form.discount) || 0, total_amount: Number(form.total_amount) || 0 };
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
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Invoices</h1><p className="text-text-secondary">Manage invoices for projects and sales</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add Invoice</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Invoice' : 'Create Invoice'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Invoice Number</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Client *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required><option value="">Select client</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Ref Type</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.ref_type} onChange={(e) => setForm({ ...form, ref_type: e.target.value })}>{refTypes.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Ref ID</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.ref_id} onChange={(e) => setForm({ ...form, ref_id: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Invoice Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Due Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Subtotal (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Tax %</label><input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.tax_pct} onChange={(e) => setForm({ ...form, tax_pct: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Discount (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Total Amount (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Notes</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Invoice" message="Are you sure?" />
    </div>
  );
}
