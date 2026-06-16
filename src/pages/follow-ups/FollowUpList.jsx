import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  missed: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const followUpStatuses = ['pending', 'completed', 'missed'];

export default function FollowUpList() {
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [leads, setLeads] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const [filters, setFilters] = useState({ status: '', assigned_to: '', date_from: '', date_to: '' });

  const initForm = {
    lead_id: '', client_id: '', assigned_to: '', follow_up_date: '', follow_up_time: '', notes: '', status: 'pending',
  };
  const [form, setForm] = useState(initForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    API.get(`/follow-ups${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load follow-ups', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filters]);

  useEffect(() => {
    Promise.all([
      API.get('/users').catch(() => ({ data: [] })),
      API.get('/leads').catch(() => ({ data: [] })),
      API.get('/clients').catch(() => ({ data: [] })),
    ]).then(([uRes, lRes, cRes]) => {
      setUsers(uRes.data || []);
      setLeads(lRes.data || []);
      setClients(cRes.data || []);
    });
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(initForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      lead_id: row.lead?._id || row.lead || row.lead_id?._id || row.lead_id || '',
      client_id: row.client?._id || row.client || row.client_id?._id || row.client_id || '',
      assigned_to: row.assigned_to?._id || row.assigned_to || '',
      follow_up_date: row.follow_up_date ? new Date(row.follow_up_date).toISOString().split('T')[0] : '',
      follow_up_time: row.follow_up_time || '',
      notes: row.notes || '',
      status: row.status || 'pending',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/follow-ups/${selected._id}`, form);
        toast('Follow-up updated');
      } else {
        await API.post('/follow-ups', form);
        toast('Follow-up created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/follow-ups/${selected._id}`);
      toast('Follow-up deleted');
      fetchData();
    } catch (err) {
      toast('Error deleting', 'error');
    }
  };

  const openComplete = (row) => {
    setSelected(row);
    setCompletionNotes('');
    setCompletionModalOpen(true);
  };

  const handleComplete = async () => {
    try {
      await API.put(`/follow-ups/${selected._id}`, { status: 'completed', completion_notes: completionNotes });
      toast('Follow-up marked complete');
      setCompletionModalOpen(false);
      fetchData();
    } catch (err) {
      toast('Error updating', 'error');
    }
  };

  const openReschedule = (row) => {
    setSelected(row);
    setRescheduleDate(row.follow_up_date ? new Date(row.follow_up_date).toISOString().split('T')[0] : '');
    setRescheduleTime(row.follow_up_time || '');
    setRescheduleModalOpen(true);
  };

  const handleReschedule = async () => {
    try {
      await API.put(`/follow-ups/${selected._id}`, { follow_up_date: rescheduleDate, follow_up_time: rescheduleTime });
      toast('Follow-up rescheduled');
      setRescheduleModalOpen(false);
      fetchData();
    } catch (err) {
      toast('Error rescheduling', 'error');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    return d.toISOString().split('T')[0] === today;
  };

  const isOverdue = (date, status) => {
    if (!date || status === 'completed') return false;
    return new Date(date) < new Date(today);
  };

  const columns = [
    {
      header: 'Lead/Client',
      render: (r) => (
        <span className={`font-medium ${isToday(r.follow_up_date) ? 'text-amber-600' : isOverdue(r.follow_up_date, r.status) ? 'text-red-600' : 'text-stone-900'}`}>
          {r.lead?.full_name || r.lead_id?.full_name || r.client?.full_name || r.client_id?.full_name || '-'}
        </span>
      ),
    },
    { header: 'Assigned To', render: (r) => r.assigned_to ? `${r.assigned_to.full_name}${r.assigned_to.email ? ` (${r.assigned_to.email})` : ''}` : '-' },
    {
      header: 'Date',
      render: (r) => (
        <span className={`${isToday(r.follow_up_date) ? 'font-semibold text-amber-600' : isOverdue(r.follow_up_date, r.status) ? 'text-red-600' : ''}`}>
          {r.follow_up_date ? new Date(r.follow_up_date).toLocaleDateString() : '-'}
        </span>
      ),
    },
    { header: 'Time', render: (r) => r.follow_up_time || '-' },
    { header: 'Notes', render: (r) => r.notes ? (r.notes.length > 40 ? r.notes.slice(0, 40) + '...' : r.notes) : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    {
      header: 'Action',
      render: (r) => (
        <div className="flex gap-1.5">
          {r.status !== 'completed' && (
            <button onClick={(e) => { e.stopPropagation(); openComplete(r); }} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all">
              Complete
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); openReschedule(r); }} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-stone-50 text-stone-600 hover:bg-stone-100 transition-all">
            Reschedule
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Follow-ups</h1>
          <p className="text-stone-500 mt-1">Manage follow-up tasks</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          + Add Follow-up
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Status</option>
          {followUpStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Assignees</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="From" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="To" />
      </div>

      {data.filter((r) => isOverdue(r.follow_up_date, r.status)).length > 0 && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <p className="text-sm text-red-700 font-medium">{data.filter((r) => isOverdue(r.follow_up_date, r.status)).length} overdue follow-up(s) need attention</p>
        </div>
      )}

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={openEdit}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Follow-up' : 'Create Follow-up'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Lead</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.lead_id} onChange={(e) => setForm({ ...form, lead_id: e.target.value })}>
                <option value="">Select lead (optional)</option>
                {leads.map((l) => <option key={l._id} value={l._id}>{l.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}>
                <option value="">Select client (optional)</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Assigned To *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })} required>
                <option value="">Select user</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {followUpStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Follow-up Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.follow_up_date} onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Follow-up Time</label>
              <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.follow_up_time} onChange={(e) => setForm({ ...form, follow_up_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={completionModalOpen} onClose={() => setCompletionModalOpen(false)} title="Complete Follow-up" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Add completion notes</p>
          <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={3} value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} placeholder="What was discussed or achieved..." />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCompletionModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleComplete} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10">Mark Complete</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Follow-up" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Set a new date and time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">New Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">New Time</label>
              <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRescheduleModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleReschedule} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Reschedule</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Follow-up" message="Are you sure you want to delete this follow-up?" />
    </div>
  );
}
