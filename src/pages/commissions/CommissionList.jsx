import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  approved: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};
const statuses = ['pending', 'approved', 'paid', 'cancelled'];
const commissionTypes = ['fixed', 'percentage'];
const sourceOptions = ['sale', 'rent', 'service', 'referral', 'other'];
const paymentModes = ['cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other'];

export default function CommissionList() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [payHistoryModal, setPayHistoryModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('');
  const [filterType, setFilterType] = useState('');
  const [form, setForm] = useState({
    employee_id: '', commission_type: 'fixed', commission_value: '', percentage_rate: '',
    source: 'sale', source_description: '', client_id: '', property_id: '', amount_basis: ''
  });
  const [payForm, setPayForm] = useState({
    payment_mode: 'cash', reference: '', upi_id: '', notes: '', amount: ''
  });
  const [summary, setSummary] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterSource) params.append('source', filterSource);
      if (filterEmployee) params.append('employee', filterEmployee);
      if (filterType) params.append('commission_type', filterType);
      const qs = params.toString();
      const [dRes, eRes, cRes, pRes] = await Promise.all([
        API.get(`/commissions${qs ? `?${qs}` : ''}`),
        API.get('/employees'),
        API.get('/clients'),
        API.get('/properties'),
      ]);
      const commissions = Array.isArray(dRes.data) ? dRes.data : [];
      setData(commissions);
      setEmployees(Array.isArray(eRes.data) ? eRes.data : []);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
      setProperties(Array.isArray(pRes.data) ? pRes.data : []);
      const summaryMap = {};
      commissions.forEach((c) => {
        const name = c.employee?.full_name || 'Unknown';
        if (!summaryMap[name]) summaryMap[name] = { name, total: 0, pending: 0, approved: 0, paid: 0, count: 0 };
        summaryMap[name].total += c.commission_amount || 0;
        if (c.status === 'pending') summaryMap[name].pending += c.commission_amount || 0;
        if (c.status === 'approved') summaryMap[name].approved += c.commission_amount || 0;
        if (c.status === 'paid') summaryMap[name].paid += c.commission_amount || 0;
        summaryMap[name].count++;
      });
      setSummary(Object.values(summaryMap));
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterSource, filterEmployee, filterType]);

  const resetForm = () => setForm({
    employee_id: '', commission_type: 'fixed', commission_value: '', percentage_rate: '',
    source: 'sale', source_description: '', client_id: '', property_id: '', amount_basis: ''
  });

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      employee_id: row.employee?._id || row.employee || '',
      commission_type: row.commission_type || 'fixed',
      commission_value: row.commission_value || '',
      percentage_rate: row.percentage_rate || '',
      source: row.source || 'sale',
      source_description: row.source_description || '',
      client_id: row.client?._id || row.client || '',
      property_id: row.property?._id || row.property || '',
      amount_basis: row.amount_basis || '',
    });
    setModalOpen(true);
  };

  const openPay = (row) => {
    setSelected(row);
    setPayForm({
      payment_mode: 'cash',
      reference: '',
      upi_id: '',
      notes: '',
      amount: row.commission_amount || '',
    });
    setPaymentModal(true);
  };

  const openPayHistory = (row) => {
    setSelected(row);
    setPayHistoryModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        commission_value: form.commission_value !== '' ? Number(form.commission_value) : undefined,
        percentage_rate: form.percentage_rate !== '' ? Number(form.percentage_rate) : undefined,
        amount_basis: form.amount_basis !== '' ? Number(form.amount_basis) : undefined,
      };
      if (selected) { await API.put(`/commissions/${selected._id}`, payload); toast('Commission updated'); }
      else { await API.post('/commissions', payload); toast('Commission created'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleApprove = async (row) => {
    try { await API.put(`/commissions/${row._id}/approve`); toast('Commission approved'); fetchData(); }
    catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handlePay = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/commissions/${selected._id}/pay`, {
        payment_mode: payForm.payment_mode,
        reference: payForm.reference,
        upi_id: payForm.upi_id,
        notes: payForm.notes,
        amount: payForm.amount ? Number(payForm.amount) : undefined,
      });
      toast('Commission paid successfully');
      setPaymentModal(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleCancel = async () => {
    try { await API.put(`/commissions/${selected._id}/cancel`); toast('Commission cancelled'); fetchData(); }
    catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const columns = [
    { header: 'Employee', render: (r) => r.employee?.full_name || r.employee?.employee_id || '-' },
    { header: 'Type', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.commission_type}</span> },
    { header: 'Amount', render: (r) => r.commission_amount ? `₹${r.commission_amount.toLocaleString()}` : '-' },
    { header: 'Source', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{r.source}</span> },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Payment', render: (r) => r.status === 'paid' ? (
      <div className="flex items-center gap-1">
        <span className="text-xs text-stone-500">{r.payment_mode || '-'}</span>
        {r.payment_history?.length > 0 && (
          <button onClick={(e) => { e.stopPropagation(); openPayHistory(r); }} className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer">
            ({r.payment_history.length})
          </button>
        )}
      </div>
    ) : '-' },
    { header: 'Paid At', render: (r) => r.paid_at ? new Date(r.paid_at).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Commissions</h1><p className="text-stone-500 mt-1">Manage employee commissions</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Commission</button>
      </div>

      {summary.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((s) => (
            <div key={s.name} className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{s.name}</p>
              <p className="text-2xl font-bold text-stone-900 mt-1">₹{s.total.toLocaleString()}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {s.count} commissions
                {s.pending > 0 && <span className="text-amber-600"> · ₹{s.pending.toLocaleString()} pending</span>}
                {s.approved > 0 && <span className="text-blue-600"> · ₹{s.approved.toLocaleString()} approved</span>}
                {s.paid > 0 && <span className="text-emerald-600"> · ₹{s.paid.toLocaleString()} paid</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Sources</option>
          {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Types</option>
          {commissionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterEmployee} onChange={(e) => setFilterEmployee(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Employees</option>
          {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.full_name || emp.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} />

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Pending Approvals</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Source</th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(r => r.status === 'pending').length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-14 text-center text-stone-400">No pending commissions</td></tr>
              ) : data.filter(r => r.status === 'pending').map((row) => (
                <tr key={row._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{row.employee?.full_name || row.employee?.employee_id || '-'}</td>
                  <td className="px-5 py-3.5 text-stone-700">₹{(row.commission_amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5"><span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{row.source}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleApprove(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer">Approve</button>
                      <button onClick={() => { setSelected(row); setConfirmOpen(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer">Cancel</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Approved (Ready to Pay)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Source</th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(r => r.status === 'approved').length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-14 text-center text-stone-400">No approved commissions</td></tr>
              ) : data.filter(r => r.status === 'approved').map((row) => (
                <tr key={row._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{row.employee?.full_name || row.employee?.employee_id || '-'}</td>
                  <td className="px-5 py-3.5 text-stone-700">₹{(row.commission_amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5"><span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">{row.source}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => openPay(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer">Pay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Commission' : 'Create Commission'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Employee *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required>
                <option value="">Select employee</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.full_name || emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Commission Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.commission_type} onChange={(e) => setForm({ ...form, commission_type: e.target.value })}>
                {commissionTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {form.commission_type === 'fixed' && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹)</label>
                <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
              </div>
            )}
            {form.commission_type === 'percentage' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Percentage Rate (%)</label>
                  <input type="number" step="0.01" min="0" max="100" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.percentage_rate} onChange={(e) => setForm({ ...form, percentage_rate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount Basis (₹)</label>
                  <input type="number" step="0.01" min="0" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.amount_basis} onChange={(e) => setForm({ ...form, amount_basis: e.target.value })} />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required>
                {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source Description</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.source_description} onChange={(e) => setForm({ ...form, source_description: e.target.value })} placeholder="e.g. Deal #123" />
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
                {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id} - {p.location}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title={`Pay Commission - ${selected?.employee?.full_name || ''}`}>
        <form onSubmit={handlePay} className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            Commission Amount: <strong>₹{(selected?.commission_amount || 0).toLocaleString()}</strong>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Amount (₹)</label>
              <input type="number" min="1" step="0.01" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={payForm.payment_mode} onChange={(e) => setPayForm({ ...payForm, payment_mode: e.target.value })} required>
                {paymentModes.map((m) => <option key={m} value={m}>{m.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            {payForm.payment_mode === 'upi' && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">UPI ID</label>
                <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={payForm.upi_id} onChange={(e) => setPayForm({ ...payForm, upi_id: e.target.value })} placeholder="example@upi" />
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference (Trx ID / Cheque No.)</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} placeholder="Transaction/Cheque reference" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Payment notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10">Confirm Payment</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={payHistoryModal} onClose={() => setPayHistoryModal(false)} title={`Payment History - ${selected?.employee?.full_name || ''}`} size="lg">
        {selected?.payment_history?.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Total Paid</p>
                  <p className="text-lg font-bold text-emerald-600 mt-1">₹{selected.payment_history.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Payments</p>
                  <p className="text-lg font-bold text-stone-900 mt-1">{selected.payment_history.length}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Status</p>
                  <p className="text-lg font-bold text-stone-900 mt-1 capitalize">{selected.status}</p>
                </div>
              </div>
            </div>
            <div className="relative">
              {selected.payment_history.map((ph, i) => (
                <div key={i} className="relative pl-8 pb-6 last:pb-0">
                  {i < selected.payment_history.length - 1 && (
                    <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-stone-200" />
                  )}
                  <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-400 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div className="bg-white rounded-xl border border-stone-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-emerald-700">₹{(ph.amount || 0).toLocaleString()}</span>
                      <span className="text-xs text-stone-400">{ph.timestamp ? new Date(ph.timestamp).toLocaleString() : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-stone-600">
                      <div><span className="font-medium text-stone-500">Mode:</span> {ph.payment_mode?.replace(/_/g, ' ') || '-'}</div>
                      {ph.reference && <div><span className="font-medium text-stone-500">Reference:</span> {ph.reference}</div>}
                      {ph.upi_id && <div><span className="font-medium text-stone-500">UPI ID:</span> {ph.upi_id}</div>}
                      {ph.paid_by && <div><span className="font-medium text-stone-500">Paid By:</span> {ph.paid_by?.full_name || 'N/A'}</div>}
                    </div>
                    {ph.notes && <p className="text-xs text-stone-500 mt-2 italic">{ph.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-stone-400 py-8">No payment history found</p>
        )}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={() => setPayHistoryModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Close</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleCancel} title="Cancel Commission" message="Are you sure you want to cancel this commission?" />
    </div>
  );
}