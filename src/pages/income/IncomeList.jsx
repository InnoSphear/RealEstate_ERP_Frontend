import { useState, useEffect } from 'react';
import { HiOutlineBanknotes, HiOutlineHome, HiOutlineBuildingOffice2, HiOutlineCurrencyDollar, HiOutlinePlus } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const categories = ['sale', 'rent', 'service', 'commission', 'interest', 'other', 'brokerage', 'property_sale', 'interior_services', 'consultation'];
const paymentModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

const sectionConfig = {
  interior: { icon: HiOutlineBuildingOffice2, color: 'blue' },
  rent: { icon: HiOutlineHome, color: 'emerald' },
  sale: { icon: HiOutlineCurrencyDollar, color: 'amber' },
  other: { icon: HiOutlineBanknotes, color: 'stone' },
};

export default function IncomeList() {
  const [groupedData, setGroupedData] = useState(null);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    category: 'sale', amount: '', date: new Date().toISOString().split('T')[0],
    description: '', client_id: '', property_id: '', payment_mode: 'cash', reference: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('from_date', dateFrom);
      if (dateTo) params.append('to_date', dateTo);
      const qs = params.toString();
      const [gRes, cRes, pRes] = await Promise.all([
        API.get(`/income/grouped${qs ? `?${qs}` : ''}`),
        API.get('/clients'),
        API.get('/properties'),
      ]);
      setGroupedData(gRes.data);
      setClients(cRes.data);
      setProperties(pRes.data);
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [dateFrom, dateTo]);

  const resetForm = () => setForm({
    category: 'sale', amount: '', date: new Date().toISOString().split('T')[0],
    description: '', client_id: '', property_id: '', payment_mode: 'cash', reference: '',
  });

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount) };
      if (selected) { await API.put(`/income/${selected._id}`, payload); toast('Income updated'); }
      else { await API.post('/income', payload); toast('Income recorded'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const colorClasses = {
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: 'text-blue-600', dark: 'text-blue-900', label: 'text-blue-700/70' },
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-600', dark: 'text-emerald-900', label: 'text-emerald-700/70' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-600', dark: 'text-amber-900', label: 'text-amber-700/70' },
    stone: { bg: 'bg-stone-50', border: 'border-stone-200', text: 'text-stone-700', icon: 'text-stone-600', dark: 'text-stone-900', label: 'text-stone-500' },
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>;
  }

  const groups = groupedData?.groups || {};
  const totals = groupedData?.totals || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Income</h1><p className="text-stone-500 mt-1">Income grouped by source with net calculation</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={16} /> Add Income</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {Object.entries(groups).map(([key, group]) => {
          const cfg = sectionConfig[key] || sectionConfig.other;
          const cc = colorClasses[cfg.color];
          const Icon = cfg.icon;
          return (
            <div key={key} className={`p-5 rounded-2xl ${cc.bg} ${cc.border} border cursor-pointer hover:shadow-md transition-shadow`} onClick={() => setActiveSection(activeSection === key ? null : key)}>
              <div className="flex items-center justify-between mb-3">
                <Icon size={22} className={cc.icon} />
                <span className="text-xs font-semibold text-stone-400">{group.count} entries</span>
              </div>
              <p className={`text-xs font-semibold uppercase tracking-wider ${cc.label}`}>{group.label}</p>
              <p className={`text-xl font-bold ${cc.dark} mt-1`}>₹{(group.total_income || 0).toLocaleString()}</p>
              <div className="mt-2 pt-2 border-t border-white/50 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-stone-500">Less Expenses</span><span className="text-red-600 font-medium">-₹{(group.allocated_expenses || 0).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-stone-500">Less Purchases</span><span className="text-red-600 font-medium">-₹{(group.allocated_purchases || 0).toLocaleString()}</span></div>
                <div className="flex justify-between pt-1 border-t border-white/50 font-semibold">
                  <span className="text-stone-700">Net Income</span>
                  <span className={(group.net_income || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}>₹{(group.net_income || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 rounded-2xl bg-white border border-stone-200">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Overall Summary</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><p className="text-sm text-stone-500">Total Income</p><p className="text-lg font-bold text-stone-900">₹{(totals.total_income || 0).toLocaleString()}</p></div>
          <div><p className="text-sm text-stone-500">Total Expenses</p><p className="text-lg font-bold text-red-700">-₹{(totals.total_expenses || 0).toLocaleString()}</p></div>
          <div><p className="text-sm text-stone-500">Total Purchases</p><p className="text-lg font-bold text-red-700">-₹{(totals.total_purchases || 0).toLocaleString()}</p></div>
          <div><p className="text-sm text-stone-500">Net Overall</p><p className={`text-lg font-bold ${((totals.total_income || 0) - (totals.total_expenses || 0) - (totals.total_purchases || 0)) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            ₹{((totals.total_income || 0) - (totals.total_expenses || 0) - (totals.total_purchases || 0)).toLocaleString()}
          </p></div>
        </div>
      </div>

      {activeSection && groups[activeSection] && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h3 className="font-semibold text-stone-900">{groups[activeSection].label} — Entries</h3>
            <span className="text-sm text-stone-400">{groups[activeSection].count} records</span>
          </div>
          {groups[activeSection].incomes.length === 0 ? (
            <div className="text-center py-10 text-stone-400"><p>No income entries in this category</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Income No.</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Description</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Client</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Mode</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {groups[activeSection].incomes.map((inc, idx) => (
                    <tr key={inc._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-stone-400">{idx + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-stone-600">{inc.income_number}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-700 ring-1 ring-stone-200 capitalize">{inc.category?.replace(/_/g, ' ')}</span></td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-stone-900">₹{(inc.amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-stone-600">{inc.date ? formatDate(inc.date) : '-'}</td>
                      <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">{inc.description || '-'}</td>
                      <td className="px-4 py-3 text-stone-700">{inc.client?.full_name || '-'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 ring-1 ring-stone-200 capitalize">{inc.payment_mode?.replace(/_/g, ' ') || '-'}</span></td>
                      <td className="px-4 py-3 text-stone-500">{inc.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Income' : 'Record Income'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Category *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {categories.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Select client</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property_id} onChange={(e) => setForm({ ...form, property_id: e.target.value })}>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.title || p.location}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Invoice/Receipt no." />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Record Income'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

