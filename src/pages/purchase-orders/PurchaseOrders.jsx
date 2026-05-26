import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { draft: 'bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', sent: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', received: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', partial: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cancelled: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const paymentStatusColors = { unpaid: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', partial: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paid: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['draft', 'sent', 'received', 'partial', 'cancelled'];
const paymentStatuses = ['unpaid', 'partial', 'paid'];

export default function PurchaseOrders() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ branch_id: '', po_number: '', supplier_name: '', supplier_contact: '', order_date: '', expected_delivery: '', status: 'draft', payment_status: 'unpaid', total_amount: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, bRes] = await Promise.all([API.get('/purchase-orders'), API.get('/branches')]); setData(dRes.data); setBranches(bRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ branch_id: '', po_number: '', supplier_name: '', supplier_contact: '', order_date: '', expected_delivery: '', status: 'draft', payment_status: 'unpaid', total_amount: '', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ branch_id: row.branch_id?._id || row.branch_id, po_number: row.po_number || '', supplier_name: row.supplier_name || '', supplier_contact: row.supplier_contact || '', order_date: row.order_date ? row.order_date.split('T')[0] : '', expected_delivery: row.expected_delivery ? row.expected_delivery.split('T')[0] : '', status: row.status, payment_status: row.payment_status, total_amount: row.total_amount || '', notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, total_amount: form.total_amount ? Number(form.total_amount) : undefined };
      if (selected) { await API.put(`/purchase-orders/${selected._id}`, payload); toast('PO updated'); }
      else { await API.post('/purchase-orders', payload); toast('PO created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/purchase-orders/${selected._id}`); toast('PO deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'PO #', accessor: 'po_number' },
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Total', render: (r) => r.total_amount ? `₹${r.total_amount.toLocaleString()}` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Payment', render: (r) => <span className={paymentStatusColors[r.payment_status]}>{r.payment_status}</span> },
    { header: 'Order Date', render: (r) => r.order_date ? new Date(r.order_date).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Purchase Orders</h1><p className="text-text-secondary">Manage purchase orders and suppliers</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add PO</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit PO' : 'Create PO'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">PO Number</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Branch *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Supplier Name</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Supplier Contact</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.supplier_contact} onChange={(e) => setForm({ ...form, supplier_contact: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Order Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Expected Delivery</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Payment Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>{paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Total Amount (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Notes</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete PO" message="Are you sure?" />
    </div>
  );
}
