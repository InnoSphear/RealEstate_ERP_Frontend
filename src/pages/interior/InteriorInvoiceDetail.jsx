import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineCurrencyDollar, HiOutlineShoppingCart, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlinePaperAirplane } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  overdue: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  cancelled: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
};

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function InteriorInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({ paid_amount: '', payment_mode: 'cash' });
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);

  const fetchInvoice = () => {
    setLoading(true);
    API.get(`/interior-invoices/${id}`)
      .then((res) => setInvoice(res.data))
      .catch(() => toast('Failed to load invoice', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchInvoice(); }, [id]);
  useEffect(() => {
    Promise.all([
      API.get('/interior-projects').then((r) => setProjects(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      API.get('/clients').then((r) => setClients(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
    ]);
  }, []);

  const handleSend = async () => {
    try {
      await API.put(`/interior-invoices/${id}/send`);
      toast('Invoice sent');
      fetchInvoice();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/interior-invoices/${id}/mark-paid`, payForm);
      toast('Payment recorded');
      setPayModalOpen(false);
      fetchInvoice();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>;
  }

  if (!invoice) {
    return <div className="text-center py-20 text-stone-500">
      <p>Invoice not found</p>
      <button onClick={() => navigate('/interior-invoices')} className="mt-4 text-sm text-stone-900 underline">Back</button>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/interior-invoices')} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{invoice.invoice_number}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || statusColors.draft}`}>{invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}</span>
            </div>
            <p className="text-stone-500 mt-1">{invoice.interior_project?.title || '-'} &middot; {invoice.client?.full_name || '-'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {(invoice.status === 'draft') && (
            <>
              <button onClick={handleSend} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-0 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/10">
                <HiOutlinePaperAirplane size={14} /> Send
              </button>
              <button onClick={() => setEditModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
                <HiOutlinePencilSquare size={14} /> Edit
              </button>
            </>
          )}
          {(invoice.status === 'sent' || invoice.status === 'partial') && (
            <button onClick={() => { setPayForm({ paid_amount: invoice.due_amount || '', payment_mode: 'cash' }); setPayModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10">
              <HiOutlineCheckCircle size={14} /> Record Payment
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Sale', value: `₹${(invoice.total_sale || 0).toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700', icon: HiOutlineCurrencyDollar },
          { label: 'Total Purchase', value: `₹${(invoice.total_purchase || 0).toLocaleString()}`, color: 'bg-blue-50 text-blue-700', icon: HiOutlineShoppingCart },
          { label: 'Total Expense', value: `₹${(invoice.total_expense || 0).toLocaleString()}`, color: 'bg-amber-50 text-amber-700', icon: HiOutlineChartBar },
          { label: 'Net Profit', value: `₹${(invoice.profit || 0).toLocaleString()}`, color: (invoice.profit || 0) >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700', icon: HiOutlineChartBar },
          { label: 'Paid', value: `₹${(invoice.paid_amount || 0).toLocaleString()}`, color: 'bg-emerald-50 text-emerald-700', icon: HiOutlineCheckCircle },
          { label: 'Due', value: `₹${(invoice.due_amount || 0).toLocaleString()}`, color: invoice.due_amount > 0 ? 'bg-red-50 text-red-700' : 'bg-stone-50 text-stone-500', icon: HiOutlineCheckCircle },
        ].map((s) => (
          <div key={s.label} className={`p-4 rounded-2xl ${s.color} border border-transparent`}>
            <s.icon size={18} className="opacity-60 mb-1" />
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{s.label}</p>
            <p className="text-lg font-bold mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase">Project</p>
            <p className="text-stone-900 mt-1 font-medium">{invoice.interior_project?.title || '-'}</p>
            <p className="text-stone-500 text-xs">{invoice.interior_project?.project_code || ''}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase">Client</p>
            <p className="text-stone-900 mt-1 font-medium">{invoice.client?.full_name || '-'}</p>
            <p className="text-stone-500 text-xs">{invoice.client?.phone || ''}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase">Dates</p>
            <p className="text-stone-900 mt-1">Invoice: {formatDate(invoice.invoice_date)}</p>
            <p className="text-stone-500 text-xs">Due: {formatDate(invoice.due_date)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-base font-semibold text-emerald-700 mb-4 flex items-center gap-2"><HiOutlineCurrencyDollar size={18} /> Sale Items (Revenue)</h3>
        {!invoice.sale_items?.length ? <p className="text-sm text-stone-400">No sale items</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stone-100 bg-stone-50/50"><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Description</th><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Category</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Qty</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Rate</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th></tr></thead>
            <tbody>{invoice.sale_items.map((item, i) => (
              <tr key={i} className="border-b border-stone-100"><td className="px-4 py-3 text-stone-900">{item.description}</td><td className="px-4 py-3 text-stone-500 capitalize">{item.category}</td><td className="px-4 py-3 text-right text-stone-700">{item.quantity}</td><td className="px-4 py-3 text-right text-stone-700">₹{Number(item.rate).toLocaleString()}</td><td className="px-4 py-3 text-right text-stone-900 font-medium">₹{Number(item.amount).toLocaleString()}</td></tr>
            ))}</tbody>
            <tfoot><tr className="bg-emerald-50/50"><td colSpan={4} className="px-4 py-3 text-right font-semibold text-stone-700">Total Sale</td><td className="px-4 py-3 text-right font-bold text-emerald-700">₹{(invoice.total_sale || 0).toLocaleString()}</td></tr></tfoot>
          </table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-base font-semibold text-blue-700 mb-4 flex items-center gap-2"><HiOutlineShoppingCart size={18} /> Purchase Items (Materials)</h3>
        {!invoice.purchase_items?.length ? <p className="text-sm text-stone-400">No purchase items</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stone-100 bg-stone-50/50"><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Description</th><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Vendor</th><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Category</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Qty</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Rate</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th></tr></thead>
            <tbody>{invoice.purchase_items.map((item, i) => (
              <tr key={i} className="border-b border-stone-100"><td className="px-4 py-3 text-stone-900">{item.description}</td><td className="px-4 py-3 text-stone-500">{item.vendor || '-'}</td><td className="px-4 py-3 text-stone-500 capitalize">{item.category?.replace('_', ' ')}</td><td className="px-4 py-3 text-right text-stone-700">{item.quantity}</td><td className="px-4 py-3 text-right text-stone-700">₹{Number(item.rate).toLocaleString()}</td><td className="px-4 py-3 text-right text-stone-900 font-medium">₹{Number(item.amount).toLocaleString()}</td></tr>
            ))}</tbody>
            <tfoot><tr className="bg-blue-50/50"><td colSpan={5} className="px-4 py-3 text-right font-semibold text-stone-700">Total Purchase</td><td className="px-4 py-3 text-right font-bold text-blue-700">₹{(invoice.total_purchase || 0).toLocaleString()}</td></tr></tfoot>
          </table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-base font-semibold text-amber-700 mb-4 flex items-center gap-2"><HiOutlineChartBar size={18} /> Expense Items (Overheads)</h3>
        {!invoice.expense_items?.length ? <p className="text-sm text-stone-400">No expense items</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-stone-100 bg-stone-50/50"><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Description</th><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Category</th><th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Date</th><th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th></tr></thead>
            <tbody>{invoice.expense_items.map((item, i) => (
              <tr key={i} className="border-b border-stone-100"><td className="px-4 py-3 text-stone-900">{item.description}</td><td className="px-4 py-3 text-stone-500 capitalize">{item.category}</td><td className="px-4 py-3 text-stone-500">{item.date ? formatDate(item.date) : '-'}</td><td className="px-4 py-3 text-right text-stone-900 font-medium">₹{Number(item.amount).toLocaleString()}</td></tr>
            ))}</tbody>
            <tfoot><tr className="bg-amber-50/50"><td colSpan={3} className="px-4 py-3 text-right font-semibold text-stone-700">Total Expense</td><td className="px-4 py-3 text-right font-bold text-amber-700">₹{(invoice.total_expense || 0).toLocaleString()}</td></tr></tfoot>
          </table>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Profit Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50"><p className="text-xs text-emerald-600 font-semibold uppercase">Total Sale</p><p className="text-xl font-bold text-emerald-800">₹{(invoice.total_sale || 0).toLocaleString()}</p></div>
          <div className="p-4 rounded-xl bg-blue-50"><p className="text-xs text-blue-600 font-semibold uppercase">Total Purchase</p><p className="text-xl font-bold text-blue-800">₹{(invoice.total_purchase || 0).toLocaleString()}</p></div>
          <div className="p-4 rounded-xl bg-amber-50"><p className="text-xs text-amber-600 font-semibold uppercase">Total Expense</p><p className="text-xl font-bold text-amber-800">₹{(invoice.total_expense || 0).toLocaleString()}</p></div>
          <div className={`p-4 rounded-xl ${(invoice.profit || 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <p className={`text-xs font-semibold uppercase ${(invoice.profit || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net Profit</p>
            <p className={`text-xl font-bold ${(invoice.profit || 0) >= 0 ? 'text-emerald-800' : 'text-red-800'}`}>₹{(invoice.profit || 0).toLocaleString()}</p>
          </div>
        </div>
        {invoice.notes && <div className="mt-4 pt-4 border-t border-stone-100"><p className="text-xs text-stone-400 font-semibold uppercase mb-1">Notes</p><p className="text-sm text-stone-700">{invoice.notes}</p></div>}
        {invoice.terms && <div className="mt-2"><p className="text-xs text-stone-400 font-semibold uppercase mb-1">Terms</p><p className="text-sm text-stone-700">{invoice.terms}</p></div>}
      </div>

      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Record Payment" size="sm">
        <form onSubmit={handlePay} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount *</label><input type="number" className={inputClass} value={payForm.paid_amount} onChange={(e) => setPayForm({ ...payForm, paid_amount: e.target.value })} required min="1" step="0.01" /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode *</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })} required>
              {['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online', 'other'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPayModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 cursor-pointer">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10 cursor-pointer">Record Payment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
