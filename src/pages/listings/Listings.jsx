import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = { active: 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', under_negotiation: 'bg-yellow-100 text-yellow-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', sold: 'bg-blue-100 text-blue-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', withdrawn: 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };
const propertyTypes = ['apartment', 'villa', 'plot', 'commercial', 'office', 'warehouse'];
const statuses = ['active', 'under_negotiation', 'sold', 'withdrawn'];

export default function Listings() {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ client_id: '', title: '', listing_code: '', property_type: 'apartment', status: 'active', address: '', city: '', area_sqft: '', bedrooms: '', bathrooms: '', asking_price: '', description: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, cRes] = await Promise.all([API.get('/property-listings'), API.get('/clients')]); setData(dRes.data); setClients(cRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ client_id: '', title: '', listing_code: '', property_type: 'apartment', status: 'active', address: '', city: '', area_sqft: '', bedrooms: '', bathrooms: '', asking_price: '', description: '', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ client_id: row.client_id?._id || row.client_id, title: row.title, listing_code: row.listing_code || '', property_type: row.property_type, status: row.status, address: row.address || '', city: row.city || '', area_sqft: row.area_sqft || '', bedrooms: row.bedrooms || '', bathrooms: row.bathrooms || '', asking_price: row.asking_price || '', description: row.description || '', notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, area_sqft: form.area_sqft ? Number(form.area_sqft) : undefined, bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined, bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined, asking_price: form.asking_price ? Number(form.asking_price) : undefined };
      if (selected) { await API.put(`/property-listings/${selected._id}`, payload); toast('Listing updated'); }
      else { await API.post('/property-listings', payload); toast('Listing created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/property-listings/${selected._id}`); toast('Listing deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Code', accessor: 'listing_code' },
    { header: 'Title', accessor: 'title' },
    { header: 'Type', accessor: 'property_type', render: (r) => <span className="bg-gray-100 text-gray-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{r.property_type}</span> },
    { header: 'City', accessor: 'city' },
    { header: 'Price', render: (r) => r.asking_price ? `₹${r.asking_price.toLocaleString()}` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
    { header: 'Client', render: (r) => r.client_id?.full_name || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-text">Property Listings</h1><p className="text-text-secondary">Manage real estate listings</p></div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add Listing</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Listing' : 'Create Listing'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Title *</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Listing Code</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.listing_code} onChange={(e) => setForm({ ...form, listing_code: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Client *</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required><option value="">Select client</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Property Type</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>{propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Status</label><select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">City</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Area (sqft)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Bedrooms</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Bathrooms</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-text-secondary mb-1">Asking Price (₹)</label><input type="number" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.asking_price} onChange={(e) => setForm({ ...form, asking_price: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Address</label><input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Description</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-text-secondary mb-1">Notes</label><textarea className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Listing" message="Are you sure?" />
    </div>
  );
}
