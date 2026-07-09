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
    client_id: '', invoice_id: '', amount: '', payment_reason: '', payment_status: 'paid',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', purchaser_name: '', paid_by: '', credited_to: '', remarks: '',
    utr_number: '', reference_number: '', transaction_id: '',
    bank_name: '', cheque_number: '', cheque_date: '', notes: ''
  });
  const [paymentReasonsList, setPaymentReasonsList] = useState([]);

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
      const [dRes, iRes, cRes, reasonsRes] = await Promise.all([
        API.get(`/payments${qs ? `?${qs}` : ''}`),
        API.get('/invoices'),
        API.get('/clients'),
        API.get('/payments/reasons'),
      ]);
      setData(dRes.data);
      setInvoices(iRes.data);
      setClients(cRes.data);
      if (reasonsRes.data) setPaymentReasonsList(Array.isArray(reasonsRes.data) ? reasonsRes.data : []);
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterMode, filterClient, dateFrom, dateTo]);

  const resetForm = () => setForm({
    client_id: '', invoice_id: '', amount: '', payment_reason: '', payment_status: 'paid',
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', purchaser_name: '', paid_by: '', credited_to: '', remarks: '',
    utr_number: '', reference_number: '', transaction_id: '',
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
        client_id: form.client_id || undefined,
        utr_number: form.utr_number || undefined,
        purchaser_name: form.purchaser_name || undefined,
      };
      if (form.payment_status === 'due') {
        payload.payment_mode = undefined;
        payload.paid_by = undefined;
        payload.credited_to = undefined;
        payload.reference_number = undefined;
      }
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
    { header: 'Reason', render: (r) => r.payment_reason || r.reason || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-' },
    { header: 'Status', render: (r) => {
      const isPaid = r.payment_status === 'paid' || r.status === 'completed';
      return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>{isPaid ? 'Paid' : 'Due'}</span>;
    }},
    { header: 'Mode', render: (r) => {
      const isPaid = r.payment_status === 'paid' || r.status === 'completed';
      return isPaid ? <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.payment_mode?.replace(/_/g, ' ') || '-'}</span> : <span className="text-xs text-stone-400">-</span>;
    }},
    { header: 'Ref No', render: (r) => r.reference_number || r.utr_number || '-' },
    { header: 'Paid By', render: (r) => r.paid_by || r.purchaser_name || '-' },
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
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Reason</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_reason} onChange={(e) => setForm({ ...form, payment_reason: e.target.value })}>
                <option value="">Select reason</option>
                {paymentReasonsList.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.invoice_id} onChange={(e) => handleInvoiceChange(e.target.value)}>
                <option value="">Select invoice</option>
                {invoices.map((inv) => <option key={inv._id} value={inv._id}>{inv.invoice_number} - ₹{(inv.due_amount || inv.total_amount || 0).toLocaleString()}</option>)}
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
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Status</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Date</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            {form.payment_status === 'paid' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference Number</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} placeholder="UTR/Cheque/Ref no." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Person Who Made Payment</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.paid_by || form.purchaser_name} onChange={(e) => setForm({ ...form, paid_by: e.target.value, purchaser_name: e.target.value })} placeholder="Name of the person" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Credited To</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.credited_to} onChange={(e) => setForm({ ...form, credited_to: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Company Account">Company Account</option>
                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                    <option value="Bank Account">Bank Account</option>
                  </select>
                </div>
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Remarks</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.remarks || form.notes} onChange={(e) => setForm({ ...form, remarks: e.target.value, notes: e.target.value })} />
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
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Reason</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_reason || viewPayment.reason || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Amount</p><p className="text-sm font-medium text-stone-900 mt-1">₹{viewPayment.amount?.toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Payment Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${(viewPayment.payment_status === 'paid' || viewPayment.status === 'completed') ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                  {viewPayment.payment_status === 'paid' || viewPayment.status === 'completed' ? 'Paid' : 'Due'}
                </span>
              </div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Date</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString() : '-'}</p></div>
              {(viewPayment.payment_status === 'paid' || viewPayment.status === 'completed') && (
                <>
                  <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Mode</p><p className="text-sm font-medium text-stone-900 mt-1 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ') || '-'}</p></div>
                  <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Reference No</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.reference_number || viewPayment.utr_number || '-'}</p></div>
                  <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Paid By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.paid_by || viewPayment.purchaser_name || '-'}</p></div>
                  <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Credited To</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.credited_to || '-'}</p></div>
                </>
              )}
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Invoice</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.invoice_id?.invoice_number || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Processed By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.processed_by?.full_name || '-'}</p></div>
            </div>

            {viewPayment.remarks && (
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Remarks</p><p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3">{viewPayment.remarks}</p></div>
            )}

            {(viewPayment.payment_status === 'paid' || viewPayment.status === 'completed') && viewPayment.receipt_screenshot && (
              <div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-2">Receipt Screenshot</p>
                <a href={viewPayment.receipt_screenshot} target="_blank" rel="noopener noreferrer">
                  <img src={viewPayment.receipt_screenshot} alt="Receipt" className="max-h-48 rounded-xl border border-stone-200 object-contain bg-stone-50" />
                </a>
              </div>
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
              <div className="text-center border-b border-stone-200 pb-6 mb-6">
                <h2 className="text-xl font-bold text-stone-900">Payment Receipt</h2>
                <h3 className="text-lg font-bold text-stone-900 mt-3 uppercase tracking-wider">PAYMENT RECEIPT</h3>
                <p className="text-xs text-stone-400">Receipt #{viewPayment.receipt_number || viewPayment.payment_number}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-stone-400 text-xs">Date</p>
                  <p className="font-semibold text-stone-900">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-400 text-xs">Payment Mode</p>
                  <p className="font-semibold text-stone-900 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
              </div>
              <div className="border-t border-stone-100 pt-4 mb-4">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Received From</h3>
                <p className="text-base font-bold text-stone-900">{viewPayment.paid_by || viewPayment.purchaser_name || viewPayment.client_id?.full_name || '-'}</p>
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
                    <td className="py-3 text-stone-700">{viewPayment.payment_reason || viewPayment.reason || 'Payment Amount'}</td>
                    <td className="py-3 text-right font-semibold text-stone-900">{viewPayment.amount?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-bold text-stone-900">Total Amount</td>
                    <td className="py-3 text-right text-base font-bold text-stone-900">₹{(viewPayment.amount || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              {viewPayment.reference_number && (
                <div className="text-xs text-stone-400 border-t border-stone-100 pt-4">
                  <p>Ref: {viewPayment.reference_number}</p>
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

