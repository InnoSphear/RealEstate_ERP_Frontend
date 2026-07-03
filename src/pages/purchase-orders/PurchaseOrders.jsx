import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { draft: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', received: 'bg-green-50 text-green-700 ring-1 ring-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', partial: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const paymentStatusColors = { unpaid: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', partial: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', paid: 'bg-green-50 text-green-700 ring-1 ring-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['draft', 'sent', 'received', 'partial', 'cancelled'];
const paymentStatuses = ['unpaid', 'partial', 'paid'];

export default function PurchaseOrders() {
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPO, setViewPO] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState({ branch_id: '', po_number: '', supplier_name: '', supplier_contact: '', order_date: '', expected_delivery: '', status: 'draft', payment_status: 'unpaid', total_amount: '', purchaser_name: '', invoice_number: '', payment_reference: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, bRes] = await Promise.all([API.get('/purchase-orders'), API.get('/branches')]); setData(dRes.data); setBranches(bRes.data); }
    catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ branch_id: '', po_number: '', supplier_name: '', supplier_contact: '', order_date: '', expected_delivery: '', status: 'draft', payment_status: 'unpaid', total_amount: '', purchaser_name: '', invoice_number: '', payment_reference: '', notes: '' });
    setModalOpen(true);
  };
  const openEdit = (row) => {
    setSelected(row);
    setForm({
      branch_id: row.branch_id?._id || row.branch_id, po_number: row.po_number || '', supplier_name: row.supplier_name || '', supplier_contact: row.supplier_contact || '',
      order_date: row.order_date ? row.order_date.split('T')[0] : '', expected_delivery: row.expected_delivery ? row.expected_delivery.split('T')[0] : '',
      status: row.status, payment_status: row.payment_status, total_amount: row.total_amount || '',
      purchaser_name: row.purchaser_name || '', invoice_number: row.invoice_number || '', payment_reference: row.payment_reference || '',
      notes: row.notes || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, total_amount: form.total_amount ? Number(form.total_amount) : undefined };
      if (selected) { await API.put(`/purchase-orders/${selected._id}`, payload); toast('PO updated'); }
      else { await API.post('/purchase-orders', payload); toast('PO created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/purchase-orders/${selected._id}`); toast('PO deleted'); fetchData(); } catch { toast('Error', 'error'); } };

  const handleInvoiceUpload = async (poId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('invoice', file);
      await API.post(`/purchase-orders/${poId}/upload-invoice`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Invoice uploaded');
      fetchData();
      if (viewPO?._id === poId) {
        const updated = await API.get(`/purchase-orders/${poId}`);
        setViewPO(updated.data);
      }
    } catch (err) { toast(err.response?.data?.message || 'Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleBillPhotoUpload = async (poId, file) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('bill_photo', file);
      await API.post(`/purchase-orders/${poId}/upload-bill`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Bill photo uploaded');
      if (viewPO?._id === poId) {
        const updated = await API.get(`/purchase-orders/${poId}`);
        setViewPO(updated.data);
      }
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Upload failed', 'error'); }
    finally { setUploadingPhoto(false); }
  };

  const columns = [
    { header: 'PO #', accessor: 'po_number' },
    { header: 'Supplier', accessor: 'supplier_name' },
    { header: 'Purchaser', render: (r) => r.purchaser_name || '-' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Total', render: (r) => r.total_amount ? `₹${r.total_amount.toLocaleString()}` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Payment', render: (r) => <span className={paymentStatusColors[r.payment_status]}>{r.payment_status}</span> },
    { header: 'Order Date', render: (r) => r.order_date ? new Date(r.order_date).toLocaleDateString() : '-' },
    { header: 'Invoice', render: (r) => r.invoice_url ? <a href={r.invoice_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm" onClick={(e) => e.stopPropagation()}>View</a> : (r.invoice_number || '-') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Purchase Orders</h1><p className="text-stone-500 mt-1">Manage purchase orders and suppliers</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add PO</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onView={(r) => { setViewPO(r); setViewModalOpen(true); }} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit PO' : 'Create PO'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">PO Number</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.po_number} onChange={(e) => setForm({ ...form, po_number: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Supplier Name</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.supplier_name} onChange={(e) => setForm({ ...form, supplier_name: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Supplier Contact</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.supplier_contact} onChange={(e) => setForm({ ...form, supplier_contact: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Purchaser Name</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.purchaser_name} onChange={(e) => setForm({ ...form, purchaser_name: e.target.value })} placeholder="Who made the purchase" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice Number</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="Vendor invoice number" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Order Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.order_date} onChange={(e) => setForm({ ...form, order_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Expected Delivery</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>{paymentStatuses.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Amount (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Reference / UTR</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.payment_reference} onChange={(e) => setForm({ ...form, payment_reference: e.target.value })} placeholder="UTR number / Reference" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`PO ${viewPO?.po_number || ''}`} size="lg">
        {viewPO && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">PO Number</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.po_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Supplier</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.supplier_name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Purchaser</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.purchaser_name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Branch</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.branch_id?.name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Amount</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.total_amount ? `₹${viewPO.total_amount.toLocaleString()}` : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</p><span className={statusColors[viewPO.status]}>{viewPO.status}</span></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Payment Status</p><span className={paymentStatusColors[viewPO.payment_status]}>{viewPO.payment_status}</span></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Order Date</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.order_date ? new Date(viewPO.order_date).toLocaleDateString() : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Expected Delivery</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.expected_delivery ? new Date(viewPO.expected_delivery).toLocaleDateString() : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Invoice Number</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.invoice_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Payment Ref/UTR</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.payment_reference || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Raised By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPO.raised_by?.full_name || '-'}</p></div>
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Invoice Upload</p>
              {viewPO.invoice_url ? (
                <div className="flex items-center gap-3">
                  <a href={viewPO.invoice_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 rounded-lg px-3 py-2 hover:bg-blue-100 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span>View Invoice</span>
                  </a>
                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors text-sm text-stone-500">
                    <span>{uploading ? 'Uploading...' : 'Replace'}</span>
                    <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files[0]) handleInvoiceUpload(viewPO._id, e.target.files[0]); e.target.value = ''; }} />
                  </label>
                </div>
              ) : (
                <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                  <span className="text-sm text-stone-500">{uploading ? 'Uploading...' : 'Upload Invoice (PDF / Image)'}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" disabled={uploading} onChange={(e) => { if (e.target.files[0]) handleInvoiceUpload(viewPO._id, e.target.files[0]); e.target.value = ''; }} />
                </label>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Bill / Slip Photos</p>
              <div className="flex flex-wrap gap-3 mb-3">
                {(viewPO.bill_photos || []).map((photo, i) => (
                  <a key={i} href={photo.url} target="_blank" rel="noopener noreferrer" className="group relative">
                    <img src={photo.url} alt={photo.name || 'Bill photo'} className="w-20 h-20 object-cover rounded-lg border border-stone-200 hover:opacity-80 transition-opacity" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-stone-500 bg-white px-1 rounded truncate max-w-[5rem] opacity-0 group-hover:opacity-100 transition-opacity">{photo.name || `Photo ${i + 1}`}</span>
                  </a>
                ))}
              </div>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                <span className="text-sm text-stone-500">{uploadingPhoto ? 'Uploading...' : 'Add Bill Photo'}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploadingPhoto} onChange={(e) => { if (e.target.files[0]) handleBillPhotoUpload(viewPO._id, e.target.files[0]); e.target.value = ''; }} />
              </label>
            </div>

            {viewPO.notes && (
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3">{viewPO.notes}</p></div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete PO" message="Are you sure?" />
    </div>
  );
}

