import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

export default function StockList() {
  const [data, setData] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({ quantity: '', type: 'add', reason: '' });
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [form, setForm] = useState({
    item_name: '', material: '', category: 'other', sku: '', unit: 'pcs',
    current_quantity: 0, reorder_level: 0, unit_price: 0,
    supplier: '', location: '', notes: '',
  });

  const categories = ['raw_material', 'finished_good', 'consumable', 'tool', 'equipment', 'furniture', 'fixture', 'other'];

  const fetchData = async () => {
    setLoading(true);
    try {
      const sRes = await API.get('/stock');
      setData(sRes.data);
    } catch { toast('Failed to load stock', 'error'); }
    try {
      const mRes = await API.get('/materials');
      setMaterials(mRes.data);
    } catch { /* materials optional */ }
    try {
      const vRes = await API.get('/vendors');
      setSuppliers(vRes.data);
    } catch { /* vendors optional */ }
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ item_name: '', material: '', category: 'other', sku: '', unit: 'pcs', current_quantity: 0, reorder_level: 0, unit_price: 0, supplier: '', location: '', notes: '' });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      item_name: row.item_name, material: row.material?._id || row.material || '',
      category: row.category || 'other', sku: row.sku || '', unit: row.unit || 'pcs',
      current_quantity: row.current_quantity ?? 0, reorder_level: row.reorder_level ?? 0,
      unit_price: row.unit_price ?? 0, supplier: row.supplier?._id || row.supplier || '',
      location: row.location || '', notes: row.notes || '',
    });
    setModalOpen(true);
  };

  const openAdjust = (row) => {
    setAdjustTarget(row);
    setAdjustForm({ quantity: '', type: 'add', reason: '' });
    setAdjustModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        current_quantity: Number(form.current_quantity),
        reorder_level: Number(form.reorder_level),
        unit_price: Number(form.unit_price),
        material: form.material || undefined,
        supplier: form.supplier || undefined,
      };
      if (selected) {
        await API.put(`/stock/${selected._id}`, payload);
        toast('Stock updated');
      } else {
        await API.post('/stock', payload);
        toast('Stock created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleAdjust = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/stock/${adjustTarget._id}/adjust`, {
        quantity: Number(adjustForm.quantity),
        type: adjustForm.type,
        reason: adjustForm.reason,
      });
      toast('Stock adjusted');
      setAdjustModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/stock/${selected._id}`);
      toast('Stock deleted');
      fetchData();
    } catch { toast('Error', 'error'); }
  };

  const filteredData = data.filter((item) => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matches = (item.item_name || '').toLowerCase().includes(term)
        || (item.sku || '').toLowerCase().includes(term)
        || (item.location || '').toLowerCase().includes(term);
      if (!matches) return false;
    }
    return true;
  });

  const columns = [
    { header: 'Item Name', accessor: 'item_name' },
    { header: 'SKU', accessor: 'sku' },
    {
      header: 'Category',
      render: (r) => <span className="text-xs bg-stone-100 text-stone-700 px-2 py-0.5 rounded-full">{r.category?.replace(/_/g, ' ')}</span>,
    },
    {
      header: 'Current Qty',
      render: (r) => {
        const isLow = r.reorder_level > 0 && r.current_quantity <= r.reorder_level;
        return (
          <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-stone-900'}`}>
            {r.current_quantity} {r.unit}
            {isLow && <span className="ml-1.5 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Low</span>}
          </span>
        );
      },
    },
    { header: 'Reorder Level', render: (r) => r.reorder_level || '-' },
    { header: 'Unit Price', render: (r) => r.unit_price ? `₹${r.unit_price}` : '-' },
    { header: 'Supplier', render: (r) => r.supplier?.name || '-' },
    { header: 'Location', accessor: 'location' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Stock Management</h1><p className="text-stone-500 mt-1">Track inventory levels across categories</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Stock</button>
      </div>

      <div className="flex gap-4 items-center">
        <input
          placeholder="Search by name, SKU, or location..."
          className="w-full max-w-xs px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
          value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer"
          value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={loading}
        onEdit={openEdit}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
        onView={openAdjust}
        viewLabel="Adjust"
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Stock' : 'Add Stock Item'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Item Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">SKU</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Category *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>{categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Unit</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="pcs, kg, sqft..." /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Current Quantity</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Reorder Level</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reorder_level} onChange={(e) => setForm({ ...form, reorder_level: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Unit Price (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Location</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Shelf, warehouse..." /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Linked Material</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}><option value="">Not linked</option>{materials.map((m) => <option key={m._id} value={m._id}>{m.name} ({m.sku || '-'})</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Supplier</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}><option value="">Select supplier</option>{suppliers.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>

      <Modal isOpen={adjustModalOpen} onClose={() => setAdjustModalOpen(false)} title={`Adjust Stock - ${adjustTarget?.item_name || ''}`} size="sm">
        <form onSubmit={handleAdjust} className="space-y-5">
          <div className="bg-stone-50 rounded-xl p-3 text-sm">
            <span className="text-stone-500">Current quantity: </span>
            <span className="font-semibold">{adjustTarget?.current_quantity} {adjustTarget?.unit}</span>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Adjustment Type</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}>
              <option value="add">Add Stock</option>
              <option value="remove">Remove Stock</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Quantity *</label><input type="number" min="1" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} required /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} placeholder="e.g. New shipment, damaged, returned..." /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setAdjustModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Apply</button></div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Stock" message="Are you sure?" />
    </div>
  );
}

