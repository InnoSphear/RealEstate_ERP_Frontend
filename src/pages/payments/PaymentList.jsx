import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  refunded: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  bounced: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};
const statuses = ['pending', 'completed', 'failed', 'refunded', 'bounced'];
const paymentModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

export default function PaymentList() {
  const [data, setData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    client_id: '', invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', reference_number: '', transaction_id: '',
    bank_name: '', cheque_number: '', cheque_date: '', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterMode) params.append('payment_mode', filterMode);
      if (filterClient) params.append('client_id', filterClient);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const qs = params.toString();
      const [dRes, iRes, cRes] = await Promise.all([
        API.get(`/payments${qs ? `?${qs}` : ''}`),
        API.get('/invoices'),
        API.get('/clients'),
      ]);
      setData(dRes.data);
      setInvoices(iRes.data);
      setClients(cRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterMode, filterClient, dateFrom, dateTo]);

  const resetForm = () => setForm({
    client_id: '', invoice_id: '', amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', reference_number: '', transaction_id: '',
    bank_name: '', cheque_number: '', cheque_date: '', notes: ''
  });

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const handleInvoiceChange = (invoiceId) => {
    const inv = invoices.find((i) => i._id === invoiceId);
    setForm({
      ...form,
      invoice_id: invoiceId,
      client_id: inv?.client_id?._id || inv?.client_id || form.client_id,
      amount: inv?.due_amount || inv?.total_amount || form.amount
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, amount: Number(form.amount), client_id: form.client_id || undefined };
      if (selected) { await API.put(`/payments/${selected._id}`, payload); toast('Payment updated'); }
      else { await API.post('/payments', payload); toast('Payment created'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/payments/${selected._id}`); toast('Payment deleted'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Payment #', accessor: 'payment_number' },
    { header: 'Client', render: (r) => r.client_id?.full_name || r.client_id?.name || '-' },
    { header: 'Invoice', render: (r) => r.invoice_id?.invoice_number || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-' },
    { header: 'Mode', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.payment_mode?.replace(/_/g, ' ')}</span> },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Reference', accessor: 'reference_number' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Payments</h1><p className="text-stone-500 mt-1">Track all incoming and outgoing payments</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ New Payment</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterMode} onChange={(e) => setFilterMode(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Modes</option>
          {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} onView={(r) => { setViewPayment(r); setViewModalOpen(true); }} onEdit={openCreate} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Payment' : 'New Payment'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.invoice_id} onChange={(e) => handleInvoiceChange(e.target.value)} required>
                <option value="">Select invoice</option>
                {invoices.map((inv) => <option key={inv._id} value={inv._id}>{inv.invoice_number} - ₹{(inv.due_amount || inv.total_amount || 0).toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Auto from invoice</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })} required>
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference Number</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="Cheque/UTR no." />
            </div>
            {form.payment_mode === 'bank_transfer' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Transaction ID</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.transaction_id} onChange={(e) => setForm({ ...form, transaction_id: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Bank Name</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} />
                </div>
              </>
            )}
            {form.payment_mode === 'cheque' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Cheque Number</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.cheque_number} onChange={(e) => setForm({ ...form, cheque_number: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Cheque Date</label>
                  <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.cheque_date} onChange={(e) => setForm({ ...form, cheque_date: e.target.value })} />
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Record Payment'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Payment" message="Are you sure you want to delete this payment?" />

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title={`Payment ${viewPayment?.payment_number || ''}`} size="lg">
        {viewPayment && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Client</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.client_id?.full_name || viewPayment.client_id?.name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Amount</p><p className="text-sm font-medium text-stone-900 mt-1">₹{viewPayment.amount?.toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Date</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString() : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Mode</p><p className="text-sm font-medium text-stone-900 mt-1 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</p><span className={statusColors[viewPayment.status]}>{viewPayment.status}</span></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Invoice</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.invoice_id?.invoice_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Reference</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.reference_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Processed By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.processed_by?.full_name || '-'}</p></div>
            </div>
            {viewPayment.notes && (
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3">{viewPayment.notes}</p></div>
            )}
            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Timeline</p>
              <div className="space-y-0">
                {(viewPayment.timeline || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((entry, i) => (
                  <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ring-2 ring-white z-10 ${entry.action === 'created' ? 'bg-emerald-500' : entry.action === 'status_changed' ? 'bg-amber-500' : entry.action === 'deleted' ? 'bg-red-500' : 'bg-stone-400'}`} />
                      {i < (viewPayment.timeline || []).length - 1 && <div className="w-0.5 flex-1 bg-stone-200 -mt-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-900 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{entry.description}</p>
                      <p className="text-xs text-stone-400 mt-0.5">
                        {new Date(entry.createdAt).toLocaleString()}
                        {entry.changed_by_name ? ` by ${entry.changed_by_name}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
                {(viewPayment.timeline || []).length === 0 && (
                  <p className="text-sm text-stone-400 text-center py-4">No timeline entries</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
