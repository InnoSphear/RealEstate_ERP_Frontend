import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { agreement_signed: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', registered: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', possession_given: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['agreement_signed', 'registered', 'possession_given'];

export default function Sales() {
  const [data, setData] = useState([]);
  const [listings, setListings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ listing_id: '', buyer_client_id: '', sale_code: '', agreement_date: '', possession_date: '', sale_price: '', commission_pct: '', payment_mode: '', status: 'agreement_signed', remarks: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, lRes, cRes] = await Promise.all([API.get('/property-sales'), API.get('/property-listings'), API.get('/clients')]); setData(dRes.data); setListings(lRes.data); setClients(cRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ listing_id: '', buyer_client_id: '', sale_code: '', agreement_date: '', possession_date: '', sale_price: '', commission_pct: '', payment_mode: '', status: 'agreement_signed', remarks: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ listing_id: row.listing_id?._id || row.listing_id, buyer_client_id: row.buyer_client_id?._id || row.buyer_client_id, sale_code: row.sale_code || '', agreement_date: row.agreement_date ? row.agreement_date.split('T')[0] : '', possession_date: row.possession_date ? row.possession_date.split('T')[0] : '', sale_price: row.sale_price || '', commission_pct: row.commission_pct || '', payment_mode: row.payment_mode || '', status: row.status, remarks: row.remarks || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, sale_price: form.sale_price ? Number(form.sale_price) : undefined, commission_pct: form.commission_pct ? Number(form.commission_pct) : undefined };
      if (selected) { await API.put(`/property-sales/${selected._id}`, payload); toast('Sale updated'); }
      else { await API.post('/property-sales', payload); toast('Sale created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/property-sales/${selected._id}`); toast('Sale deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Sale Code', accessor: 'sale_code' },
    { header: 'Listing', render: (r) => r.listing_id?.title || '-' },
    { header: 'Buyer', render: (r) => r.buyer_client_id?.full_name || '-' },
    { header: 'Sale Price', render: (r) => r.sale_price ? `₹${r.sale_price.toLocaleString()}` : '-' },
    { header: 'Commission %', render: (r) => r.commission_pct ? `${r.commission_pct}%` : '-' },
    { header: 'Payment Mode', accessor: 'payment_mode' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Property Sales</h1><p className="text-text-secondary">Record finalized property sales</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add Sale</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Sale' : 'Create Sale'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Sale Code</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.sale_code} onChange={(e) => setForm({ ...form, sale_code: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Listing *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })} required><option value="">Select listing</option>{listings.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Buyer *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.buyer_client_id} onChange={(e) => setForm({ ...form, buyer_client_id: e.target.value })} required><option value="">Select buyer</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Sale Price (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Commission %</label><input type="number" step="0.01" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.commission_pct} onChange={(e) => setForm({ ...form, commission_pct: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Payment Mode</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Agreement Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.agreement_date} onChange={(e) => setForm({ ...form, agreement_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Possession Date</label><input type="date" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.possession_date} onChange={(e) => setForm({ ...form, possession_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Remarks</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Sale" message="Are you sure?" />
    </div>
  );
}
