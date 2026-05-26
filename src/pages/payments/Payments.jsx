import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { received: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cleared: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', bounced: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', refunded: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['received', 'cleared', 'bounced', 'refunded'];
const modes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

export default function Payments() {
  const [data, setData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '', status: 'received', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, iRes] = await Promise.all([API.get('/payments'), API.get('/invoices')]); setData(dRes.data); setInvoices(iRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '', status: 'received', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ invoice_id: row.invoice_id?._id || row.invoice_id, amount: row.amount || '', payment_date: row.payment_date ? row.payment_date.split('T')[0] : '', payment_mode: row.payment_mode, reference_no: row.reference_no || '', status: row.status, notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (selected) { await API.put(`/payments/${selected._id}`, payload); toast('Payment updated'); }
      else { await API.post('/payments', payload); toast('Payment created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/payments/${selected._id}`); toast('Payment deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Invoice', render: (r) => r.invoice_id?.invoice_number || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-' },
    { header: 'Mode', accessor: 'payment_mode', render: (r) => <span className="bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{r.payment_mode?.replace('_', ' ')}</span> },
    { header: 'Reference', accessor: 'reference_no' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Payments</h1><p className="text-text-secondary">Record payments against invoices</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add Payment</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Payment' : 'Create Payment'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Invoice *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} required><option value="">Select invoice</option>{invoices.map((inv) => <option key={inv._id} value={inv._id}>{inv.invoice_number}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Amount (₹) *</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Mode</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>{modes.map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Reference No</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Notes</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Payment" message="Are you sure?" />
    </div>
  );
}
