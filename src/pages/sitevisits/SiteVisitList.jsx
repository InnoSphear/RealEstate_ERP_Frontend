import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiOutlineKey } from 'react-icons/hi2';

const statusColors = {
  scheduled: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  confirmed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  completed: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  rescheduled: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  no_show: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};
const statuses = ['scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled', 'no_show'];
const outcomeOptions = ['interested', 'not_interested', 'negotiation', 'booked', 'follow_up'];

export default function SiteVisitList() {
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [properties, setProperties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableKeys, setAvailableKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [outcomeModal, setOutcomeModal] = useState(false);
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterExecutive, setFilterExecutive] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    client_id: '', property_id: '', assigned_executive: '',
    scheduled_date: '', scheduled_time: '', notes: '', property_key: ''
  });
  const [outcomeForm, setOutcomeForm] = useState({ outcome: 'follow_up', outcome_notes: '' });
  const [rescheduleForm, setRescheduleForm] = useState({ scheduled_date: '', scheduled_time: '', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterExecutive) params.append('assigned_executive', filterExecutive);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const qs = params.toString();
      const [dRes, cRes, pRes, eRes] = await Promise.all([
        API.get(`/site-visits${qs ? `?${qs}` : ''}`),
        API.get('/clients'),
        API.get('/properties'),
        API.get('/employees'),
      ]);
      setData(Array.isArray(dRes.data) ? dRes.data : []);
      setClients(Array.isArray(cRes.data) ? cRes.data : []);
      setProperties(Array.isArray(pRes.data) ? pRes.data : []);
      setEmployees(Array.isArray(eRes.data) ? eRes.data : []);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterStatus, filterExecutive, dateFrom, dateTo]);

  const fetchAvailableKeys = async (propertyId) => {
    if (!propertyId) { setAvailableKeys([]); return; }
    try {
      const res = await API.get(`/property-keys?property=${propertyId}`);
      setAvailableKeys(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setAvailableKeys([]); }
  };

  const keyStatusColor = (status) => {
    const map = {
      available: 'text-emerald-600 bg-emerald-50',
      scheduled: 'text-blue-600 bg-blue-50',
      issued: 'text-amber-600 bg-amber-50',
      outside: 'text-purple-600 bg-purple-50',
      returned: 'text-stone-600 bg-stone-50',
    };
    return map[status] || 'text-stone-600 bg-stone-50';
  };

  const resetForm = () => {
    setForm({ client_id: '', property_id: '', assigned_executive: '', scheduled_date: '', scheduled_time: '', notes: '', property_key: '' });
    setAvailableKeys([]);
  };

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const handlePropertyChange = (propertyId) => {
    setForm({ ...form, property_id: propertyId, property_key: '' });
    fetchAvailableKeys(propertyId);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/site-visits/${selected._id}`, form);
        toast('Site visit updated');
      } else {
        await API.post('/site-visits', form);
        toast('Site visit created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleConfirm = async (row) => {
    try { await API.put(`/site-visits/${row._id}/confirm`); toast('Visit confirmed'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const handleComplete = async (row) => {
    setSelected(row);
    setOutcomeForm({ outcome: 'follow_up', outcome_notes: '' });
    setOutcomeModal(true);
  };

  const submitOutcome = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/site-visits/${selected._id}/complete`, { outcome: outcomeForm.outcome, visit_notes: outcomeForm.outcome_notes, client_feedback: outcomeForm.outcome_notes });
      toast('Visit completed');
      setOutcomeModal(false);
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const openReschedule = (row) => {
    setSelected(row);
    setRescheduleForm({ scheduled_date: '', scheduled_time: '', notes: '' });
    setRescheduleModal(true);
  };

  const submitReschedule = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/site-visits/${selected._id}/reschedule`, { rescheduled_date: rescheduleForm.scheduled_date, rescheduled_reason: rescheduleForm.notes });
      toast('Visit rescheduled');
      setRescheduleModal(false);
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const handleCancel = async () => {
    try {
      await API.put(`/site-visits/${selected._id}/cancel`, { cancellation_reason: '' });
      toast('Visit cancelled');
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Client', render: (r) => r.client?.full_name || r.client?.name || '-' },
    { header: 'Property', render: (r) => r.property ? `${r.property.property_id || ''} - ${r.property.location || ''}`.replace(/^ - /, '').replace(/ - $/, '') || '-' : '-' },
    { header: 'Executive', render: (r) => r.assigned_executive?.full_name || '-' },
    { header: 'Date', render: (r) => r.scheduled_date ? new Date(r.scheduled_date).toLocaleDateString() : '-' },
    { header: 'Time', render: (r) => r.scheduled_time || '-' },
    { header: 'Key', render: (r) => r.property_key ? (
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${keyStatusColor(r.property_key.status)}`}>
        <HiOutlineKey size={11} /> {r.property_key.key_number}
      </span>
    ) : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Outcome', render: (r) => r.outcome || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Site Visits</h1><p className="text-stone-500 mt-1">Manage property site visits</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ New Site Visit</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterExecutive} onChange={(e) => setFilterExecutive(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Executives</option>
          {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.full_name || emp.name}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} />

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Quick Actions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Client</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length === 0 ? (
                <tr><td colSpan={3} className="px-5 py-14 text-center text-stone-400">No pending visits</td></tr>
              ) : data.filter(r => r.status !== 'completed' && r.status !== 'cancelled').map((row) => (
                <tr key={row._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-stone-700">{row.client?.full_name || row.client?.name || '-'}</td>
                  <td className="px-5 py-3.5"><span className={statusColors[row.status]}>{row.status}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {row.status === 'scheduled' && (
                        <>
                          <button onClick={() => handleConfirm(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer">Confirm</button>
                          <button onClick={() => handleComplete(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer">Complete</button>
                          <button onClick={() => openReschedule(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer">Reschedule</button>
                          <button onClick={() => { setSelected(row); setConfirmOpen(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-red-50 text-red-700 hover:bg-red-100 transition-all cursor-pointer">Cancel</button>
                        </>
                      )}
                      {row.status === 'confirmed' && (
                        <>
                          <button onClick={() => handleComplete(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all cursor-pointer">Complete</button>
                          <button onClick={() => openReschedule(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all cursor-pointer">Reschedule</button>
                        </>
                      )}
                      {row.status === 'rescheduled' && (
                        <button onClick={() => handleConfirm(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all cursor-pointer">Confirm</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Site Visit' : 'New Site Visit'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
                <option value="">Search client...</option>
                {clients.map((c) => <option key={c._id} value={c._id}>{c.full_name || c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property_id} onChange={(e) => handlePropertyChange(e.target.value)} required>
                <option value="">Search property...</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id || ''} - {p.location || ''}</option>)}
              </select>
            </div>
            {form.property_id && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5 flex items-center gap-1.5"><HiOutlineKey size={15} /> Assign Key</label>
                <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property_key} onChange={(e) => setForm({ ...form, property_key: e.target.value })}>
                  <option value="">No key needed</option>
                  {availableKeys.map((k) => (
                    <option key={k._id} value={k._id}>
                      {k.key_number} — {k.status?.charAt(0).toUpperCase() + k.status?.slice(1)}
                    </option>
                  ))}
                  {availableKeys.length === 0 && <option value="" disabled>No keys found for this property</option>}
                </select>
                {form.property_key && (() => {
                  const sel = availableKeys.find((k) => k._id === form.property_key);
                  return sel ? (
                    <span className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${keyStatusColor(sel.status)}`}>
                      <HiOutlineKey size={11} /> {sel.key_number} — {sel.status}
                    </span>
                  ) : null;
                })()}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Assigned Executive</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.assigned_executive} onChange={(e) => setForm({ ...form, assigned_executive: e.target.value })}>
                <option value="">Select executive</option>
                {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.full_name || emp.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Scheduled Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Scheduled Time</label>
              <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.scheduled_time} onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={outcomeModal} onClose={() => setOutcomeModal(false)} title="Record Outcome" size="sm">
        <form onSubmit={submitOutcome} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Outcome *</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={outcomeForm.outcome} onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome: e.target.value })} required>
              {outcomeOptions.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={outcomeForm.outcome_notes} onChange={(e) => setOutcomeForm({ ...outcomeForm, outcome_notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOutcomeModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Complete Visit</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rescheduleModal} onClose={() => setRescheduleModal(false)} title="Reschedule Visit" size="sm">
        <form onSubmit={submitReschedule} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">New Date *</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={rescheduleForm.scheduled_date} onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduled_date: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">New Time</label>
              <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={rescheduleForm.scheduled_time} onChange={(e) => setRescheduleForm({ ...rescheduleForm, scheduled_time: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason / Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={rescheduleForm.notes} onChange={(e) => setRescheduleForm({ ...rescheduleForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setRescheduleModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Reschedule</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleCancel} title="Cancel Visit" message="Are you sure you want to cancel this site visit?" />
    </div>
  );
}