import { useState, useEffect } from 'react';
import API from '../../../api/axios';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import ConfirmDialog from '../../../components/ConfirmDialog';
import { toast } from '../../../components/Toast';
import { HiOutlineClock, HiOutlineArrowPath } from 'react-icons/hi2';

const statusBadge = (v) => {
  const map = { available: 'bg-green-50 text-green-700 ring-1 ring-green-200', issued: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200', returned: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'}`}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : '-'}</span>;
};

export default function PropertyKeyList() {
  const [data, setData] = useState([]);
  const [properties, setProperties] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [issueModal, setIssueModal] = useState(false);
  const [returnModal, setReturnModal] = useState(false);
  const [historyModal, setHistoryModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ property: '', key_number: '' });
  const [issueForm, setIssueForm] = useState({ issued_to: '', issue_date: new Date().toISOString().split('T')[0], notes: '' });
  const [returnForm, setReturnForm] = useState({ return_date: new Date().toISOString().split('T')[0], notes: '' });
  const [filters, setFilters] = useState({ status: '', property: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const [dRes, pRes, uRes] = await Promise.all([
        API.get(qs ? `/property-keys?${qs}` : '/property-keys'),
        API.get('/properties?limit=500'),
        API.get('/users?limit=500'),
      ]);
      setData(Array.isArray(dRes.data) ? dRes.data : dRes.data.keys || []);
      setProperties(Array.isArray(pRes.data) ? pRes.data : pRes.data.properties || []);
      setUsers(Array.isArray(uRes.data) ? uRes.data : uRes.data.users || []);
    } catch (err) { toast('Failed to load keys', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filters]);

  const openCreate = () => { setSelected(null); setForm({ property: '', key_number: '' }); setModalOpen(true); };
  const openIssue = (row) => { setSelected(row); setIssueForm({ issued_to: '', issue_date: new Date().toISOString().split('T')[0], notes: '' }); setIssueModal(true); };
  const openReturn = (row) => { setSelected(row); setReturnForm({ return_date: new Date().toISOString().split('T')[0], notes: '' }); setReturnModal(true); };
  const openHistory = async (row) => {
    setSelected(row);
    try { const { data: h } = await API.get(`/property-keys/${row._id}/history`); setHistory(Array.isArray(h) ? h : []); }
    catch (err) { setHistory([]); }
    setHistoryModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/property-keys', form);
      toast('Key created');
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/property-keys/${selected._id}/issue`, issueForm);
      toast('Key issued');
      setIssueModal(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    try {
      await API.patch(`/property-keys/${selected._id}/return`, returnForm);
      toast('Key returned');
      setReturnModal(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/property-keys/${selected._id}`); toast('Key deleted'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const columns = [
    { header: 'Key Number', accessor: 'key_number' },
    { header: 'Property', render: (r) => r.property?.property_id || r.property?.location || (r.property?.name) || (typeof r.property === 'string' ? r.property : '-') },
    { header: 'Key Holder', render: (r) => r.key_holder?.full_name || r.key_holder?.name || r.issued_to?.full_name || r.issued_to?.name || '-' },
    { header: 'Status', render: (r) => statusBadge(r.status) },
    { header: 'Issue Date', render: (r) => r.issue_date ? new Date(r.issue_date).toLocaleDateString() : '-' },
    { header: 'Return Date', render: (r) => r.return_date ? new Date(r.return_date).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-white">Property Keys</h1><p className="text-stone-500 mt-1 dark:text-stone-400">Manage keys and access control</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">+ Add Key</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white">
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="issued">Issued</option>
          <option value="returned">Returned</option>
        </select>
        <select value={filters.property} onChange={(e) => setFilters({ ...filters, property: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white min-w-[180px]">
          <option value="">All Properties</option>
          {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id || p.location || p.name || p._id}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={(r) => openIssue(r)}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Key">
        <form onSubmit={handleCreate} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Property *</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })} required>
              <option value="">Search/Select property</option>
              {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id || p.location || p.name || p._id}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Key Number *</label>
            <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.key_number} onChange={(e) => setForm({ ...form, key_number: e.target.value })} required />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">Create</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={issueModal} onClose={() => setIssueModal(false)} title={`Issue Key - ${selected?.key_number || ''}`}>
        <form onSubmit={handleIssue} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Issue To *</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={issueForm.issued_to} onChange={(e) => setIssueForm({ ...issueForm, issued_to: e.target.value })} required>
              <option value="">Select employee/user</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.full_name || u.name || u.email || u._id}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Issue Date *</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white" value={issueForm.issue_date} onChange={(e) => setIssueForm({ ...issueForm, issue_date: e.target.value })} required />
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={2} value={issueForm.notes} onChange={(e) => setIssueForm({ ...issueForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setIssueModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600"><HiOutlineArrowPath size={15} /> Issue Key</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={returnModal} onClose={() => setReturnModal(false)} title={`Return Key - ${selected?.key_number || ''}`}>
        <form onSubmit={handleReturn} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Return Date *</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white" value={returnForm.return_date} onChange={(e) => setReturnForm({ ...returnForm, return_date: e.target.value })} required />
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={2} value={returnForm.notes} onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setReturnModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600"><HiOutlineArrowPath size={15} /> Return Key</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={historyModal} onClose={() => setHistoryModal(false)} title={`Key History - ${selected?.key_number || ''}`} size="lg">
        {history.length === 0 ? (
          <p className="text-center text-stone-400 dark:text-stone-500 py-8">No history records found</p>
        ) : (
          <div className="space-y-3">
            {history.map((h, i) => (
              <div key={i} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border border-stone-100 dark:border-stone-600">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${h.action === 'issued' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' : h.action === 'returned' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{h.action?.charAt(0).toUpperCase() + h.action?.slice(1)}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{h.date ? new Date(h.date).toLocaleString() : ''}</span>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-200">
                  {h.action === 'issued' ? `Issued to: ${h.issued_to?.full_name || h.issued_to?.name || h.issued_to || 'Unknown'}` : `Returned by: ${h.returned_by?.full_name || h.returned_by?.name || h.returned_by || 'Unknown'}`}
                </p>
                {h.notes && <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{h.notes}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-2">
          <button type="button" onClick={() => setHistoryModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Close</button>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Key" message="Are you sure you want to delete this key?" />
    </div>
  );
}
