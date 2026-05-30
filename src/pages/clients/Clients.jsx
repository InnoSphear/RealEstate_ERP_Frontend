import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

const typeColors = {
  interior_client: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  property_seller: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  property_buyer: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  both: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export default function Clients() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', address: '', client_type: 'interior_client', source: 'referral', notes: '', branch_id: user?.branch?._id || '' });

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterType) params.append('client_type', filterType);
    const qs = params.toString();
    API.get(`/clients${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [filterType]);
  useEffect(() => {
    API.get('/branches').then((res) => setBranches(res.data)).catch(() => {});
  }, []);

  const openCreate = () => { setSelected(null); setForm({ full_name: '', email: '', phone: '', address: '', client_type: 'interior_client', source: 'referral', notes: '', branch_id: user?.branch?._id || '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ full_name: row.full_name, email: row.email || '', phone: row.phone || '', address: row.address || '', client_type: row.client_type, source: row.source || 'referral', notes: row.notes || '', branch_id: row.branch_id?._id || row.branch_id || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await API.put(`/clients/${selected._id}`, form); toast('Client updated'); }
      else { await API.post('/clients', form); toast('Client created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/clients/${selected._id}`); toast('Client deleted'); fetchData(); } catch (err) { toast('Error deleting', 'error'); } };

  const columns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Type', render: (r) => <span className={typeColors[r.client_type]}>{r.client_type?.replace(/_/g, ' ')}</span> },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Source', accessor: 'source' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Clients</h1><p className="text-stone-500 mt-1">Manage your clients and leads</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Client</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Types</option>
          <option value="interior_client">Interior Client</option>
          <option value="property_seller">Property Seller</option>
          <option value="property_buyer">Property Buyer</option>
          <option value="both">Both</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Client' : 'Create Client'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label><input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Client Type</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_type} onChange={(e) => setForm({ ...form, client_type: e.target.value })}><option value="interior_client">Interior Client</option><option value="property_seller">Property Seller</option><option value="property_buyer">Property Buyer</option><option value="both">Both</option></select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Source</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}><option value="referral">Referral</option><option value="walk-in">Walk-in</option><option value="online">Online</option><option value="ad">Ad</option></select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Client" message="Are you sure you want to delete this client?" />
    </div>
  );
}
