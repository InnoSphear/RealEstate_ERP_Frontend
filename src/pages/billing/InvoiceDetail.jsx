import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cancelled: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const paymentModeColors = {
  cash: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  bank_transfer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cheque: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  upi: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  card: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' });
  const [timelinePayment, setTimelinePayment] = useState(null);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const [iRes, pRes] = await Promise.all([
        API.get(`/invoices/${id}`),
        API.get(`/payments/by-invoice/${id}`),
      ]);
      setInvoice(iRes.data);
      setPayments(pRes.data);
    } catch (err) { toast('Failed to load invoice', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchInvoice(); }, [id]);

  const handleDownload = () => window.print();

  const handleSendEmail = async () => {
    try { await API.post(`/invoices/${id}/send-email`); toast('Email sent'); }
    catch (err) { toast('Error sending email', 'error'); }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await API.post('/payments', {
        invoice_id: id,
        client_id: invoice.client_id?._id || invoice.client_id,
        amount: Number(paymentForm.amount),
        payment_date: paymentForm.payment_date,
        payment_mode: paymentForm.payment_mode,
        reference_no: paymentForm.reference_no,
        status: 'completed'
      });
      toast('Payment recorded');
      setPaymentModal(false);
      fetchInvoice();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleMarkOverdue = async () => {
    try { await API.put(`/invoices/${id}`, { status: 'overdue' }); toast('Marked as overdue'); fetchInvoice(); }
    catch (err) { toast('Error', 'error'); }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-10 flex items-center justify-center">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!invoice) return <p className="text-stone-500">Invoice not found</p>;

  const formatCurrency = (val) => val ? `₹${val.toLocaleString()}` : '₹0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
          </button>
          <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Invoice {invoice.invoice_number}</h1><p className="text-stone-500 mt-1">Invoice details and payment tracking</p></div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownload} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Download PDF</button>
          <button onClick={handleSendEmail} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Send Email</button>
          <button onClick={() => { setPaymentForm({ amount: invoice.due_amount || invoice.total_amount, payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference_no: '' }); setPaymentModal(true); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20">Record Payment</button>
          {invoice.status !== 'overdue' && invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
            <button onClick={handleMarkOverdue} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-red-600 hover:bg-red-50 border border-red-200">Mark Overdue</button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-8 print:border-0 print:shadow-none">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-stone-900 mb-1">INVOICE</h2>
            <p className="text-stone-500 text-sm">#{invoice.invoice_number}</p>
          </div>
          <div className="text-right mt-4 sm:mt-0">
            <p className="text-sm text-stone-500">Status: <span className={statusColors[invoice.status]}>{invoice.status}</span></p>
            <p className="text-sm text-stone-500 mt-1">Issue Date: {invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString() : '-'}</p>
            <p className="text-sm text-stone-500">Due Date: {invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-stone-100">
          <div>
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Client</h3>
            <p className="text-sm font-semibold text-stone-900">{invoice.client_id?.full_name || invoice.client_id?.name || '-'}</p>
            {invoice.client_id?.email && <p className="text-sm text-stone-500">{invoice.client_id.email}</p>}
            {invoice.client_id?.phone && <p className="text-sm text-stone-500">{invoice.client_id.phone}</p>}
            {invoice.client_id?.address && <p className="text-sm text-stone-500">{invoice.client_id.address}</p>}
          </div>
          <div className="text-right">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Property</h3>
            <p className="text-sm text-stone-900">{invoice.property_id?.title || invoice.property_id?.location || '-'}</p>
            {invoice.property_id?.type && <p className="text-sm text-stone-500">{invoice.property_id.type}</p>}
            {invoice.invoice_type && (
              <p className="text-sm text-stone-500 mt-2">
                <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{invoice.invoice_type}</span>
              </p>
            )}
          </div>
        </div>

        <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Items</h3>
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-stone-200">
              <th className="py-3 text-left font-semibold text-stone-600">Description</th>
              <th className="py-3 text-right font-semibold text-stone-600">Qty</th>
              <th className="py-3 text-right font-semibold text-stone-600">Rate</th>
              <th className="py-3 text-right font-semibold text-stone-600">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, i) => (
              <tr key={i} className="border-b border-stone-100">
                <td className="py-3 text-stone-700">{item.description}</td>
                <td className="py-3 text-right text-stone-700">{item.quantity}</td>
                <td className="py-3 text-right text-stone-700">{formatCurrency(item.rate)}</td>
                <td className="py-3 text-right text-stone-700 font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-stone-600"><span>Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
            <div className="flex justify-between text-sm text-stone-600"><span>Tax ({invoice.tax_percentage || 0}%)</span><span>{formatCurrency(invoice.tax_amount)}</span></div>
            <div className="flex justify-between text-base font-bold text-stone-900 border-t border-stone-200 pt-2"><span>Total</span><span>{formatCurrency(invoice.total_amount)}</span></div>
            {invoice.due_amount != null && (
              <div className="flex justify-between text-sm font-semibold text-red-700"><span>Due Amount</span><span>{formatCurrency(invoice.due_amount)}</span></div>
            )}
          </div>
        </div>

        {invoice.notes && (
          <div className="mt-8 pt-6 border-t border-stone-100">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Notes</h3>
            <p className="text-sm text-stone-600">{invoice.notes}</p>
          </div>
        )}
        {invoice.terms && (
          <div className="mt-4">
            <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-2">Terms</h3>
            <p className="text-sm text-stone-600">{invoice.terms}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden no-print">
        <div className="px-6 py-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Payment History</h3>
        </div>
        {payments.length === 0 ? (
          <div className="px-6 py-14 text-center text-stone-400">No payments recorded yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-6 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Payment #</th>
                  <th className="px-6 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Mode</th>
                  <th className="px-6 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Reference</th>
                    <th className="px-6 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider" />
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-3.5 text-stone-700 font-medium">{p.payment_number || '-'}</td>
                    <td className="px-6 py-3.5 text-stone-700">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                    <td className="px-6 py-3.5"><span className={paymentModeColors[p.payment_mode]}>{p.payment_mode?.replace(/_/g, ' ')}</span></td>
                    <td className="px-6 py-3.5 text-right text-stone-700 font-medium">{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-3.5 text-stone-700">{p.reference_no || '-'}</td>
                    <td className="px-6 py-3.5 text-right">
                      {p.timeline?.length > 0 && (
                        <button onClick={() => setTimelinePayment(p)} className="text-xs text-stone-400 hover:text-stone-700 transition-colors underline underline-offset-2">Timeline</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title="Record Payment" size="sm">
        <form onSubmit={handleRecordPayment} className="space-y-5">
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
                {['cash', 'bank_transfer', 'cheque', 'upi', 'card'].map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
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

      <Modal isOpen={!!timelinePayment} onClose={() => setTimelinePayment(null)} title={`Timeline — ${timelinePayment?.payment_number || ''}`} size="md">
        {timelinePayment && (
          <div className="space-y-0">
            <div className="flex flex-wrap gap-x-6 gap-y-2 mb-5 pb-4 border-b border-stone-100">
              <div><span className="text-xs text-stone-400">Amount</span><p className="text-sm font-medium text-stone-900">₹{timelinePayment.amount?.toLocaleString()}</p></div>
              <div><span className="text-xs text-stone-400">Status</span><span className={`ml-1 ${statusColors[timelinePayment.status]}`}>{timelinePayment.status}</span></div>
              <div><span className="text-xs text-stone-400">Mode</span><p className="text-sm font-medium text-stone-900 capitalize">{timelinePayment.payment_mode?.replace(/_/g, ' ')}</p></div>
            </div>
            {(timelinePayment.timeline || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((entry, i, arr) => (
              <div key={i} className="relative flex gap-4 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ring-2 ring-white z-10 ${entry.action === 'created' ? 'bg-emerald-500' : entry.action === 'status_changed' ? 'bg-amber-500' : entry.action === 'deleted' ? 'bg-red-500' : 'bg-stone-400'}`} />
                  {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-stone-200 -mt-0.5" />}
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
            {(timelinePayment.timeline || []).length === 0 && (
              <p className="text-sm text-stone-400 text-center py-4">No timeline entries</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
