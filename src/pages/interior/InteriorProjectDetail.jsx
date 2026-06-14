import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash, HiOutlineReceiptPercent, HiOutlineCurrencyDollar } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  not_started: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  running: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
};

const tabs = ['Overview', 'Materials', 'Budget', 'Milestones', 'Team', 'Expenses', 'Invoices'];

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function InteriorProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [users, setUsers] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [team, setTeam] = useState([]);
  const [budgetForm, setBudgetForm] = useState({ estimated_amount: '', approved_amount: '', revised_amount: '', remarks: '' });
  const [milestoneForm, setMilestoneForm] = useState({ title: '', description: '', progress_pct: 0, due_date: '', status: 'pending' });
  const [teamForm, setTeamForm] = useState({ user_id: '', role_in_project: '' });
  const [invoices, setInvoices] = useState([]);
  const [editBudgetId, setEditBudgetId] = useState(null);
  const [editMilestoneId, setEditMilestoneId] = useState(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [expenseForm, setExpenseForm] = useState({ expense_name: '', category: 'other', cost: '', paid_amount: '', payment_date: '', vendor: '', notes: '' });
  const [form, setForm] = useState({});

  const fetchProject = () => {
    setLoading(true);
    Promise.all([
      API.get(`/interior-projects/${id}`),
      API.get(`/interior-invoices/by-project/${id}`),
    ])
      .then(([projRes, invRes]) => {
        const res = projRes.data;
        setProject(res);
        setForm({
          title: res.title || '',
          flat_id: res.flat_id || '',
          project_code: res.project_code || '',
          client_id: res.client_id?._id || '',
          branch_id: res.branch_id?._id || '',
          project_type: res.project_type || 'residential',
          status: res.status || 'not_started',
          address: res.address || '',
          total_area_sqft: res.total_area_sqft || '',
          start_date: res.start_date ? res.start_date.split('T')[0] : '',
          expected_end_date: res.expected_end_date ? res.expected_end_date.split('T')[0] : '',
          scope_of_work: res.scope_of_work || '',
          notes: res.notes || '',
          contract_amount: res.contract_amount || '',
          material_cost: res.material_cost || '',
          other_cost: res.other_cost || '',
          received_amount: res.received_amount || '',
        });
        setBudgets(res.budgets || []);
        setMilestones(res.milestones || []);
        setTeam(res.team || []);
        setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      })
      .catch(() => toast('Failed to load project', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProject(); }, [id]);
  useEffect(() => { API.get('/users').then((res) => setUsers(Array.isArray(res.data) ? res.data : [])).catch(() => {}); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/interior-projects/${id}`, {
        ...form,
        total_area_sqft: form.total_area_sqft ? Number(form.total_area_sqft) : undefined,
        contract_amount: form.contract_amount ? Number(form.contract_amount) : 0,
        material_cost: form.material_cost ? Number(form.material_cost) : 0,
        other_cost: form.other_cost ? Number(form.other_cost) : 0,
        received_amount: form.received_amount ? Number(form.received_amount) : 0,
      });
      toast('Project updated');
      setEditModalOpen(false);
      fetchProject();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      if (editBudgetId) {
        await API.put(`/interior-projects/${id}/budgets/${editBudgetId}`, budgetForm);
        toast('Budget updated');
      } else {
        await API.post(`/interior-projects/${id}/budgets`, budgetForm);
        toast('Budget added');
      }
      setBudgetModalOpen(false);
      setEditBudgetId(null);
      setBudgetForm({ estimated_amount: '', approved_amount: '', revised_amount: '', remarks: '' });
      const res = await API.get(`/interior-projects/${id}`);
      setBudgets(res.data.budgets || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const openBudgetEdit = (b) => {
    setEditBudgetId(b._id);
    setBudgetForm({
      estimated_amount: b.estimated_amount || '',
      approved_amount: b.approved_amount || '',
      revised_amount: b.revised_amount || '',
      remarks: b.remarks || '',
    });
    setBudgetModalOpen(true);
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await API.delete(`/interior-projects/${id}/budgets/${budgetId}`);
      toast('Budget deleted');
      const res = await API.get(`/interior-projects/${id}`);
      setBudgets(res.data.budgets || []);
    } catch (err) {
      toast('Error deleting budget', 'error');
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    try {
      if (editMilestoneId) {
        await API.put(`/interior-projects/${id}/milestones/${editMilestoneId}`, milestoneForm);
        toast('Milestone updated');
      } else {
        await API.post(`/interior-projects/${id}/milestones`, milestoneForm);
        toast('Milestone added');
      }
      setMilestoneModalOpen(false);
      setEditMilestoneId(null);
      setMilestoneForm({ title: '', description: '', progress_pct: 0, due_date: '', status: 'pending' });
      const res = await API.get(`/interior-projects/${id}`);
      setMilestones(res.data.milestones || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDeleteMilestone = async (milestoneId) => {
    try {
      await API.delete(`/interior-projects/${id}/milestones/${milestoneId}`);
      toast('Milestone deleted');
      const res = await API.get(`/interior-projects/${id}`);
      setMilestones(res.data.milestones || []);
    } catch (err) {
      toast('Error deleting milestone', 'error');
    }
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/interior-projects/${id}/team`, teamForm);
      toast('Team member added');
      setTeamModalOpen(false);
      setTeamForm({ user_id: '', role_in_project: '' });
      const res = await API.get(`/interior-projects/${id}`);
      setTeam(res.data.team || []);
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleRemoveTeamMember = async (teamId) => {
    try {
      await API.delete(`/interior-projects/${id}/team/${teamId}`);
      toast('Team member removed');
      const res = await API.get(`/interior-projects/${id}`);
      setTeam(res.data.team || []);
    } catch (err) {
      toast('Error removing member', 'error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const milestoneBadge = (status) => {
    const map = {
      pending: 'bg-blue-50 text-blue-700',
      in_progress: 'bg-amber-50 text-amber-700',
      completed: 'bg-emerald-50 text-emerald-700',
      delayed: 'bg-red-50 text-red-700',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>{status?.replace('_', ' ')}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Project not found</p>
        <button onClick={() => navigate('/interior-projects')} className="mt-4 text-sm text-stone-900 underline">Back to projects</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/interior-projects')} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{project.title}</h1>
              <span className={statusColors[project.status] || statusColors.draft}>{project.status?.replace('_', ' ')}</span>
            </div>
            <p className="text-stone-500 mt-1">Code: {project.project_code || '-'} &middot; Client: {project.client_id?.full_name || '-'}</p>
          </div>
        </div>
        <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          <HiOutlinePencilSquare size={16} /> Edit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Flat ID</p>
            <p className="text-sm text-stone-900 mt-1 font-medium">{project.flat_id || project.project_code || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Client</p>
            <p className="text-sm text-stone-900 mt-1">{project.client_id?.full_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Branch</p>
            <p className="text-sm text-stone-900 mt-1">{project.branch_id?.name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Project Type</p>
            <p className="text-sm text-stone-900 mt-1 capitalize">{project.project_type || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Area (sqft)</p>
            <p className="text-sm text-stone-900 mt-1">{project.total_area_sqft ? `${project.total_area_sqft} sqft` : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Start Date</p>
            <p className="text-sm text-stone-900 mt-1">{project.start_date ? formatDate(project.start_date) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Expected End</p>
            <p className="text-sm text-stone-900 mt-1">{project.expected_end_date ? formatDate(project.expected_end_date) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Assigned To</p>
            <p className="text-sm text-stone-900 mt-1">{project.assigned_to?.full_name || 'Unassigned'}</p>
          </div>
        </div>
        {project.address && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Address</p>
            <p className="text-sm text-stone-700">{project.address}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Contract</p><p className="text-xl font-bold text-emerald-900 mt-0.5">₹{(project.contract_amount || 0).toLocaleString()}</p></div>
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700/70">Total Cost</p><p className="text-xl font-bold text-blue-900 mt-0.5">₹{((project.material_cost || 0) + (project.other_cost || 0) + (project.direct_expenses || []).reduce((s, e) => s + (e.cost || 0), 0)).toLocaleString()}</p></div>
        <div className={`p-4 rounded-2xl border ${project.profit_loss >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><p className={`text-xs font-semibold uppercase tracking-wider ${project.profit_loss >= 0 ? 'text-emerald-700/70' : 'text-red-700/70'}`}>Profit / Loss</p><p className={`text-xl font-bold mt-0.5 ${project.profit_loss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>₹{(project.profit_loss || 0).toLocaleString()}</p></div>
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><p className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">Client Balance</p><p className="text-xl font-bold text-amber-900 mt-0.5">₹{(project.balance || 0).toLocaleString()}</p></div>
      </div>

      <div className="border-b border-stone-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === tab ? 'text-stone-900 border-stone-900' : 'text-stone-400 border-transparent hover:text-stone-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Scope of Work</h3>
          {project.scope_of_work ? (
            <p className="text-sm text-stone-700 whitespace-pre-wrap">{project.scope_of_work}</p>
          ) : (
            <p className="text-sm text-stone-400">No scope of work defined</p>
          )}
          {project.notes && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Created</p>
            <p className="text-sm text-stone-900 mt-1">{formatDate(project.createdAt)}</p>
          </div>
        </div>
      )}

      {activeTab === 'Materials' && (
        <div className="space-y-4">
          {project.materials?.length ? (
            project.materials.map((mat, idx) => {
              const totalPaid = (mat.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
              const dueAmt = (mat.cost || 0) - totalPaid;
              return (
                <div key={idx} className="bg-white rounded-2xl border border-stone-200 p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-stone-900">{mat.item_name}</h4>
                      <p className="text-sm text-stone-500 mt-0.5">Cost: ₹{(mat.cost || 0).toLocaleString()}</p>
                      {mat.vendor && <p className="text-xs text-stone-400 mt-0.5">Vendor: {mat.vendor?.name || 'Unknown'}</p>}
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${mat.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : mat.payment_status === 'partial' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>
                        {mat.payment_status ? mat.payment_status.charAt(0).toUpperCase() + mat.payment_status.slice(1) : 'Credit'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="p-2.5 rounded-lg bg-stone-50 text-center">
                      <p className="text-[10px] text-stone-400 font-semibold uppercase">Cost</p>
                      <p className="text-sm font-bold text-stone-900">₹{(mat.cost || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50 text-center">
                      <p className="text-[10px] text-emerald-600 font-semibold uppercase">Paid</p>
                      <p className="text-sm font-bold text-emerald-700">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-amber-50 text-center">
                      <p className="text-[10px] text-amber-600 font-semibold uppercase">Due</p>
                      <p className={`text-sm font-bold ${dueAmt > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>₹{dueAmt.toLocaleString()}</p>
                    </div>
                  </div>

                  {(mat.payments || []).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Payment Timeline</p>
                      <div className="space-y-2">
                        {mat.payments.map((p, pi) => (
                          <div key={pi} className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 border border-stone-100">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-emerald-500" />
                              <div>
                                <p className="text-sm font-medium text-stone-700">₹{(p.amount || 0).toLocaleString()}</p>
                                {p.notes && <p className="text-xs text-stone-400">{p.notes}</p>}
                              </div>
                            </div>
                            <span className="text-xs text-stone-400">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dueAmt > 0 && (
                    <button
                      onClick={async () => {
                        const amt = prompt('Enter payment amount (₹):');
                        if (!amt || isNaN(amt) || Number(amt) <= 0) return;
                        try {
                          await API.post(`/interior-projects/${id}/materials/${mat._id}/payments`, {
                            amount: Number(amt),
                            payment_date: new Date().toISOString().split('T')[0],
                            notes: prompt('Notes (optional):') || '',
                          });
                          toast('Payment recorded');
                          fetchProject();
                        } catch (err) { toast('Error recording payment', 'error'); }
                      }}
                      className="mt-3 px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      + Add Payment
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-stone-400">
              <p>No materials added yet</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Budget' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Budget Entries</h3>
            <button onClick={() => { setEditBudgetId(null); setBudgetForm({ estimated_amount: '', approved_amount: '', revised_amount: '', remarks: '' }); setBudgetModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Budget</button>
          </div>
          {budgets.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No budget entries</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Estimated</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Approved</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Revised</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Remarks</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((b) => (
                    <tr key={b._id} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-3 text-stone-700">{b.estimated_amount ? `₹${Number(b.estimated_amount).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-stone-700">{b.approved_amount ? `₹${Number(b.approved_amount).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-stone-700">{b.revised_amount ? `₹${Number(b.revised_amount).toLocaleString()}` : '-'}</td>
                      <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">{b.remarks || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openBudgetEdit(b)} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"><HiOutlinePencilSquare size={15} /></button>
                        <button onClick={() => { setConfirmAction(() => () => handleDeleteBudget(b._id)); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Milestones' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Milestones</h3>
            <button onClick={() => { setEditMilestoneId(null); setMilestoneForm({ title: '', description: '', progress_pct: 0, due_date: '', status: 'pending' }); setMilestoneModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Milestone</button>
          </div>
          {milestones.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No milestones defined</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m._id} className="p-4 rounded-xl bg-stone-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900">{m.title}</p>
                        {milestoneBadge(m.status)}
                      </div>
                      {m.description && <p className="text-xs text-stone-500 mt-1">{m.description}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${m.progress_pct >= 100 ? 'bg-emerald-500' : m.progress_pct >= 50 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${m.progress_pct || 0}%` }} />
                          </div>
                          <span className="text-xs font-medium text-stone-600">{m.progress_pct || 0}%</span>
                        </div>
                        <span className="text-xs text-stone-400">Due: {m.due_date ? formatDate(m.due_date) : '-'}</span>
                        {m.completed_date && <span className="text-xs text-emerald-600">Completed: {formatDate(m.completed_date)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <button onClick={() => { setEditMilestoneId(m._id); setMilestoneForm({ title: m.title, description: m.description || '', progress_pct: m.progress_pct || 0, due_date: m.due_date ? m.due_date.split('T')[0] : '', status: m.status }); setMilestoneModalOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-white transition-all"><HiOutlinePencilSquare size={15} /></button>
                      <button onClick={() => { setConfirmAction(() => () => handleDeleteMilestone(m._id)); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Team' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Team Members</h3>
            <button onClick={() => { setTeamForm({ user_id: '', role_in_project: '' }); setTeamModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Member</button>
          </div>
          {team.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No team members assigned</p>
          ) : (
            <div className="space-y-3">
              {team.map((m) => (
                <div key={m._id} className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">{m.user_id?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-stone-500 mt-0.5">{m.role_in_project || 'Team Member'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">Added {formatDate(m.assigned_at)}</span>
                    <button onClick={() => { setConfirmAction(() => () => handleRemoveTeamMember(m._id)); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Expenses' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2"><HiOutlineCurrencyDollar size={18} /> Direct Expenses</h3>
            <button onClick={() => { setEditExpenseId(null); setExpenseForm({ expense_name: '', category: 'other', cost: '', paid_amount: '', payment_date: '', vendor: '', notes: '' }); setExpenseModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Expense</button>
          </div>
          {(!project.direct_expenses || project.direct_expenses.length === 0) ? (
            <p className="text-sm text-stone-400 text-center py-8">No expenses recorded</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Expense</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Category</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Cost</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Paid</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Vendor</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Notes</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {project.direct_expenses.map((exp, idx) => (
                    <tr key={exp._id || idx} className="border-b border-stone-100 hover:bg-stone-50/50">
                      <td className="px-4 py-3 font-medium text-stone-900">{exp.expense_name}</td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 ring-1 ring-stone-200 capitalize">{exp.category || 'other'}</span></td>
                      <td className="px-4 py-3 text-right text-stone-700 font-mono">₹{(exp.cost || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700 font-mono">₹{(exp.paid_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-stone-600">{exp.vendor || '-'}</td>
                      <td className="px-4 py-3 text-stone-500">{exp.payment_date ? formatDate(exp.payment_date) : '-'}</td>
                      <td className="px-4 py-3 text-stone-500 max-w-[160px] truncate">{exp.notes || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => { setEditExpenseId(exp._id); setExpenseForm({ expense_name: exp.expense_name, category: exp.category || 'other', cost: exp.cost || '', paid_amount: exp.paid_amount || '', payment_date: exp.payment_date ? exp.payment_date.split('T')[0] : '', vendor: exp.vendor || '', notes: exp.notes || '' }); setExpenseModalOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"><HiOutlinePencilSquare size={15} /></button>
                        <button onClick={() => { setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/expenses/${exp._id}`); toast('Expense deleted'); fetchProject(); } catch (err) { toast('Error deleting expense', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Invoices' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2"><HiOutlineReceiptPercent size={18} /> Invoices</h3>
            <button onClick={() => navigate(`/interior-invoices?interior_project=${id}`)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineReceiptPercent size={14} /> View All</button>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No invoices for this project</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 bg-stone-50/50">
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Invoice #</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Date</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Sale</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Purchase</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Expense</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Profit</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Paid</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Status</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-stone-900">{inv.invoice_number}</td>
                      <td className="px-4 py-3 text-stone-700">{inv.invoice_date ? formatDate(inv.invoice_date) : '-'}</td>
                      <td className="px-4 py-3 text-right text-stone-700">₹{(inv.total_sale || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-blue-700">₹{(inv.total_purchase || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-amber-700">₹{(inv.total_expense || 0).toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${(inv.profit || 0) >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>₹{(inv.profit || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-stone-700">₹{(inv.paid_amount || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium inline-block ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                          inv.status === 'partial' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                          inv.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' :
                          inv.status === 'overdue' ? 'bg-red-50 text-red-700 ring-1 ring-red-200' :
                          'bg-stone-50 text-stone-700 ring-1 ring-stone-200'
                        }`}>{inv.status?.charAt(0).toUpperCase() + inv.status?.slice(1)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => navigate(`/interior-invoices/${inv._id}`)} className="text-sm text-stone-600 hover:text-stone-900 font-medium cursor-pointer">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Project" size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Title *</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Flat ID</label><input className={inputClass} value={form.flat_id} onChange={(e) => setForm({ ...form, flat_id: e.target.value })} placeholder="e.g. B8-203" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Code</label><input className={inputClass} value={form.project_code} onChange={(e) => setForm({ ...form, project_code: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Type</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.project_type} onChange={(e) => setForm({ ...form, project_type: e.target.value })}>
              {['residential', 'commercial', 'office', 'renovation'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['not_started', 'running', 'on_hold', 'completed', 'closed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Area (sqft)</label><input type="number" className={inputClass} value={form.total_area_sqft} onChange={(e) => setForm({ ...form, total_area_sqft: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Start Date</label><input type="date" className={inputClass} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Expected End Date</label><input type="date" className={inputClass} value={form.expected_end_date} onChange={(e) => setForm({ ...form, expected_end_date: e.target.value })} /></div>
          </div>
          <div className="border-t border-stone-200 pt-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Financial Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Contract Amount</label><input type="number" className={inputClass} value={form.contract_amount} onChange={(e) => setForm({ ...form, contract_amount: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Material Cost</label><input type="number" className={inputClass} value={form.material_cost} onChange={(e) => setForm({ ...form, material_cost: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Other/Labour Cost</label><input type="number" className={inputClass} value={form.other_cost} onChange={(e) => setForm({ ...form, other_cost: e.target.value })} min="0" step="0.01" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Received Amount</label><input type="number" className={inputClass} value={form.received_amount} onChange={(e) => setForm({ ...form, received_amount: e.target.value })} min="0" step="0.01" /></div>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Scope of Work</label><textarea className={inputClass} rows={3} value={form.scope_of_work} onChange={(e) => setForm({ ...form, scope_of_work: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={budgetModalOpen} onClose={() => { setBudgetModalOpen(false); setEditBudgetId(null); }} title={editBudgetId ? 'Edit Budget' : 'Add Budget'} size="sm">
        <form onSubmit={handleAddBudget} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Estimated Amount</label><input type="number" className={inputClass} value={budgetForm.estimated_amount} onChange={(e) => setBudgetForm({ ...budgetForm, estimated_amount: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Approved Amount</label><input type="number" className={inputClass} value={budgetForm.approved_amount} onChange={(e) => setBudgetForm({ ...budgetForm, approved_amount: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Revised Amount</label><input type="number" className={inputClass} value={budgetForm.revised_amount} onChange={(e) => setBudgetForm({ ...budgetForm, revised_amount: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Remarks</label><input className={inputClass} value={budgetForm.remarks} onChange={(e) => setBudgetForm({ ...budgetForm, remarks: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setBudgetModalOpen(false); setEditBudgetId(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{editBudgetId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={milestoneModalOpen} onClose={() => { setMilestoneModalOpen(false); setEditMilestoneId(null); }} title={editMilestoneId ? 'Edit Milestone' : 'Add Milestone'} size="sm">
        <form onSubmit={handleAddMilestone} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Title *</label><input className={inputClass} value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} required /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Description</label><textarea className={inputClass} rows={2} value={milestoneForm.description} onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Progress (%)</label><input type="number" min={0} max={100} className={inputClass} value={milestoneForm.progress_pct} onChange={(e) => setMilestoneForm({ ...milestoneForm, progress_pct: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className={inputClass + " appearance-none cursor-pointer"} value={milestoneForm.status} onChange={(e) => setMilestoneForm({ ...milestoneForm, status: e.target.value })}>
              {['pending', 'in_progress', 'completed', 'delayed'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Due Date</label><input type="date" className={inputClass} value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setMilestoneModalOpen(false); setEditMilestoneId(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{editMilestoneId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Add Team Member" size="sm">
        <form onSubmit={handleAddTeamMember} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">User *</label>
            <select className={inputClass + " appearance-none cursor-pointer"} value={teamForm.user_id} onChange={(e) => setTeamForm({ ...teamForm, user_id: e.target.value })} required>
              <option value="">Select user</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Role in Project</label><input className={inputClass} value={teamForm.role_in_project} onChange={(e) => setTeamForm({ ...teamForm, role_in_project: e.target.value })} placeholder="e.g., Designer, Project Manager" /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTeamModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Add</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={expenseModalOpen} onClose={() => { setExpenseModalOpen(false); setEditExpenseId(null); }} title={editExpenseId ? 'Edit Expense' : 'Add Expense'} size="sm">
        <form onSubmit={async (e) => { e.preventDefault(); try { if (editExpenseId) { await API.put(`/interior-projects/${id}/expenses/${editExpenseId}`, { ...expenseForm, cost: Number(expenseForm.cost), paid_amount: expenseForm.paid_amount ? Number(expenseForm.paid_amount) : 0 }); toast('Expense updated'); } else { await API.post(`/interior-projects/${id}/expenses`, { ...expenseForm, cost: Number(expenseForm.cost), paid_amount: expenseForm.paid_amount ? Number(expenseForm.paid_amount) : 0 }); toast('Expense added'); } setExpenseModalOpen(false); setEditExpenseId(null); fetchProject(); } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); } }} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Expense Name *</label><input className={inputClass} value={expenseForm.expense_name} onChange={(e) => setExpenseForm({ ...expenseForm, expense_name: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Category</label><select className={inputClass + " appearance-none cursor-pointer"} value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}>
              {['labour', 'transport', 'permit', 'utility', 'equipment', 'other'].map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Cost (₹) *</label><input type="number" min="0" step="0.01" className={inputClass} value={expenseForm.cost} onChange={(e) => setExpenseForm({ ...expenseForm, cost: e.target.value })} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Paid Amount</label><input type="number" min="0" step="0.01" className={inputClass} value={expenseForm.paid_amount} onChange={(e) => setExpenseForm({ ...expenseForm, paid_amount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Date</label><input type="date" className={inputClass} value={expenseForm.payment_date} onChange={(e) => setExpenseForm({ ...expenseForm, payment_date: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Vendor</label><input className={inputClass} value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} placeholder="Vendor name" /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setExpenseModalOpen(false); setEditExpenseId(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{editExpenseId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { if (confirmAction) confirmAction(); setConfirmOpen(false); }} title="Confirm" message="Are you sure?" />
    </div>
  );
}