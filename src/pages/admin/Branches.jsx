import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

export default function Branches() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', is_active: true });

  const fetchData = () => {
    setLoading(true);
    API.get('/branches')
      .then((res) => setBranches(res.data))
      .catch(() => toast('Failed to load branches', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', address: '', city: '', phone: '', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (branch) => {
    setSelected(branch);
    setForm({ name: branch.name, address: branch.address || '', city: branch.city || '', phone: branch.phone || '', is_active: branch.is_active });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/branches/${selected._id}`, form);
        toast('Branch updated');
      } else {
        await API.post('/branches', form);
        toast('Branch created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error saving branch', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/branches/${selected._id}`);
      toast('Branch deleted');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error deleting branch', 'error');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'City', accessor: 'city' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Address', accessor: 'address' },
    {
      header: 'Status',
      render: (row) => <span className={row.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' : 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'}>{row.is_active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Branches</h1>
          <p className="text-stone-500 mt-1">Manage office branches</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Branch</button>
      </div>

      <DataTable columns={columns} data={branches} loading={loading} onEdit={openEdit} onDelete={(b) => { setSelected(b); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Branch' : 'Create Branch'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Name *</label>
            <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">City</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20" />
            <span className="text-sm text-stone-700 font-medium">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Branch" message="Are you sure you want to delete this branch?" />
    </div>
  );
}
