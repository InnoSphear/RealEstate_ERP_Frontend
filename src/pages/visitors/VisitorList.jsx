import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const visitorTypes = ['walk_in', 'appointment', 'delivery', 'other'];
const purposes = ['property_viewing', 'consultation', 'payment', 'delivery', 'meeting', 'other'];

export default function VisitorList() {
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [form, setForm] = useState({
    visitor_name: '', mobile: '', email: '', purpose: 'property_viewing',
    interested_property: '', assigned_staff: '', type: 'walk_in', notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      const qs = params.toString();
      const [dRes, eRes, pRes] = await Promise.all([
        API.get('/visitors' + (qs ? '?' + qs : '')),
        API.get('/employees'),
        API.get('/properties'),
      ]);
      setData(dRes.data);
      setEmployees(eRes.data);
      setProperties(pRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterType, dateFrom, dateTo]);

  const resetForm = () => setForm({
    visitor_name: '', mobile: '', email: '', purpose: 'property_viewing',
    interested_property: '', assigned_staff: '', type: 'walk_in', notes: ''
  });

  const openCreate = () => { setSelected(null); resetForm(); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await API.put('/visitors/' + selected._id, form); toast('Visitor updated'); }
      else { await API.post('/visitors', form); toast('Visitor recorded'); }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleCheckOut = async (row) => {
    try {
      await API.put('/visitors/' + row._id, { check_out: new Date().toISOString() });
      toast('Visitor checked out');
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const handleConvertToLead = async (row) => {
    try {
      await API.post('/leads/from-visitor', { visitor_id: row._id });
      toast('Visitor converted to lead');
      fetchData();
    } catch (err) { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Name', accessor: 'visitor_name', render: (r) => r.visitor_name || '-' },
    { header: 'Mobile', accessor: 'mobile', render: (r) => r.mobile || '-' },
    { header: 'Purpose', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.purpose?.replace(/_/g, ' ')}</span> },
    { header: 'Type', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.type?.replace(/_/g, ' ')}</span> },
    { header: 'Check In', render: (r) => r.check_in ? new Date(r.check_in).toLocaleString() : '-' },
    { header: 'Check Out', render: (r) => r.check_out ? new Date(r.check_out).toLocaleString() : <span className="text-amber-600 font-medium">Active</span> },
    { header: 'Staff', render: (r) => r.assigned_staff?.full_name || r.assigned_staff?.name || '-' },
    { header: 'Converted', render: (r) => r.converted_to_lead ? <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">Yes</span> : <span className="text-stone-400">No</span> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Visitors</h1><p className="text-stone-500 mt-1">Track office visitors and walk-ins</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ New Visitor</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Types</option>
          {visitorTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openCreate} />

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-5 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">Active Visitors</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 bg-stone-50/50">
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Mobile</th>
                <th className="px-5 py-3.5 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Type</th>
                <th className="px-5 py-3.5 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.filter(r => !r.check_out).length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-14 text-center text-stone-400">No active visitors</td></tr>
              ) : data.filter(r => !r.check_out).map((row) => (
                <tr key={row._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-stone-700 font-medium">{row.visitor_name || '-'}</td>
                  <td className="px-5 py-3.5 text-stone-700">{row.mobile || '-'}</td>
                  <td className="px-5 py-3.5"><span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{row.type?.replace(/_/g, ' ')}</span></td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleCheckOut(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all">Check Out</button>
                      {!row.converted_to_lead && (
                        <button onClick={() => handleConvertToLead(row)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border-0 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all">Convert to Lead</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Visitor' : 'New Visitor'} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Visitor Name *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.visitor_name} onChange={(e) => setForm({ ...form, visitor_name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {visitorTypes.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Purpose</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })}>
                {purposes.map((p) => <option key={p} value={p}>{p.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Interested Property</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.interested_property} onChange={(e) => setForm({ ...form, interested_property: e.target.value })}>
                <option value="">Select property</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.title || p.location}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Assigned Staff</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.assigned_staff} onChange={(e) => setForm({ ...form, assigned_staff: e.target.value })}>
                <option value="">Select staff</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.full_name || e.name}</option>)}
              </select>
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
    </div>
  );
}
