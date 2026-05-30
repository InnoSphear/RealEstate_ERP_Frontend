import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = { pending: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', approved: 'bg-green-50 text-green-700 ring-1 ring-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', fulfilled: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' };

export default function Requisitions() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ project_id: '', requested_by: user?._id || '', req_number: '', req_date: new Date().toISOString().split('T')[0], status: 'pending', notes: '' });

  const fetchData = async () => {
    setLoading(true);
    try { const [dRes, pRes, uRes] = await Promise.all([API.get('/material-requisitions'), API.get('/interior-projects'), API.get('/users')]); setData(dRes.data); setProjects(pRes.data); setUsers(uRes.data); }
    catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openCreate = () => { setSelected(null); setForm({ project_id: '', requested_by: user?._id || '', req_number: '', req_date: new Date().toISOString().split('T')[0], status: 'pending', notes: '' }); setModalOpen(true); };
  const openEdit = (row) => { setSelected(row); setForm({ project_id: row.project_id?._id || row.project_id, requested_by: row.requested_by?._id || row.requested_by || '', req_number: row.req_number || '', req_date: row.req_date ? row.req_date.split('T')[0] : '', status: row.status, notes: row.notes || '' }); setModalOpen(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await API.put(`/material-requisitions/${selected._id}`, form); toast('Requisition updated'); }
      else { await API.post('/material-requisitions', form); toast('Requisition created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/material-requisitions/${selected._id}`); toast('Requisition deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Req #', accessor: 'req_number' },
    { header: 'Project', render: (r) => r.project_id?.title || '-' },
    { header: 'Date', render: (r) => r.req_date ? new Date(r.req_date).toLocaleDateString() : '-' },
    { header: 'Requested By', render: (r) => r.requested_by?.full_name || '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status}</span> },
    { header: 'Notes', accessor: 'notes' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Material Requisitions</h1><p className="text-stone-500 mt-1">Request materials for projects</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Requisition</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Requisition' : 'Create Requisition'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} required><option value="">Select project</option>{projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Requested By *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.requested_by} onChange={(e) => setForm({ ...form, requested_by: e.target.value })} required><option value="">Select user</option>{users.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Req Number</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.req_number} onChange={(e) => setForm({ ...form, req_number: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.req_date} onChange={(e) => setForm({ ...form, req_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="fulfilled">Fulfilled</option></select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Requisition" message="Are you sure?" />
    </div>
  );
}
