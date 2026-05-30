import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

export default function Inventory() {
  const [data, setData] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ material_id: '', branch_id: '', qty_on_hand: 0, qty_reserved: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, mRes, bRes] = await Promise.all([API.get('/material-inventory'), API.get('/materials'), API.get('/branches')]);
      setData(dRes.data);
      setMaterials(mRes.data);
      setBranches(bRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ material_id: '', branch_id: '', qty_on_hand: 0, qty_reserved: 0 }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ material_id: row.material_id?._id || row.material_id, branch_id: row.branch_id?._id || row.branch_id, qty_on_hand: row.qty_on_hand, qty_reserved: row.qty_reserved }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, qty_on_hand: Number(form.qty_on_hand), qty_reserved: Number(form.qty_reserved) };
      if (selected) { await API.put(`/material-inventory/${selected._id}`, payload); toast('Inventory updated'); }
      else { await API.post('/material-inventory', payload); toast('Inventory created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const columns = [
    { header: 'Material', render: (r) => r.material_id?.name || '-' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'On Hand', accessor: 'qty_on_hand' },
    { header: 'Reserved', accessor: 'qty_reserved' },
    { header: 'Available', accessor: 'qty_available' },
    { header: 'Last Updated', render: (r) => r.last_updated ? new Date(r.last_updated).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Material Inventory</h1><p className="text-stone-500 mt-1">Track stock levels across branches</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Stock</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Stock' : 'Add Stock'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Material *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.material_id} onChange={(e) => setForm({ ...form, material_id: e.target.value })} required><option value="">Select material</option>{materials.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}</select></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Qty On Hand</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.qty_on_hand} onChange={(e) => setForm({ ...form, qty_on_hand: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Qty Reserved</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.qty_reserved} onChange={(e) => setForm({ ...form, qty_reserved: e.target.value })} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
