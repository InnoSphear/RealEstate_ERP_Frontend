import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePlus, HiOutlineReceiptPercent, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineTrash } from 'react-icons/hi2';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import StatsCard from '../../components/StatsCard';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusBadge = (v) => {
  const map = {
    draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
    sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    cancelled: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
  };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[v] || map.draft}`}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : '-'}</span>;
};

const profitClass = (v) => {
  if (!v || v === 0) return 'text-stone-600';
  return v > 0 ? 'text-emerald-600' : 'text-red-600';
};

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function InteriorInvoices() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total_invoices: 0, total_sale: 0, total_purchase: 0, total_expense: 0, total_profit: 0, total_paid: 0, total_due: 0 });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ status: '', interior_project: '' });

  const [form, setForm] = useState({
    interior_project: '', client: '', invoice_number: '', invoice_date: new Date().toISOString().split('T')[0],
    due_date: '', status: 'draft', notes: '', terms: '',
    sale_items: [{ description: '', quantity: 1, rate: 0, amount: 0, category: 'other' }],
    purchase_items: [],
    expense_items: [],
  });

  const recalcItems = (items) => items.map((item) => ({
    ...item, amount: (parseFloat(item.quantity) || 1) * (parseFloat(item.rate) || 0),
  }));

  const updateSaleItem = (idx, field, value) => {
    const items = [...form.sale_items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? value : items[idx].quantity;
      const r = field === 'rate' ? value : items[idx].rate;
      items[idx].amount = (parseFloat(q) || 1) * (parseFloat(r) || 0);
    }
    setForm({ ...form, sale_items: items });
  };

  const updatePurchaseItem = (idx, field, value) => {
    const items = [...form.purchase_items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      const q = field === 'quantity' ? value : items[idx].quantity;
      const r = field === 'rate' ? value : items[idx].rate;
      items[idx].amount = (parseFloat(q) || 1) * (parseFloat(r) || 0);
    }
    setForm({ ...form, purchase_items: items });
  };

  const updateExpenseItem = (idx, field, value) => {
    const items = [...form.expense_items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'amount') items[idx].amount = parseFloat(value) || 0;
    setForm({ ...form, expense_items: items });
  };

  const addSaleItem = () => setForm({ ...form, sale_items: [...form.sale_items, { description: '', quantity: 1, rate: 0, amount: 0, category: 'other' }] });
  const addPurchaseItem = () => setForm({ ...form, purchase_items: [...form.purchase_items, { description: '', quantity: 1, rate: 0, amount: 0, vendor: '', category: 'other' }] });
  const addExpenseItem = () => setForm({ ...form, expense_items: [...form.expense_items, { description: '', amount: 0, category: 'miscellaneous', date: '' }] });

  const removeSaleItem = (idx) => setForm({ ...form, sale_items: form.sale_items.filter((_, i) => i !== idx) });
  const removePurchaseItem = (idx) => setForm({ ...form, purchase_items: form.purchase_items.filter((_, i) => i !== idx) });
  const removeExpenseItem = (idx) => setForm({ ...form, expense_items: form.expense_items.filter((_, i) => i !== idx) });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const [dRes, sRes, pRes, cRes] = await Promise.all([
        API.get(qs ? `/interior-invoices?${qs}` : '/interior-invoices'),
        API.get('/interior-invoices/stats'),
        API.get('/interior-projects'),
        API.get('/clients'),
      ]);
      setData(Array.isArray(dRes.data) ? dRes.data : []);
      setStats(sRes.data || { total_invoices: 0, total_sale: 0, total_purchase: 0, total_expense: 0, total_profit: 0, total_paid: 0, total_due: 0 });
      setProjects(Array.isArray(pRes.data) ? pRes.data : []);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
    } catch (err) { toast('Failed to load data', 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setForm({
      interior_project: '', client: '', invoice_number: '', invoice_date: new Date().toISOString().split('T')[0],
      due_date: '', status: 'draft', notes: '', terms: '',
      sale_items: [{ description: '', quantity: 1, rate: 0, amount: 0, category: 'other' }],
      purchase_items: [],
      expense_items: [],
    });
    setModalOpen(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        sale_items: form.sale_items.filter((i) => i.description),
        purchase_items: form.purchase_items.filter((i) => i.description),
        expense_items: form.expense_items.filter((i) => i.description),
      };
      if (!payload.sale_items.length && !payload.purchase_items.length && !payload.expense_items.length) {
        toast('Add at least one item', 'error'); return;
      }
      await API.post('/interior-invoices', payload);
      toast('Interior invoice created');
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await API.delete(`/interior-invoices/${deleteId}`);
      toast('Invoice deleted');
      setConfirmOpen(false);
      setDeleteId(null);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: (v) => <span className="font-medium text-stone-900">{v || '-'}</span> },
    { key: 'interior_project', label: 'Project', render: (v) => v?.title || '-' },
    { key: 'client', label: 'Client', render: (v) => v?.full_name || '-' },
    { key: 'invoice_date', label: 'Date', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
    { key: 'due_date', label: 'Due', render: (v) => v ? new Date(v).toLocaleDateString('en-IN') : '-' },
    { key: 'total_sale', label: 'Sale Amt', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'profit', label: 'Profit', render: (v) => <span className={profitClass(v)}>₹{(v || 0).toLocaleString()}</span> },
    { key: 'paid_amount', label: 'Paid', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'due_amount', label: 'Due', render: (v) => `₹${(v || 0).toLocaleString()}` },
    { key: 'status', label: 'Status', render: (v) => statusBadge(v) },
  ];

  const totalSale = form.sale_items.reduce((s, i) => s + (parseFloat(i.rate || 0) * parseFloat(i.quantity || 1)), 0);
  const totalPurchase = form.purchase_items.reduce((s, i) => s + (parseFloat(i.rate || 0) * parseFloat(i.quantity || 1)), 0);
  const totalExpense = form.expense_items.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
  const grandProfit = totalSale - totalPurchase - totalExpense;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Interior Invoices</h1>
          <p className="text-stone-500 mt-1">Bifurcated billing with sale/purchase/expense tracking</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          <HiOutlinePlus size={16} /> New Invoice
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
        <StatsCard label="Total Invoices" value={stats.total_invoices} icon={HiOutlineReceiptPercent} />
        <StatsCard label="Total Sale" value={`₹${(stats.total_sale || 0).toLocaleString()}`} icon={HiOutlineCurrencyDollar} color="emerald" />
        <StatsCard label="Total Purchase" value={`₹${(stats.total_purchase || 0).toLocaleString()}`} icon={HiOutlineShoppingCart} color="blue" />
        <StatsCard label="Total Expense" value={`₹${(stats.total_expense || 0).toLocaleString()}`} icon={HiOutlineChartBar} color="amber" />
        <StatsCard label="Net Profit" value={`₹${(stats.total_profit || 0).toLocaleString()}`} icon={HiOutlineChartBar} color={stats.total_profit >= 0 ? 'emerald' : 'red'} />
        <StatsCard label="Total Paid" value={`₹${(stats.total_paid || 0).toLocaleString()}`} icon={HiOutlineCurrencyDollar} color="emerald" />
        <StatsCard label="Total Due" value={`₹${(stats.total_due || 0).toLocaleString()}`} icon={HiOutlineCurrencyDollar} color="red" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <select className={`${inputClass} w-auto min-w-[140px] appearance-none cursor-pointer`} value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Status</option>
          {['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select className={`${inputClass} w-auto min-w-[180px] appearance-none cursor-pointer`} value={filters.interior_project} onChange={(e) => setFilters({ ...filters, interior_project: e.target.value })}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onView={(row) => navigate(`/interior-invoices/${row._id}`)}
        onDelete={(row) => { setDeleteId(row._id); setConfirmOpen(true); }}
      />

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Invoice" message="Are you sure you want to delete this interior invoice?" />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Interior Invoice" size="xl">
        <form onSubmit={handleCreate} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Interior Project *</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.interior_project} onChange={(e) => {
                const proj = projects.find((p) => p._id === e.target.value);
                setForm({ ...form, interior_project: e.target.value, client: proj?.client_id?._id || form.client });
              }} required>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title} ({p.project_code || 'No code'})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice #</label>
              <input className={inputClass} value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} placeholder="Auto-generated if empty" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {['draft', 'sent', 'paid', 'partial'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice Date</label>
              <input type="date" className={inputClass} value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Due Date *</label>
              <input type="date" className={inputClass} value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-base font-semibold text-emerald-700 mb-3 flex items-center gap-2"><HiOutlineCurrencyDollar size={18} /> Sale Items (Revenue)</h3>
            <div className="space-y-2">
              {form.sale_items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input className={`${inputClass} flex-1`} placeholder="Description" value={item.description} onChange={(e) => updateSaleItem(idx, 'description', e.target.value)} required />
                  <input type="number" className={`${inputClass} w-20`} placeholder="Qty" value={item.quantity} onChange={(e) => updateSaleItem(idx, 'quantity', e.target.value)} min="1" />
                  <input type="number" className={`${inputClass} w-24`} placeholder="Rate" value={item.rate} onChange={(e) => updateSaleItem(idx, 'rate', e.target.value)} min="0" step="0.01" />
                  <input className={`${inputClass} w-24`} value={`₹${(parseFloat(item.quantity || 1) * parseFloat(item.rate || 0)).toLocaleString()}`} disabled />
                  <select className={`${inputClass} w-28 appearance-none cursor-pointer`} value={item.category} onChange={(e) => updateSaleItem(idx, 'category', e.target.value)}>
                    {['labor', 'material', 'design', 'consultation', 'other'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSaleItem(idx)} className="p-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSaleItem} className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium cursor-pointer">+ Add Sale Item</button>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-base font-semibold text-blue-700 mb-3 flex items-center gap-2"><HiOutlineShoppingCart size={18} /> Purchase Items (Materials)</h3>
            <div className="space-y-2">
              {form.purchase_items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input className={`${inputClass} flex-1`} placeholder="Description" value={item.description} onChange={(e) => updatePurchaseItem(idx, 'description', e.target.value)} />
                  <input className={`${inputClass} w-28`} placeholder="Vendor" value={item.vendor || ''} onChange={(e) => updatePurchaseItem(idx, 'vendor', e.target.value)} />
                  <input type="number" className={`${inputClass} w-20`} placeholder="Qty" value={item.quantity} onChange={(e) => updatePurchaseItem(idx, 'quantity', e.target.value)} min="1" />
                  <input type="number" className={`${inputClass} w-24`} placeholder="Rate" value={item.rate} onChange={(e) => updatePurchaseItem(idx, 'rate', e.target.value)} min="0" step="0.01" />
                  <input className={`${inputClass} w-24`} value={`₹${(parseFloat(item.quantity || 1) * parseFloat(item.rate || 0)).toLocaleString()}`} disabled />
                  <select className={`${inputClass} w-28 appearance-none cursor-pointer`} value={item.category} onChange={(e) => updatePurchaseItem(idx, 'category', e.target.value)}>
                    {['raw_material', 'furniture', 'fixtures', 'equipment', 'other'].map((c) => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                  </select>
                  <button type="button" onClick={() => removePurchaseItem(idx)} className="p-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPurchaseItem} className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer">+ Add Purchase Item</button>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-base font-semibold text-amber-700 mb-3 flex items-center gap-2"><HiOutlineChartBar size={18} /> Expense Items (Overheads)</h3>
            <div className="space-y-2">
              {form.expense_items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input className={`${inputClass} flex-1`} placeholder="Description" value={item.description} onChange={(e) => updateExpenseItem(idx, 'description', e.target.value)} />
                  <input type="number" className={`${inputClass} w-24`} placeholder="Amount" value={item.amount} onChange={(e) => updateExpenseItem(idx, 'amount', e.target.value)} min="0" step="0.01" />
                  <select className={`${inputClass} w-28 appearance-none cursor-pointer`} value={item.category} onChange={(e) => updateExpenseItem(idx, 'category', e.target.value)}>
                    {['transport', 'labor', 'permit', 'utility', 'miscellaneous'].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="date" className={`${inputClass} w-36`} value={item.date || ''} onChange={(e) => updateExpenseItem(idx, 'date', e.target.value)} />
                  <button type="button" onClick={() => removeExpenseItem(idx)} className="p-2.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={16} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addExpenseItem} className="mt-2 text-sm text-amber-600 hover:text-amber-700 font-medium cursor-pointer">+ Add Expense Item</button>
          </div>

          <div className="border-t border-stone-200 pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-emerald-50">
                <p className="text-emerald-600 font-semibold text-xs uppercase">Total Sale</p>
                <p className="text-lg font-bold text-emerald-800">₹{totalSale.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-50">
                <p className="text-blue-600 font-semibold text-xs uppercase">Total Purchase</p>
                <p className="text-lg font-bold text-blue-800">₹{totalPurchase.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50">
                <p className="text-amber-600 font-semibold text-xs uppercase">Total Expense</p>
                <p className="text-lg font-bold text-amber-800">₹{totalExpense.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-stone-50">
                <p className="text-stone-600 font-semibold text-xs uppercase">Net Profit</p>
                <p className={`text-lg font-bold ${grandProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>₹{grandProfit.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Terms</label><textarea className={inputClass} rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} /></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Create Invoice</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
