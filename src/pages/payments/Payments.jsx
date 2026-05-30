import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
  received: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cleared: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  bounced: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  refunded: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
};
const statuses = ['received', 'cleared', 'bounced', 'refunded'];
const modes = ['cash', 'bank_transfer', 'cheque', 'upi', 'card'];

export default function Payments() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterClient, setFilterClient] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    invoice_id: '', client_id: '', branch_id: user?.branch?._id || '',
    amount: '', payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', reference_no: '', status: 'received', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterClient) params.append('client_id', filterClient);
      if (filterStatus) params.append('status', filterStatus);
      const qs = params.toString();
      const [dRes, iRes, cRes, bRes, sRes] = await Promise.all([
        API.get(`/payments${qs ? `?${qs}` : ''}`),
        API.get('/invoices'),
        API.get('/clients'),
        API.get('/branches'),
        API.get('/payments/stats')
      ]);
      setData(dRes.data);
      setInvoices(iRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
      setStats(sRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterClient, filterStatus]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      invoice_id: '', client_id: '', branch_id: user?.branch?._id || '',
      amount: '', payment_date: new Date().toISOString().split('T')[0],
      payment_mode: 'cash', reference_no: '', status: 'received', notes: ''
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      invoice_id: row.invoice_id?._id || row.invoice_id,
      client_id: row.client_id?._id || row.client_id || '',
      branch_id: row.branch_id?._id || row.branch_id || '',
      amount: row.amount || '',
      payment_date: row.payment_date ? row.payment_date.split('T')[0] : '',
      payment_mode: row.payment_mode,
      reference_no: row.reference_no || '',
      status: row.status,
      notes: row.notes || ''
    });
    setModalOpen(true);
  };

  const handleInvoiceChange = (invoiceId) => {
    const inv = invoices.find((i) => i._id === invoiceId);
    setForm({
      ...form,
      invoice_id: invoiceId,
      client_id: inv?.client_id?._id || inv?.client_id || form.client_id,
      branch_id: inv?.branch_id?._id || inv?.branch_id || form.branch_id,
      amount: inv?.amount_due || form.amount
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        client_id: form.client_id || undefined,
        branch_id: form.branch_id || undefined
      };
      if (selected) {
        await API.put(`/payments/${selected._id}`, payload);
        toast('Payment updated');
      } else {
        await API.post('/payments', payload);
        toast('Payment created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/payments/${selected._id}`);
      toast('Payment deleted');
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Invoice', render: (r) => r.invoice_id?.invoice_number || '-' },
    { header: 'Client', render: (r) => r.client_id?.full_name || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? new Date(r.payment_date).toLocaleDateString() : '-' },
    { header: 'Mode', accessor: 'payment_mode', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.payment_mode?.replace(/_/g, ' ')}</span> },
    { header: 'Reference', accessor: 'reference_no' },
    { header: 'Branch', render: (r) => r.branch_id?.name || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Payments</h1>
          <p className="text-stone-500 mt-1">Record and manage all incoming payments</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ New Payment</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">Total Collected</p>
            <p className="text-2xl font-bold text-stone-900 mt-1">₹{((stats.totalCollected || 0)).toLocaleString()}</p>
          </div>
          {(stats.byStatus || []).filter(s => s._id === 'received' || s._id === 'cleared').map(s => (
            <div key={s._id} className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest capitalize">{s._id}</p>
              <p className="text-xl font-bold text-stone-900 mt-1">₹{((s.total || 0)).toLocaleString()}</p>
              <p className="text-xs text-stone-400">{s.count} payments</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          value={filterClient}
          onChange={(e) => setFilterClient(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer"
        >
          <option value="">All Clients</option>
          {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Payment' : 'Record Payment'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Invoice *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.invoice_id} onChange={(e) => handleInvoiceChange(e.target.value)} required>
                <option value="">Select invoice</option>
                {invoices.map((inv) => <option key={inv._id} value={inv._id}>{inv.invoice_number} - ₹{(inv.amount_due || inv.total_amount || 0).toLocaleString()}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Auto from invoice</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.payment_mode} onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}>
                {modes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference No</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.reference_no} onChange={(e) => setForm({ ...form, reference_no: e.target.value })} placeholder="Cheque/UTR no." />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })}>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
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
    </div>
  );
}
