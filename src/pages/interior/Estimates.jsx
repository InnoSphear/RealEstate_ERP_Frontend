import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineReceiptPercent, HiOutlinePrinter, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    lead: '', project: '', title: '', instructions: '', delivery_terms: '',
    valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get('/estimates'),
      API.get('/leads'),
      API.get('/interior-projects'),
    ]).then(([eRes, lRes, pRes]) => {
      setEstimates(eRes.data);
      setLeads(lRes.data);
      setProjects(pRes.data);
    }).catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0, delivery_time: '' }],
    });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      items[idx].amount = (Number(items[idx].quantity) || 0) * (Number(items[idx].rate) || 0);
    }
    setForm({ ...form, items });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/estimates', {
        ...form,
        items: form.items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
        })),
        tax_percent: Number(form.tax_percent),
        discount: Number(form.discount),
      });
      toast('Estimate created');
      setModalOpen(false);
      setForm({ lead: '', project: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' });
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/estimates/${selected._id}`);
      toast('Estimate deleted');
      fetchData();
    } catch { toast('Error', 'error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const statusColors = {
    draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
    sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    accepted: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    expired: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Estimates</h1>
          <p className="text-stone-500 mt-1">Create and manage project estimates with letterhead</p>
        </div>
        <button onClick={() => { setForm({ lead: '', project: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' }); setModalOpen(true); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={16} /> New Estimate</button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <HiOutlineReceiptPercent size={40} className="mx-auto mb-3 text-stone-200" />
            <p>No estimates yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Lead / Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Project</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Created</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est) => (
                  <tr key={est._id} className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer" onClick={() => { setSelected(est); setViewModalOpen(true); }}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{est.estimate_number}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{est.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-stone-700">{est.lead?.full_name || est.client?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-stone-600">{est.project?.title || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-stone-900">₹{(est.grand_total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[est.status] || statusColors.draft}`}>{est.status?.charAt(0).toUpperCase() + est.status?.slice(1)}</span></td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(est.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setSelected(est); setForm({ lead: est.lead?._id || '', project: est.project?._id || '', title: est.title || '', instructions: est.instructions || '', delivery_terms: est.delivery_terms || '', valid_until: est.valid_until ? est.valid_until.split('T')[0] : '', items: est.items?.map((i) => ({ ...i })) || [], tax_percent: est.tax_percent || 0, discount: est.discount || 0, notes: est.notes || '' }); setModalOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"><HiOutlinePencilSquare size={15} /></button>
                      <button onClick={() => { setSelected(est); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); setForm({ lead: '', project: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' }); }} title={selected ? 'Edit Estimate' : 'New Estimate'} size="xl">
        <form onSubmit={selected ? async (e) => {
          e.preventDefault();
          try {
            await API.put(`/estimates/${selected._id}`, {
              ...form,
              items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0) })),
              tax_percent: Number(form.tax_percent),
              discount: Number(form.discount),
            });
            toast('Estimate updated');
            setModalOpen(false);
            setSelected(null);
            fetchData();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        } : handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Title</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Kitchen Renovation Estimate" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Valid Until</label><input type="date" className={inputClass} value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Lead</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.lead} onChange={(e) => setForm({ ...form, lead: e.target.value })}>
                <option value="">Select lead</option>
                {leads.map((l) => <option key={l._id} value={l._id}>{l.full_name} {l.mobile ? `(${l.mobile})` : ''}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title} ({p.flat_id || p.project_code || '-'})</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Instructions / Scope</label><textarea className={inputClass} rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Describe what will be delivered..." /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Delivery Terms</label><textarea className={inputClass} rows={2} value={form.delivery_terms} onChange={(e) => setForm({ ...form, delivery_terms: e.target.value })} placeholder="Payment terms, delivery timeline..." /></div>

          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-700">Items</h4>
              <button type="button" onClick={addItem} className="text-sm text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"><HiOutlinePlus size={14} /> Add Item</button>
            </div>
            {form.items.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">No items added. Click "Add Item" to add materials/services.</p>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Item Name</label><input className={`${inputClass} text-xs`} value={item.item_name} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} placeholder="Item name" /></div>
                          <div className="col-span-2"><label className="block text-xs font-medium text-stone-500 mb-0.5">Description</label><input className={`${inputClass} text-xs`} value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Optional description" /></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Qty</label><input type="number" min="1" className={`${inputClass} text-xs`} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Unit</label><input className={`${inputClass} text-xs`} value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Rate (₹)</label><input type="number" min="0" className={`${inputClass} text-xs`} value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Amount</label><input className={`${inputClass} text-xs bg-stone-100`} value={item.amount} readOnly /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Delivery</label><input className={`${inputClass} text-xs`} value={item.delivery_time} onChange={(e) => updateItem(idx, 'delivery_time', e.target.value)} placeholder="e.g. 2 weeks" /></div>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all mt-5"><HiOutlineTrash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-stone-200 pt-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tax %</label><input type="number" min="0" step="0.01" className={inputClass} value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Discount (₹)</label><input type="number" min="0" step="0.01" className={inputClass} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setSelected(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create Estimate'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Estimate" size="2xl">
        {selected && (
          <div>
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #estimate-print, #estimate-print * { visibility: visible; }
                #estimate-print { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
              }
            `}</style>
            <div id="estimate-print" className="p-6 space-y-6">
              <div className="text-center border-b border-stone-200 pb-4">
                <h2 className="text-2xl font-bold text-stone-900">Shivam International</h2>
                <p className="text-sm text-stone-500">Interior Work Estimate</p>
                <p className="text-xs text-stone-400 mt-1">Estimate #{selected.estimate_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-stone-900">{selected.lead?.full_name || selected.client?.full_name || 'N/A'}</p>
                  {(selected.lead?.mobile || selected.client?.phone) && <p className="text-stone-500">{selected.lead?.mobile || selected.client?.phone}</p>}
                  {(selected.lead?.email || selected.client?.email) && <p className="text-stone-500">{selected.lead?.email || selected.client?.email}</p>}
                  {selected.project && <p className="text-stone-500 mt-1">Project: {selected.project.title}</p>}
                </div>
                <div className="text-right">
                  <p className="text-stone-500">Date: {formatDate(selected.createdAt)}</p>
                  {selected.valid_until && <p className="text-stone-500">Valid Until: {formatDate(selected.valid_until)}</p>}
                  <p className="text-stone-500 mt-1">Status: <span className="font-medium capitalize">{selected.status}</span></p>
                </div>
              </div>

              {selected.instructions && (
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Scope / Instructions</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{selected.instructions}</p>
                </div>
              )}

              <table className="w-full text-sm border border-stone-200">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Item</th>
                    <th className="px-3 py-2 text-right font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Qty</th>
                    <th className="px-3 py-2 text-right font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Rate</th>
                    <th className="px-3 py-2 text-right font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Amount</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Delivery</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.items?.map((item, idx) => (
                    <tr key={idx} className="border-b border-stone-100">
                      <td className="px-3 py-2 text-stone-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-stone-900">{item.item_name}</p>
                        {item.description && <p className="text-xs text-stone-500">{item.description}</p>}
                      </td>
                      <td className="px-3 py-2 text-right text-stone-700">{item.quantity} {item.unit}</td>
                      <td className="px-3 py-2 text-right text-stone-700">₹{(item.rate || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-right font-medium text-stone-900">₹{(item.amount || 0).toLocaleString()}</td>
                      <td className="px-3 py-2 text-stone-500">{item.delivery_time || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50">
                    <td colSpan={4} className="px-3 py-2 text-right font-semibold text-stone-600">Subtotal</td>
                    <td className="px-3 py-2 text-right font-semibold text-stone-900">₹{(selected.subtotal || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                  {selected.tax_percent > 0 && (
                    <tr className="bg-stone-50">
                      <td colSpan={4} className="px-3 py-2 text-right text-stone-600">Tax ({selected.tax_percent}%)</td>
                      <td className="px-3 py-2 text-right text-stone-900">₹{(selected.tax_amount || 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  )}
                  {selected.discount > 0 && (
                    <tr className="bg-stone-50">
                      <td colSpan={4} className="px-3 py-2 text-right text-stone-600">Discount</td>
                      <td className="px-3 py-2 text-right text-red-600">-₹{(selected.discount || 0).toLocaleString()}</td>
                      <td></td>
                    </tr>
                  )}
                  <tr className="bg-stone-100 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-right text-stone-800">Grand Total</td>
                    <td className="px-3 py-2 text-right text-stone-900">₹{(selected.grand_total || 0).toLocaleString()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>

              {selected.delivery_terms && (
                <div className="text-sm text-stone-600 p-3 bg-stone-50 rounded-lg">
                  <p className="font-semibold text-stone-700 mb-1">Terms:</p>
                  <p className="whitespace-pre-wrap">{selected.delivery_terms}</p>
                </div>
              )}

              {selected.notes && (
                <div className="text-sm text-stone-500">
                  <p className="font-semibold text-stone-600">Notes:</p>
                  <p>{selected.notes}</p>
                </div>
              )}

              <div className="text-center text-xs text-stone-400 pt-2 border-t border-stone-100">
                <p>This is a computer-generated estimate</p>
              </div>

              <div className="text-center no-print pt-4 flex gap-3 justify-center">
                <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePrinter size={16} /> Print / PDF</button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Estimate" message="Are you sure?" />
    </div>
  );
}
