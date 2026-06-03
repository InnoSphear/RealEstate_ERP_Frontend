import { useState, useEffect } from 'react';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  present: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  absent: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  half_day: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  late: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const statusOptions = ['present', 'absent', 'half_day', 'late'];

const initialForm = { employee_id: '', date: new Date().toISOString().split('T')[0], status: 'present', check_in: '', check_out: '', notes: '' };

export default function Attendance() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterDept, setFilterDept] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterMonth) params.append('month', filterMonth);
    if (filterDept) params.append('department', filterDept);
    if (filterFrom) params.append('from', filterFrom);
    if (filterTo) params.append('to', filterTo);
    const qs = params.toString();
    API.get(`/attendance${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load attendance', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [filterMonth, filterDept, filterFrom, filterTo]);
  useEffect(() => { API.get('/employees').then((res) => setEmployees(res.data)).catch(() => {}); }, []);

  const openCreate = () => { setSelected(null); setForm(initialForm); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        employee_id: form.employee_id,
        date: form.date,
        check_in: form.check_in || undefined,
        check_out: form.check_out || undefined,
      };
      if (selected) {
        await API.put(`/attendance/${selected._id}`, payload);
        toast('Attendance updated');
      } else {
        await API.post('/attendance', payload);
        toast('Attendance marked');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error saving attendance', 'error'); }
  };

  const columns = [
    { header: 'Employee', render: (r) => r.employee_id?.full_name || r.employee_id?.name || '-' },
    { header: 'Date', render: (r) => r.date ? new Date(r.date).toLocaleDateString() : '-' },
    { header: 'Check In', render: (r) => r.check_in ? new Date(r.check_in).toLocaleTimeString() : '-' },
    { header: 'Check Out', render: (r) => r.check_out ? new Date(r.check_out).toLocaleTimeString() : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
    { header: 'Working Hours', render: (r) => {
      if (r.check_in && r.check_out) {
        const h = (new Date(r.check_out) - new Date(r.check_in)) / (1000 * 60 * 60);
        return `${h.toFixed(1)}h`;
      }
      return '-';
    }},
  ];

  const presentCount = data.filter((r) => r.status === 'present').length;
  const absentCount = data.filter((r) => r.status === 'absent').length;
  const halfDayCount = data.filter((r) => r.status === 'half_day').length;
  const lateCount = data.filter((r) => r.status === 'late').length;

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Attendance</h1><p className="text-stone-500 mt-1">Track employee attendance</p></div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"><HiOutlineArrowDownTray size={15} /> Export</button>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Mark Attendance</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50"><p className="text-lg font-bold text-emerald-700">{presentCount}</p><p className="text-xs text-emerald-600 font-medium mt-1">Present</p></div>
        <div className="p-4 rounded-xl bg-red-50"><p className="text-lg font-bold text-red-700">{absentCount}</p><p className="text-xs text-red-600 font-medium mt-1">Absent</p></div>
        <div className="p-4 rounded-xl bg-amber-50"><p className="text-lg font-bold text-amber-700">{halfDayCount}</p><p className="text-xs text-amber-600 font-medium mt-1">Half Day</p></div>
        <div className="p-4 rounded-xl bg-yellow-50"><p className="text-lg font-bold text-yellow-700">{lateCount}</p><p className="text-xs text-yellow-600 font-medium mt-1">Late</p></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-colors appearance-none cursor-pointer">
          <option value="">All Departments</option>
          {['telecalling', 'sales', 'accounts', 'agent', 'reception', 'management', 'it'].map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        <input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} placeholder="From" className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
        <input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} placeholder="To" className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Attendance' : 'Mark Attendance'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Employee *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} required><option value="">Select employee</option>{employees.map((e) => <option key={e._id} value={e._id}>{e.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Date *</label><input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>{statusOptions.map((s) => <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Check In</label><input type="time" className={inputClass} value={form.check_in} onChange={(e) => setForm({ ...form, check_in: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Check Out</label><input type="time" className={inputClass} value={form.check_out} onChange={(e) => setForm({ ...form, check_out: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Save'}</button></div>
        </form>
      </Modal>
    </div>
  );
}
