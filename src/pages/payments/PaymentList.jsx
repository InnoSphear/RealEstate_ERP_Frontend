import { useState, useEffect, useRef } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/logo.jpeg';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  failed: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  refunded: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  bounced: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};
const statuses = ['pending', 'completed', 'failed', 'refunded', 'bounced'];
const paymentModes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

const timelineDotColor = (action) => {
  const map = {
    created: 'bg-emerald-500',
    status_changed: 'bg-amber-500',
    amount_changed: 'bg-blue-500',
    mode_changed: 'bg-violet-500',
    notes_updated: 'bg-stone-500',
    deleted: 'bg-red-500',
    receipt_uploaded: 'bg-sky-500',
    payer_updated: 'bg-teal-500',
    utr_updated: 'bg-indigo-500',
  };
  return map[action] || 'bg-stone-400';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}, ${hours}:${mins}`;
};

export default function PaymentList() {
  const [data, setData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [billView, setBillView] = useState(false);
  const billRef = useRef(null);

  const downloadBillPdf = async () => {
    if (!billRef.current) return;
    try {
      const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${viewPayment?.payment_number || 'payment'}.pdf`);
    } catch {
      toast('Failed to generate PDF', 'error');
    }
  };
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    client_id: '', invoice_id: '', amount: '', security_deposit: '', brokerage: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', purchaser_name: '', utr_number: '', reference_number: '', transaction_id: '',
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
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterMode, filterClient, dateFrom, dateTo]);

  const resetForm = () => setForm({
    client_id: '', invoice_id: '', amount: '', security_deposit: '', brokerage: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', purchaser_name: '', utr_number: '', reference_number: '', transaction_id: '',
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
      const payload = {
        ...form,
        amount: Number(form.amount),
        security_deposit: form.security_deposit ? Number(form.security_deposit) : 0,
        brokerage: form.brokerage ? Number(form.brokerage) : 0,
        client_id: form.client_id || undefined,
        utr_number: form.utr_number || undefined,
        purchaser_name: form.purchaser_name || undefined,
      };
      if (selected) { await API.put(`/payments/${selected._id}`, payload); toast('Payment updated'); }
      else { await API.post('/payments', payload); toast('Payment created'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleReceiptUpload = async (paymentId, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('receipt', file);
      await API.post(`/payments/${paymentId}/upload-receipt`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast('Receipt uploaded');
      fetchData();
      if (viewPayment?._id === paymentId) {
        const updated = await API.get(`/payments/${paymentId}`);
        setViewPayment(updated.data);
      }
    } catch (err) { toast(err.response?.data?.message || 'Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/payments/${selected._id}`); toast('Payment deleted'); fetchData(); }
    catch { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Payment #', accessor: 'payment_number' },
    { header: 'Client', render: (r) => r.client_id?.full_name || r.client_id?.name || '-' },
    { header: 'Payer', render: (r) => r.purchaser_name || '-' },
    { header: 'Invoice', render: (r) => r.invoice_id?.invoice_number || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Security Deposit', render: (r) => r.security_deposit ? `₹${r.security_deposit.toLocaleString()}` : '-' },
    { header: 'Brokerage', render: (r) => r.brokerage ? `₹${r.brokerage.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-' },
    { header: 'Mode', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.payment_mode?.replace(/_/g, ' ')}</span> },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'UTR/Ref', render: (r) => r.utr_number || r.reference_number || '-' },
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
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Purchaser Name</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.purchaser_name} onChange={(e) => setForm({ ...form, purchaser_name: e.target.value })} placeholder="Who made the payment" />
            </div>
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
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Security Deposit (₹)</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} placeholder="Goes to flat owner" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Brokerage (₹)</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.brokerage} onChange={(e) => setForm({ ...form, brokerage: e.target.value })} />
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
            {form.payment_mode === 'bank_transfer' && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">UTR Number</label>
                <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.utr_number} onChange={(e) => setForm({ ...form, utr_number: e.target.value })} placeholder="Bank transfer UTR" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference Number</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="Cheque/Ref no." />
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

      <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setBillView(false); }} title={billView ? `Bill - ${viewPayment?.payment_number || ''}` : `Payment ${viewPayment?.payment_number || ''}`} size="lg">
        {viewPayment && !billView && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setBillView(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                View Bill
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Client</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.client_id?.full_name || viewPayment.client_id?.name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Purchaser</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.purchaser_name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Amount</p><p className="text-sm font-medium text-stone-900 mt-1">₹{viewPayment.amount?.toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Security Deposit</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.security_deposit ? `₹${viewPayment.security_deposit.toLocaleString()}` : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Brokerage</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.brokerage ? `₹${viewPayment.brokerage.toLocaleString()}` : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Date</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString() : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Mode</p><p className="text-sm font-medium text-stone-900 mt-1 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Status</p><span className={statusColors[viewPayment.status]}>{viewPayment.status}</span></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Invoice</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.invoice_id?.invoice_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">UTR Number</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.utr_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Reference</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.reference_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Processed By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.processed_by?.full_name || '-'}</p></div>
            </div>

            {viewPayment.receipt_screenshot && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Receipt Screenshot</p>
                <a href={viewPayment.receipt_screenshot} target="_blank" rel="noopener noreferrer">
                  <img src={viewPayment.receipt_screenshot} alt="Receipt" className="max-h-48 rounded-xl border border-stone-200 object-contain bg-stone-50" />
                </a>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Receipt Upload</p>
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed border-stone-300 bg-stone-50 cursor-pointer hover:bg-stone-100 transition-colors">
                <span className="text-sm text-stone-500">{uploading ? 'Uploading...' : 'Choose receipt file'}</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => {
                    if (e.target.files[0]) handleReceiptUpload(viewPayment._id, e.target.files[0]);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {viewPayment.reference_docs?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Reference Documents</p>
                <div className="space-y-1.5">
                  {viewPayment.reference_docs.map((doc, i) => (
                    <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-700 hover:text-stone-900 bg-stone-50 rounded-lg px-3 py-2 hover:bg-stone-100 transition-colors">
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="truncate">{doc.name}</span>
                      {doc.type && <span className="text-xs text-stone-400 uppercase shrink-0">.{doc.type}</span>}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {viewPayment.notes && (
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3">{viewPayment.notes}</p></div>
            )}

            <div>
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Timeline</p>
              <div className="space-y-0">
                {(viewPayment.timeline || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((entry, i) => (
                  <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full mt-1.5 ring-2 ring-white z-10 ${timelineDotColor(entry.action)}`} />
                      {i < (viewPayment.timeline || []).length - 1 && <div className="w-0.5 flex-1 bg-stone-200 -mt-0.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900 capitalize">{entry.action?.replace(/_/g, ' ')}</p>
                        <span className="text-xs text-stone-400">{formatDate(entry.createdAt)}</span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5">{entry.description}</p>
                      {entry.changed_by_name && (
                        <p className="text-xs text-stone-400 mt-0.5">by {entry.changed_by_name}</p>
                      )}
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
        {viewPayment && billView && (
          <div className="space-y-6" id="payment-bill">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setBillView(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors">
                ← Back to Details
              </button>
              <button onClick={downloadBillPdf} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                <HiOutlineArrowDownTray size={14} /> Download PDF
              </button>
            </div>
            <div ref={billRef} className="border border-stone-200 rounded-2xl p-8 bg-white">
              <div className="flex items-center gap-4 border-b border-stone-200 pb-6 mb-6">
                <img src={logo} alt="Shivam International" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Shivam International</h2>
                  <p className="text-xs text-stone-500">Real Estate & Interior Solutions</p>
                </div>
                <div className="ml-auto text-right">
                  <h3 className="text-lg font-bold text-stone-900">PAYMENT RECEIPT</h3>
                  <p className="text-xs text-stone-400">Receipt #{viewPayment.payment_number}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-stone-400 text-xs">Date</p>
                  <p className="font-semibold text-stone-900">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-400 text-xs">Payment Mode</p>
                  <p className="font-semibold text-stone-900 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="border-t border-stone-100 pt-4 mb-4">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Received From</h3>
                <p className="text-base font-bold text-stone-900">{viewPayment.purchaser_name || viewPayment.client_id?.full_name || '-'}</p>
                {viewPayment.client_id?.mobile && <p className="text-sm text-stone-500">{viewPayment.client_id.mobile}</p>}
              </div>
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 text-stone-400 font-semibold text-xs uppercase">Description</th>
                    <th className="text-right py-2 text-stone-400 font-semibold text-xs uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-3 text-stone-700">Payment Amount</td>
                    <td className="py-3 text-right font-semibold text-stone-900">{viewPayment.amount?.toLocaleString()}</td>
                  </tr>
                  {viewPayment.security_deposit > 0 && (
                    <tr className="border-b border-stone-100">
                      <td className="py-3 text-stone-700">Security Deposit (refundable)</td>
                      <td className="py-3 text-right font-semibold text-stone-900">{viewPayment.security_deposit?.toLocaleString()}</td>
                    </tr>
                  )}
                  {viewPayment.brokerage > 0 && (
                    <tr className="border-b border-stone-100">
                      <td className="py-3 text-stone-700">Brokerage / Commission</td>
                      <td className="py-3 text-right font-semibold text-stone-900">{viewPayment.brokerage?.toLocaleString()}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 text-sm font-bold text-stone-900">Total Amount</td>
                    <td className="py-3 text-right text-base font-bold text-stone-900">₹{((viewPayment.amount || 0) + (viewPayment.security_deposit || 0) + (viewPayment.brokerage || 0)).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              {viewPayment.utr_number && (
                <div className="text-xs text-stone-400 border-t border-stone-100 pt-4">
                  <p>UTR: {viewPayment.utr_number}</p>
                </div>
              )}
              <div className="text-center text-xs text-stone-400 mt-6 pt-4 border-t border-stone-100">
                <p>This is a computer-generated receipt</p>
                <p>Processed by: {viewPayment.processed_by?.full_name || 'System'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

