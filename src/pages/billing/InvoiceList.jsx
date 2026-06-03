import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cancelled: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};
const statuses = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
const paymentModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

export default function InvoiceList() {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    client_id: '', property_id: '', invoice_type: 'sale', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0, tax_percentage: 0, tax_amount: 0, total_amount: 0,
    payment_mode: '', notes: '', terms: ''
  });
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterClient) params.append('client_id', filterClient);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const qs = params.toString();
      const [dRes, cRes, pRes] = await Promise.all([
        API.get(`/invoices${qs ? `?${qs}` : ''}`),
        API.get('/clients'),
        API.get('/properties'),
      ]);
      setData(dRes.data);
      setClients(cRes.data);
      setProperties(pRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterClient, dateFrom, dateTo]);

  const calcItems = (items) => items.map((item) => ({ ...item, amount: (Number(item.quantity) || 0) * (Number(item.rate) || 0) }));
  const calcTotals = (items, taxPct) => {
    const subtotal = items.reduce((sum, i) => sum + (i.amount || 0), 0);
    const taxAmount = subtotal * (Number(taxPct) || 0) / 100;
    return { subtotal, tax_amount: taxAmount, total_amount: subtotal + taxAmount };
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, amount: 0 }] });
  const removeItem = (idx) => {
    const items = form.items.filter((_, i) => i !== idx);
    const calc = calcTotals(calcItems(items), form.tax_percentage);
    setForm({ ...form, items: calcItems(items), ...calc });
  };
  const updateItem = (idx, field, value) => {
    const items = form.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    const calcItemsResult = calcItems(items);
    const calc = calcTotals(calcItemsResult, form.tax_percentage);
    setForm({ ...form, items: calcItemsResult, ...calc });
  };

  const handleTaxChange = (value) => {
    const calc = calcTotals(calcItems(form.items), value);
    setForm({ ...form, tax_percentage: value, ...calc });
  };

  const resetForm = () => setForm({
    client_id: '', property_id: '', invoice_type: 'sale', issue_date: new Date().toISOString().split('T')[0],
    due_date: '', items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0, tax_percentage: 0, tax_amount: 0, total_amount: 0,
    payment_mode: '', notes: '', terms: ''
  });

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        items: form.items.filter(i => i.description),
        subtotal: Number(form.subtotal),
        tax_percentage: Number(form.tax_percentage),
        tax_amount: Number(form.tax_amount),
        total_amount: Number(form.total_amount),
      };
      if (selected) {
        await API.put(`/invoices/${selected._id}`, payload);
        toast('Invoice updated');
      } else {
        await API.post('/invoices', payload);
        toast('Invoice created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/invoices/${selected._id}`); toast('Invoice deleted'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const handleSend = async (row) => {
    try { await API.put(`/invoices/${row._id}`, { status: 'sent' }); toast('Invoice sent'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const openPayment = (row) => {
    setSelected(row);
    setPaymentForm({ amount: row.due_amount || row.total_amount, payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' });
    setPaymentModal(true);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/payments', {
        invoice_id: selected._id,
        client_id: selected.client_id?._id || selected.client_id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_mode: paymentForm.payment_mode,
        reference_no: paymentForm.reference_no,
        status: 'completed'
      });
      await API.put(`/invoices/${selected._id}`, { status: 'paid' });
      toast('Payment recorded');
      setPaymentModal(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const columns = [
    { header: 'Invoice #', accessor: 'invoice_number' },
    { header: 'Client', render: (r) => r.client_id?.full_name || r.client_id?.name || '-' },
    { header: 'Issue Date', render: (r) => r.issue_date ? new Date(r.issue_date).toLocaleDateString() : '-' },
    { header: 'Due Date', render: (r) => r.due_date ? new Date(r.due_date).toLocaleDateString() : '-' },
    { header: 'Total', render: (r) => r.total_amount ? `₹${r.total_amount.toLocaleString()}` : '-' },
    { header: 'Paid', render: (r) => r.paid_amount ? `₹${r.paid_amount.toLocaleString()}` : '₹0' },
    { header: 'Due', render: (r) => r.due_amount ? `₹${r.due_amount.toLocaleString()}` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Invoices</h1><p className="text-stone-500 mt-1">Manage billing and invoices</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ New Invoice</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={(r) => { setSelected(r); setForm({
          client_id: r.client_id?._id || r.client_id || '',
          property_id: r.property_id?._id || r.property_id || '',
          invoice_type: r.invoice_type || 'sale',
          issue_date: r.issue_date ? r.issue_date.split('T')[0] : '',
          due_date: r.due_date ? r.due_date.split('T')[0] : '',
          items: r.items?.length ? r.items.map(i => ({ description: i.description, quantity: i.quantity, rate: i.rate, amount: i.amount })) : [{ description: '', quantity: 1, rate: 0, amount: 0 }],
          subtotal: r.subtotal || 0, tax_percentage: r.tax_percentage || 0, tax_amount: r.tax_amount || 0, total_amount: r.total_amount || 0,
          payment_mode: r.payment_mode || '', notes: r.notes || '', terms: r.terms || ''
        }); setModalOpen(true); }}
        onDelete={(r) => { if (r.status !== 'draft') { toast('Only draft invoices can be deleted', 'warning'); return; } setSelected(r); setConfirmOpen(true); }}
      />

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Actions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Invoice</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-14 text-center text-stone-400">No invoices</td></tr>
              ) : data.map((row) => (
                <tr key={row._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{row.invoice_number || '-'}</td>
                  <td className="px-5 py-3.5 text-stone-700">{row.client_id?.full_name || row.client_id?.name || '-'}</td>
                  <td className="px-5 py-3.5"><span className={statusColors[row.status]}>{row.status}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.status === 'draft' && (
                        <button onClick={() => handleSend(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">Send</button>
                      )}
                      {(row.status === 'sent' || row.status === 'partial' || row.status === 'overdue') && (
                        <button onClick={() => openPayment(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all">Mark Paid</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Invoice' : 'New Invoice'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
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
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.invoice_type} onChange={(e) => setForm({ ...form, invoice_type: e.target.value })}>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
                <option value="service">Service</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Issue Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Due Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                <option value="">Select</option>
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-stone-700">Invoice Items</label>
              <button type="button" onClick={addItem} className="text-xs font-semibold text-blue-700 hover:text-blue-800">+ Add Item</button>
            </div>
            <div className="space-y-2">
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input placeholder="Description" className="flex-1 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} />
                  <input type="number" placeholder="Qty" className="w-16 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} min="1" />
                  <input type="number" placeholder="Rate" className="w-24 px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} min="0" step="0.01" />
                  <span className="px-3 py-2 text-sm text-stone-700 font-medium whitespace-nowrap">₹{(item.amount || 0).toLocaleString()}</span>
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="p-2 text-red-400 hover:text-red-600 transition-colors">✕</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Subtotal</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 font-medium" value={`₹${(form.subtotal || 0).toLocaleString()}`} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tax (%)</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.tax_percentage} onChange={(e) => handleTaxChange(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Tax Amount</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-700 font-medium" value={`₹${(form.tax_amount || 0).toLocaleString()}`} readOnly />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Amount</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-900 font-bold" value={`₹${(form.total_amount || 0).toLocaleString()}`} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
              <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Terms</label>
              <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create Invoice'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment" size="sm">
        <form onSubmit={handlePayment} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference No</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.reference_no} onChange={(e) => setPaymentForm({ ...paymentForm, reference_no: e.target.value })} placeholder="Cheque/UTR no." />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Record Payment</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Invoice" message="Are you sure you want to delete this draft invoice?" />
    </div>
  );
}
