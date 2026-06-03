import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import { toast } from '../../../components/Toast';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  approved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const tabs = ['all', 'pending', 'approved', 'rejected'];

const initialForm = { employee_id: '', leave_type: 'sick', from_date: '', to_date: '', reason: '' };

export default function LeaveManagement() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [applyModal, setApplyModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab !== 'all') params.append('status', activeTab);
    API.get(`/leaves${params.toString() ? `?${params}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load leaves', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [activeTab]);
  useEffect(() => { API.get('/employees').then((res) => setEmployees(res.data)).catch(() => {}); }, []);

  const openApply = () => { setSelected(null); setForm(initialForm); setApplyModal(true); };

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leaves', form);
      toast('Leave applied');
      setApplyModal(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error applying leave', 'error'); }
  };

  const handleApprove = async (row) => {
    try {
      await API.put(`/leaves/${row._id}`, { status: 'approved' });
      toast('Leave approved');
      fetchData();
    } catch (err) { toast('Error approving leave', 'error'); }
  };

  const handleReject = async () => {
    try {
      await API.put(`/leaves/${selected._id}`, { status: 'rejected', reason: rejectReason });
      toast('Leave rejected');
      setRejectModal(false);
      setRejectReason('');
      fetchData();
    } catch (err) { toast('Error rejecting leave', 'error'); }
  };

  const pending = data.filter((l) => l.status === 'pending').length;
  const approved = data.filter((l) => l.status === 'approved').length;
  const rejected = data.filter((l) => l.status === 'rejected').length;

  const columns = [
    { header: 'Employee', render: (r) => r.employee_id?.full_name || r.employee_id?.name || '-' },
    { header: 'Leave Type', accessor: 'leave_type' },
    { header: 'From', render: (r) => r.from_date ? new Date(r.from_date).toLocaleDateString() : '-' },
    { header: 'To', render: (r) => r.to_date ? new Date(r.to_date).toLocaleDateString() : '-' },
    { header: 'Days', render: (r) => {
      if (r.from_date && r.to_date) {
        const d = (new Date(r.to_date) - new Date(r.from_date)) / (1000 * 60 * 60 * 24) + 1;
        return d;
      }
      return '-';
    }},
    { header: 'Reason', render: (r) => r.reason || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.charAt(0).toUpperCase() + r.status?.slice(1)}</span> },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Leave Management</h1><p className="text-stone-500 mt-1">Manage employee leave requests</p></div>
        <button onClick={openApply} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Apply Leave</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-stone-50"><p className="text-lg font-bold text-stone-900">{data.length}</p><p className="text-xs text-stone-500 mt-1">Total</p></div>
        <div className="p-4 rounded-xl bg-amber-50"><p className="text-lg font-bold text-amber-700">{pending}</p><p className="text-xs text-amber-600 font-medium mt-1">Pending</p></div>
        <div className="p-4 rounded-xl bg-emerald-50"><p className="text-lg font-bold text-emerald-700">{approved}</p><p className="text-xs text-emerald-600 font-medium mt-1">Approved</p></div>
        <div className="p-4 rounded-xl bg-red-50"><p className="text-lg font-bold text-red-700">{rejected}</p><p className="text-xs text-red-600 font-medium mt-1">Rejected</p></div>
      </div>

      <div className="flex gap-1 border-b border-stone-200">
        {tabs.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${activeTab === tab ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-400 hover:text-stone-600'}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
      />

      {data.filter((r) => activeTab === 'all' || r.status === activeTab).map((row) => (
        row.status === 'pending' && (activeTab === 'all' || activeTab === 'pending') && (
          <div key={row._id} className="hidden">{/* actions rendered inline below */}</div>
        )
      ))}

      {data.length > 0 && (activeTab === 'all' || activeTab === 'pending') && (
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-5">
          <h3 className="text-sm font-semibold text-stone-900 mb-3">Pending Leave Actions</h3>
          <div className="space-y-2">
            {data.filter((r) => r.status === 'pending').map((row) => (
              <div key={row._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50">
                <div className="text-sm text-stone-700">
                  <span className="font-medium">{row.employee_id?.full_name || row.employee_id?.name || 'Unknown'}</span> &mdash; {row.leave_type} ({new Date(row.from_date).toLocaleDateString()} - {new Date(row.to_date).toLocaleDateString()})
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleApprove(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border-0 cursor-pointer">Approve</button>
                  <button onClick={() => { setSelected(row); setRejectReason(''); setRejectModal(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors border-0 cursor-pointer">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={applyModal} onClose={() => setApplyModal(false)} title="Apply Leave">
        <form onSubmit={handleApply} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Employee *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required><option value="">Select employee</option>{employees.map((e) => <option key={e._id} value={e._id}>{e.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Leave Type *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.leave_type} onChange={(e) => setForm({ ...form, leave_type: e.target.value })} required><option value="sick">Sick</option><option value="casual">Casual</option><option value="annual">Annual</option><option value="personal">Personal</option><option value="other">Other</option></select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">From Date *</label><input type="date" className={inputClass} value={form.from_date} onChange={(e) => setForm({ ...form, from_date: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">To Date *</label><input type="date" className={inputClass} value={form.to_date} onChange={(e) => setForm({ ...form, to_date: e.target.value })} required /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason</label><textarea className={inputClass} rows={3} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setApplyModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Submit</button></div>
        </form>
      </Modal>

      <Modal isOpen={rejectModal} onClose={() => setRejectModal(false)} title="Reject Leave" size="sm">
        <div className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason for Rejection</label><textarea className={inputClass} rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Enter reason..." /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setRejectModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button onClick={handleReject} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/10">Reject</button></div>
        </div>
      </Modal>
    </div>
  );
}
