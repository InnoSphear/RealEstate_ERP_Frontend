import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { new: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', follow_up: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', negotiating: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', closed_won: 'bg-green-50 text-green-700 ring-1 ring-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', closed_lost: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const statuses = ['new', 'follow_up', 'negotiating', 'closed_won', 'closed_lost'];

export default function Inquiries() {
  const [data, setData] = useState([]);
  const [listings, setListings] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ listing_id: '', client_id: '', inquiry_date: '', offered_price: '', status: 'new', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, lRes, cRes] = await Promise.all([API.get('/buyer-inquiries'), API.get('/property-listings'), API.get('/clients')]); setData(dRes.data); setListings(lRes.data); setClients(cRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ listing_id: '', client_id: '', inquiry_date: new Date().toISOString().split('T')[0], offered_price: '', status: 'new', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ listing_id: row.listing_id?._id || row.listing_id, client_id: row.client_id?._id || row.client_id, inquiry_date: row.inquiry_date ? row.inquiry_date.split('T')[0] : '', offered_price: row.offered_price || '', status: row.status, notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, offered_price: form.offered_price ? Number(form.offered_price) : undefined };
      if (selected) { await API.put(`/buyer-inquiries/${selected._id}`, payload); toast('Inquiry updated'); }
      else { await API.post('/buyer-inquiries', payload); toast('Inquiry created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/buyer-inquiries/${selected._id}`); toast('Inquiry deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Listing', render: (r) => r.listing_id?.title || '-' },
    { header: 'Client', render: (r) => r.client_id?.full_name || '-' },
    { header: 'Date', render: (r) => r.inquiry_date ? new Date(r.inquiry_date).toLocaleDateString() : '-' },
    { header: 'Offered Price', render: (r) => r.offered_price ? `₹${r.offered_price.toLocaleString()}` : '-' },
    { header: 'Handled By', render: (r) => r.handled_by?.full_name || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Buyer Inquiries</h1><p className="text-stone-500 mt-1">Track buyer interest in properties</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Inquiry</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Inquiry' : 'Create Inquiry'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Listing *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.listing_id} onChange={(e) => setForm({ ...form, listing_id: e.target.value })} required><option value="">Select listing</option>{listings.map((l) => <option key={l._id} value={l._id}>{l.title}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required><option value="">Select client</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.inquiry_date} onChange={(e) => setForm({ ...form, inquiry_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Offered Price (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.offered_price} onChange={(e) => setForm({ ...form, offered_price: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Inquiry" message="Are you sure?" />
    </div>
  );
}
