import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
  not_started: 'bg-stone-100 text-stone-700 ring-1 ring-stone-200',
  running: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
};
const statuses = ['not_started', 'running', 'on_hold', 'completed', 'closed'];
const projectTypes = ['residential', 'commercial', 'office', 'renovation'];

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function InteriorProjects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isNew = location.pathname.endsWith('/new');
  const [data, setData] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(isNew);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    client_id: '', title: '', flat_id: '', project_code: '', project_type: 'residential',
    status: 'not_started', branch_id: user?.branch?._id || '',
    address: '', total_area_sqft: '', start_date: '', expected_end_date: '',
    scope_of_work: '', notes: '',
    contract_amount: '', material_cost: '', other_cost: '', received_amount: '',
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, cRes, bRes] = await Promise.all([API.get('/interior-projects'), API.get('/clients'), API.get('/branches')]);
      setData(dRes.data);
      setClients(cRes.data);
      setBranches(bRes.data);
    } catch (err) { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (isNew) {
      setSelected(null);
      setForm({
        client_id: '', title: '', flat_id: '', project_code: '', project_type: 'residential',
        status: 'not_started', branch_id: user?.branch?._id || '',
        address: '', total_area_sqft: '', start_date: '', expected_end_date: '',
        scope_of_work: '', notes: '',
        contract_amount: '', material_cost: '', other_cost: '', received_amount: '',
      });
      setModalOpen(true);
    }
  }, [isNew]);

  const openCreate = () => {
    setSelected(null);
    setForm({
      client_id: '', title: '', flat_id: '', project_code: '', project_type: 'residential',
      status: 'not_started', branch_id: user?.branch?._id || '',
      address: '', total_area_sqft: '', start_date: '', expected_end_date: '',
      scope_of_work: '', notes: '',
      contract_amount: '', material_cost: '', other_cost: '', received_amount: '',
    });
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      client_id: row.client_id?._id || row.client_id || '',
      title: row.title,
      flat_id: row.flat_id || '',
      project_code: row.project_code || '',
      project_type: row.project_type || 'residential',
      status: row.status,
      branch_id: row.branch_id?._id || row.branch_id || '',
      address: row.address || '',
      total_area_sqft: row.total_area_sqft || '',
      start_date: row.start_date ? row.start_date.split('T')[0] : '',
      expected_end_date: row.expected_end_date ? row.expected_end_date.split('T')[0] : '',
      scope_of_work: row.scope_of_work || '',
      notes: row.notes || '',
      contract_amount: row.contract_amount || '',
      material_cost: row.material_cost || '',
      other_cost: row.other_cost || '',
      received_amount: row.received_amount || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        total_area_sqft: form.total_area_sqft ? Number(form.total_area_sqft) : undefined,
        contract_amount: form.contract_amount ? Number(form.contract_amount) : 0,
        material_cost: form.material_cost ? Number(form.material_cost) : 0,
        other_cost: form.other_cost ? Number(form.other_cost) : 0,
        received_amount: form.received_amount ? Number(form.received_amount) : 0,
      };
      if (selected) { await API.put(`/interior-projects/${selected._id}`, payload); toast('Project updated'); }
      else { await API.post('/interior-projects', payload); toast('Project created'); }
      setModalOpen(false);
      if (isNew) navigate('/interior-projects', { replace: true });
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => { try { await API.delete(`/interior-projects/${selected._id}`); toast('Project deleted'); fetchData(); } catch (err) { toast('Error', 'error'); } };

  const columns = [
    { header: 'Flat ID', accessor: 'flat_id', render: (r) => <span className="font-medium text-stone-900">{r.flat_id || r.project_code || '-'}</span> },
    { header: 'Client', render: (r) => r.client_id?.full_name || '-' },
    { header: 'Status', render: (r) => <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[r.status] || statusColors.not_started}`}>{r.status?.replace(/_/g, ' ') || '-'}</span> },
    { header: 'Contract', render: (r) => `₹${(r.contract_amount || 0).toLocaleString()}` },
    { header: 'Material', render: (r) => `₹${(r.material_cost || 0).toLocaleString()}` },
    { header: 'Other Cost', render: (r) => `₹${(r.other_cost || 0).toLocaleString()}` },
    { header: 'Total Cost', render: (r) => `₹${((r.material_cost || 0) + (r.other_cost || 0)).toLocaleString()}` },
    { header: 'Received', render: (r) => `₹${(r.received_amount || 0).toLocaleString()}` },
    { header: 'Balance', render: (r) => {
      const b = (r.contract_amount || 0) - (r.received_amount || 0);
      return <span className={b > 0 ? 'text-amber-700 font-medium' : 'text-emerald-700 font-medium'}>₹{b.toLocaleString()}</span>;
    }},
    { header: 'Profit/Loss', render: (r) => {
      const p = (r.contract_amount || 0) - ((r.material_cost || 0) + (r.other_cost || 0));
      return <span className={p >= 0 ? 'text-emerald-700 font-medium' : 'text-red-700 font-medium'}>₹{p.toLocaleString()}</span>;
    }},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Interior Projects</h1><p className="text-stone-500 mt-1">Flat-wise interior project management with financial tracking</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Project</button>
      </div>
      <DataTable columns={columns} data={data} loading={loading} onView={(r) => navigate(`/interior-projects/${r._id}`)} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} />
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); if (isNew) navigate('/interior-projects', { replace: true }); }} title={selected ? 'Edit Project' : 'Create Project'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Title *</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Flat ID</label><input className={inputClass} value={form.flat_id} onChange={(e) => setForm({ ...form, flat_id: e.target.value })} placeholder="e.g. B8-203" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Code</label><input className={inputClass} value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Client *</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required><option value="">Select client</option>{clients.map((c) => <option key={c._id} value={c._id}>{c.full_name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required><option value="">Select branch</option>{branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Type</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>{projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className={`${inputClass} appearance-none cursor-pointer`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Area (sqft)</label><input type="number" className={inputClass} value={form.total_area_sqft} onChange={(e) => setForm({ ...form, total_area_sqft: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Start Date</label><input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Expected End</label><input type="date" className={inputClass} value={form.expected_end_date} onChange={(e) => setForm({ ...form, expected_end_date: e.target.value })} /></div>
          </div>
          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Financial Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Contract Amount</label><input type="number" className={inputClass} value={form.contract_amount} onChange={(e) => setForm({ ...form, contract_amount: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Material Cost</label><input type="number" className={inputClass} value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Other/Labour Cost</label><input type="number" className={inputClass} value={form.other_cost} onChange={(e) => setForm({ ...form, other_cost: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Received Amount</label><input type="number" className={inputClass} value={form.received_amount} onChange={(e) => setForm({ ...form, received_amount: e.target.value })} min="0" step="0.01" /></div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-3">
              <div className="p-3 rounded-xl bg-emerald-50 text-center"><p className="text-xs text-emerald-600 font-semibold">Total Cost</p><p className="text-lg font-bold text-emerald-800">₹{((Number(form.material_cost) || 0) + (Number(form.other_cost) || 0)).toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-amber-50 text-center"><p className="text-xs text-amber-600 font-semibold">Balance</p><p className="text-lg font-bold text-amber-800">₹{((Number(form.contract_amount) || 0) - (Number(form.received_amount) || 0)).toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-blue-50 text-center"><p className="text-xs text-blue-600 font-semibold">Profit/Loss</p><p className={`text-lg font-bold ${((Number(form.contract_amount) || 0) - (Number(form.material_cost) || 0) - (Number(form.other_cost) || 0)) >= 0 ? 'text-blue-800' : 'text-red-800'}`}>₹{((Number(form.contract_amount) || 0) - (Number(form.material_cost) || 0) - (Number(form.other_cost) || 0)).toLocaleString()}</p></div>
              <div className="p-3 rounded-xl bg-stone-50 text-center"><p className="text-xs text-stone-500 font-semibold">Receivable %</p><p className="text-lg font-bold text-stone-800">{Number(form.contract_amount) > 0 ? Math.round(((Number(form.received_amount) || 0) / Number(form.contract_amount)) * 100) : 0}%</p></div>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Scope of Work</label><textarea className={inputClass} rows={2} value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => { setModalOpen(false); if (isNew) navigate('/interior-projects', { replace: true }); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Project" message="Are you sure?" />
    </div>
  );
}
