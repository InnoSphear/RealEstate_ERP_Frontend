import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlinePlus, HiOutlineTrash, HiOutlineReceiptPercent, HiOutlineCurrencyDollar, HiOutlineBanknotes, HiOutlineDocumentArrowDown, HiOutlineArrowDownTray, HiOutlineClipboardDocumentList } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/logo.jpeg';

const statusColors = {
  not_started: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
  running: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  on_hold: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-stone-100 text-stone-400 ring-1 ring-stone-200',
};

const tabs = ['Overview', 'Materials', 'Payments', 'Budget', 'Milestones', 'Team', 'Vendors', 'Labour', 'Expenses', 'Invoices'];

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";
const emptyProject = {
  materials: [],
  payments: [],
  vendors: [],
  labour: [],
  direct_expenses: [],
  budgets: [],
  milestones: [],
  team: [],
};
const money = (value) => Number(value || 0).toLocaleString('en-IN');

export default function InteriorProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canViewProfit = hasRole('admin', 'manager');
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
  const [expenseForm, setExpenseForm] = useState({ expense_name: '', category: 'other', cost: '', paid_amount: '', payment_date: '', vendor: '', notes: '', project_ref_type: 'interior', project_ref_id: '' });
  const [vendors, setVendors] = useState([]);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState({ item_name: '', cost: '', vendor: '', from_stock: false, stock_item: '' });
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: '', payment_mode: 'cash', transaction_id: '', notes: '' });
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [billReceiptView, setBillReceiptView] = useState(false);
  const billRef = useRef(null);
  const [employees, setEmployees] = useState([]);

  const downloadBillPdf = async () => {
    if (!billRef.current) return;
    try {
      const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Interior_Bill_${project?.project_code || project?.flat_id || 'project'}.pdf`);
    } catch {
      toast('Failed to generate PDF', 'error');
    }
  };
  const [stockItems, setStockItems] = useState([]);
  const [vendorForm, setVendorForm] = useState({ vendor: '', role: '', notes: '' });
  const [labourModalOpen, setLabourModalOpen] = useState(false);
  const [labourForm, setLabourForm] = useState({ name: '', employee_id: '', role: '', phone: '', daily_wage: '', notes: '' });
  const [form, setForm] = useState({});

  const fetchProject = useCallback(() => {
    setLoading(true);
    setLoadError('');
    API.get(`/interior-projects/${id}`)
      .then((projRes) => {
        const res = { ...emptyProject, ...(projRes.data || {}) };
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
        setBudgets(Array.isArray(res.budgets) ? res.budgets : []);
        setMilestones(Array.isArray(res.milestones) ? res.milestones : []);
        setTeam(Array.isArray(res.team) ? res.team : []);
      })
      .catch((err) => {
        setProject(null);
        setLoadError(err.response?.data?.message || 'Failed to load project');
        toast('Failed to load project', 'error');
      })
      .finally(() => setLoading(false));
    API.get(`/interior-invoices/by-project/${id}`)
      .then((invRes) => setInvoices(Array.isArray(invRes.data) ? invRes.data : []))
      .catch(() => {});
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);
  useEffect(() => {
    API.get('/users').then((res) => setUsers(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/vendors').then((res) => setVendors(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/employees').then((res) => setEmployees(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    API.get('/stock').then((res) => setStockItems(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

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
    } catch {
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
    } catch {
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
    } catch {
      toast('Error removing member', 'error');
    }
  };

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const milestoneBadge = (status) => {
    const map = {
      pending: 'bg-blue-50 text-blue-700',
      in_progress: 'bg-amber-50 text-amber-700',
      completed: 'bg-emerald-50 text-emerald-700',
      delayed: 'bg-red-50 text-red-700',
    };
    return <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[status] || map.pending}`}>{status?.replace('_', ' ') || 'pending'}</span>;
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
        <p>{loadError || 'Project not found'}</p>
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
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{project.title || 'Interior Project'}</h1>
              <span className={statusColors[project.status] || statusColors.not_started}>{project.status?.replace('_', ' ') || 'not started'}</span>
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
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Contract</p><p className="text-xl font-bold text-emerald-900 mt-0.5">₹{money(project.contract_amount)}</p></div>
        <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700/70">Total Cost</p><p className="text-xl font-bold text-blue-900 mt-0.5">₹{money((project.material_cost || 0) + (project.other_cost || 0) + (project.direct_expenses || []).reduce((s, e) => s + (e.cost || 0), 0))}</p></div>
        {canViewProfit && (
          <div className={`p-4 rounded-2xl border ${(project.profit_loss || 0) >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><p className={`text-xs font-semibold uppercase tracking-wider ${(project.profit_loss || 0) >= 0 ? 'text-emerald-700/70' : 'text-red-700/70'}`}>Profit / Loss</p><p className={`text-xl font-bold mt-0.5 ${(project.profit_loss || 0) >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>₹{money(project.profit_loss)}</p></div>
        )}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200"><p className="text-xs font-semibold uppercase tracking-wider text-amber-700/70">Client Balance</p><p className="text-xl font-bold text-amber-900 mt-0.5">₹{money(project.balance)}</p></div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-900">Materials</h3>
            <button onClick={() => { setMaterialForm({ item_name: '', cost: '', vendor: '' }); setMaterialModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Material</button>
          </div>
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
                      {mat.from_stock && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">From Stock</span>}
                    </div>
                    <div className="text-right flex items-center gap-2">
                      {hasRole('admin') && (
                        <button onClick={(e) => { e.stopPropagation(); setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/materials/${mat._id}`); toast('Material deleted'); fetchProject(); } catch { toast('Error deleting material', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Delete material (admin only)"><HiOutlineTrash size={15} /></button>
                      )}
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

                  {(mat.bill_photos || []).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Shop Bills</p>
                      <div className="flex flex-wrap gap-2">
                        {mat.bill_photos.map((bill, bi) => (
                          <div key={bi} className="relative group">
                            <a href={bill.url} target="_blank" rel="noopener noreferrer">
                              <img src={bill.url} alt="Bill" className="w-20 h-20 rounded-xl object-cover border border-stone-200 hover:ring-2 hover:ring-stone-900/20 transition-all" />
                            </a>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await API.delete(`/interior-projects/${id}/materials/${mat._id}/bill/${bill._id}`);
                                  toast('Bill removed');
                                  fetchProject();
                                } catch { toast('Error removing bill', 'error'); }
                              }}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >&times;</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-3">
                    <input
                      type="file"
                      accept="image/*"
                      id={`bill-upload-${idx}`}
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                          await API.post(`/interior-projects/${id}/materials/${mat._id}/bill`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                          toast('Bill uploaded');
                          fetchProject();
                        } catch { toast('Upload failed', 'error'); }
                        e.target.value = '';
                      }}
                    />
                    <label htmlFor={`bill-upload-${idx}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 transition-all">
                      <HiOutlineDocumentArrowDown size={14} /> Upload Bill
                    </label>
                  </div>

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
                        } catch { toast('Error recording payment', 'error'); }
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

      {activeTab === 'Payments' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2"><HiOutlineBanknotes size={18} /> Client Payments</h3>
            <button onClick={() => { setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', transaction_id: '', notes: '' }); setPaymentModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Payment</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700/70">Contract</p>
              <p className="text-xl font-bold text-emerald-900 mt-0.5">₹{(project.contract_amount || 0).toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700/70">Received</p>
              <p className="text-xl font-bold text-blue-900 mt-0.5">₹{(project.received_amount || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-2xl border ${(project.balance || 0) > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500/70">Balance</p>
              <p className={`text-xl font-bold mt-0.5 ${(project.balance || 0) > 0 ? 'text-amber-900' : 'text-emerald-900'}`}>₹{(project.balance || 0).toLocaleString()}</p>
            </div>
          </div>

          {(!project.payments || project.payments.length === 0) ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-stone-400">
              <p>No payments received yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50/50">
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Amount</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Date</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Mode</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Txn ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Notes</th>
                      <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(project.payments || [])].sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date)).map((p, idx) => (
                      <tr key={p._id || idx} className="border-b border-stone-100 hover:bg-stone-50/50">
                        <td className="px-4 py-3 text-stone-500">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-emerald-700">₹{(p.amount || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-stone-700">{p.payment_date ? formatDate(p.payment_date) : '-'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-600 ring-1 ring-stone-200 capitalize">{p.payment_mode || 'cash'}</span></td>
                        <td className="px-4 py-3 text-stone-600 font-mono text-xs">{p.transaction_id || '-'}</td>
                        <td className="px-4 py-3 text-stone-500 max-w-[160px] truncate">{p.notes || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => { setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/payments/${p._id}`); toast('Payment deleted'); fetchProject(); } catch { toast('Error', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {project.payments?.length > 0 && (
            <div className="text-right">
              <button onClick={() => setBillModalOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineReceiptPercent size={16} /> View Complete Bill</button>
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

      {activeTab === 'Vendors' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Assigned Vendors</h3>
            <button onClick={() => { setVendorForm({ vendor: '', role: '', notes: '' }); setVendorModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Assign Vendor</button>
          </div>
          {(!project.vendors || project.vendors.length === 0) ? (
            <p className="text-sm text-stone-400 text-center py-8">No vendors assigned to this project</p>
          ) : (
            <div className="space-y-3">
              {project.vendors.map((v) => (
                <div key={v._id} className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">{v.vendor?.name || 'Unknown Vendor'}</p>
                      {v.vendor?.phone && <span className="text-xs text-stone-400">{v.vendor.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {v.role && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">{v.role}</span>}
                      {v.assigned_at && <span className="text-xs text-stone-400">Assigned {formatDate(v.assigned_at)}</span>}
                    </div>
                    {v.notes && <p className="text-xs text-stone-500 mt-1">{v.notes}</p>}
                  </div>
                  <button onClick={() => { setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/vendors/${v._id}`); toast('Vendor removed'); fetchProject(); } catch { toast('Error removing vendor', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Labour' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Labourers</h3>
            <button onClick={() => { setLabourForm({ name: '', employee_id: '', role: '', phone: '', daily_wage: '', notes: '' }); setLabourModalOpen(true); }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Assign Labour</button>
          </div>
          {(!project.labour || project.labour.length === 0) ? (
            <p className="text-sm text-stone-400 text-center py-8">No labourers assigned to this project</p>
          ) : (
            <div className="space-y-3">
              {project.labour.map((l) => (
                <div key={l._id} className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-stone-900">{l.name}</p>
                      {l.phone && <span className="text-xs text-stone-400">{l.phone}</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {l.role && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">{l.role}</span>}
                      {l.daily_wage && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">₹{l.daily_wage}/day</span>}
                      {l.assigned_at && <span className="text-xs text-stone-400">Assigned {formatDate(l.assigned_at)}</span>}
                    </div>
                    {l.notes && <p className="text-xs text-stone-500 mt-1">{l.notes}</p>}
                  </div>
                  <button onClick={() => { setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/labour/${l._id}`); toast('Labour removed'); fetchProject(); } catch { toast('Error removing labour', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
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
            <button onClick={() => { setEditExpenseId(null); setExpenseForm({ expense_name: '', category: 'other', cost: '', paid_amount: '', payment_date: '', vendor: '', notes: '', project_ref_type: 'interior', project_ref_id: '' }); setExpenseModalOpen(true); }} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={14} /> Add Expense</button>
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
                        <button onClick={() => { setEditExpenseId(exp._id); setExpenseForm({ expense_name: exp.expense_name, category: exp.category || 'other', cost: exp.cost || '', paid_amount: exp.paid_amount || '', payment_date: exp.payment_date ? exp.payment_date.split('T')[0] : '', vendor: exp.vendor || '', notes: exp.notes || '', project_ref_type: exp.project_ref_type || 'interior', project_ref_id: exp.project_ref_id || '' }); setExpenseModalOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"><HiOutlinePencilSquare size={15} /></button>
                        <button onClick={() => { setConfirmAction(() => async () => { try { await API.delete(`/interior-projects/${id}/expenses/${exp._id}`); toast('Expense deleted'); fetchProject(); } catch { toast('Error deleting expense', 'error'); } }); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
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
        <form onSubmit={async (e) => { e.preventDefault(); try { const payload = { ...expenseForm, cost: Number(expenseForm.cost), paid_amount: expenseForm.paid_amount ? Number(expenseForm.paid_amount) : 0 }; if (editExpenseId) { await API.put(`/interior-projects/${id}/expenses/${editExpenseId}`, payload); toast('Expense updated'); } else { await API.post(`/interior-projects/${id}/expenses`, payload); toast('Expense added'); } setExpenseModalOpen(false); setEditExpenseId(null); fetchProject(); } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); } }} className="space-y-4">
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
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Map to Property</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={`${expenseForm.project_ref_type || 'interior'}|${expenseForm.project_ref_id || ''}`} onChange={(e) => {
              const [type, id] = e.target.value.split('|');
              setExpenseForm({ ...expenseForm, project_ref_type: type, project_ref_id: id || '' });
            }}>
              <option value="interior|">Same Interior Project</option>
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setExpenseModalOpen(false); setEditExpenseId(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{editExpenseId ? 'Update' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={vendorModalOpen} onClose={() => setVendorModalOpen(false)} title="Assign Vendor" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await API.post(`/interior-projects/${id}/vendors`, vendorForm);
            toast('Vendor assigned');
            setVendorModalOpen(false);
            fetchProject();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        }} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Vendor *</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={vendorForm.vendor} onChange={(e) => setVendorForm({ ...vendorForm, vendor: e.target.value })} required>
              <option value="">Select vendor</option>
              {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Role</label><input className={inputClass} value={vendorForm.role} onChange={(e) => setVendorForm({ ...vendorForm, role: e.target.value })} placeholder="e.g., Supplier, Contractor" /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={vendorForm.notes} onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setVendorModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Assign</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={labourModalOpen} onClose={() => setLabourModalOpen(false)} title="Assign Labour" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await API.post(`/interior-projects/${id}/labour`, {
              ...labourForm,
              daily_wage: labourForm.daily_wage ? Number(labourForm.daily_wage) : undefined,
            });
            toast('Labour assigned');
            setLabourModalOpen(false);
            fetchProject();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        }} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Select Employee</label>
            <select className={`${inputClass} appearance-none cursor-pointer`} value={labourForm.employee_id} onChange={(e) => {
              const emp = employees.find((em) => em._id === e.target.value);
              setLabourForm({ ...labourForm, employee_id: e.target.value, name: emp ? emp.full_name : '', phone: emp ? emp.mobile || '' : '', role: emp ? emp.designation || '' : labourForm.role });
            }}>
              <option value="">-- Manual Entry --</option>
              {employees.map((em) => <option key={em._id} value={em._id}>{em.full_name} ({em.designation || em.department || 'N/A'})</option>)}
            </select>
          </div>
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs text-stone-400 mb-2">Or enter manually:</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Name *</label><input className={inputClass} value={labourForm.name} onChange={(e) => setLabourForm({ ...labourForm, name: e.target.value, employee_id: '' })} placeholder="Labourer name" /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label><input className={inputClass} value={labourForm.phone} onChange={(e) => setLabourForm({ ...labourForm, phone: e.target.value })} placeholder="Phone number" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Role</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={labourForm.role} onChange={(e) => setLabourForm({ ...labourForm, role: e.target.value })}>
                <option value="">Select role</option>
                {['electrician', 'plumber', 'carpenter', 'painter', 'helper', 'mason', 'other'].map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Daily Wage (₹)</label><input type="number" min="0" step="1" className={inputClass} value={labourForm.daily_wage} onChange={(e) => setLabourForm({ ...labourForm, daily_wage: e.target.value })} placeholder="e.g. 800" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={labourForm.notes} onChange={(e) => setLabourForm({ ...labourForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setLabourModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Assign</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} title="Add Client Payment" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await API.post(`/interior-projects/${id}/payments`, {
              ...paymentForm,
              amount: Number(paymentForm.amount),
            });
            toast('Payment recorded');
            setPaymentModalOpen(false);
            fetchProject();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        }} className="space-y-4">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label><input type="number" min="0" step="0.01" className={inputClass} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label><input type="date" className={inputClass} value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Mode</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                {['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'online', 'other'].map((m) => <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1).replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Transaction ID</label><input className={inputClass} value={paymentForm.transaction_id} onChange={(e) => setPaymentForm({ ...paymentForm, transaction_id: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Add Payment</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={billModalOpen} onClose={() => { setBillModalOpen(false); setBillReceiptView(false); }} title={billReceiptView ? 'Payment Receipt' : 'Complete Bill'} size="2xl">
        {!billReceiptView && (
          <div id="complete-bill">
            <style>{`
              @media print {
                body * { visibility: hidden; }
                #complete-bill, #complete-bill * { visibility: visible; }
                #complete-bill { position: absolute; left: 0; top: 0; width: 100%; }
                .no-print { display: none !important; }
              }
            `}</style>
            <div className="p-6 space-y-6">
              <div className="text-center border-b border-stone-200 pb-4">
                <h2 className="text-2xl font-bold text-stone-900">Shivam International</h2>
                <p className="text-sm text-stone-500">Real Estate & Interior Solutions</p>
                <p className="text-lg font-bold text-stone-800 mt-3 uppercase tracking-wider">Complete Payment Statement</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-stone-400 text-xs uppercase">Bill To</p>
                  <p className="font-semibold text-stone-900">{project.client_id?.full_name || 'N/A'}</p>
                  <p className="text-stone-500">Project: {project.title}</p>
                  <p className="text-stone-500">Flat: {project.flat_id || project.project_code || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-400 text-xs uppercase">Statement Date</p>
                  <p className="font-semibold text-stone-900">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-stone-500 mt-1">Contract: ₹{(project.contract_amount || 0).toLocaleString()}</p>
                  <p className="text-stone-500">Received: ₹{(project.received_amount || 0).toLocaleString()}</p>
                </div>
              </div>
              <table className="w-full text-sm border border-stone-200">
                <thead>
                  <tr className="bg-stone-50">
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">#</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Date</th>
                    <th className="px-3 py-2 text-left font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Mode</th>
                    <th className="px-3 py-2 text-right font-semibold text-stone-600 text-xs uppercase border-b border-stone-200">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(project.payments || [])].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date)).map((p, idx) => (
                    <tr key={p._id || idx} className="border-b border-stone-100">
                      <td className="px-3 py-2 text-stone-500">{idx + 1}</td>
                      <td className="px-3 py-2 text-stone-700">{p.payment_date ? formatDate(p.payment_date) : '-'}</td>
                      <td className="px-3 py-2 text-stone-600 capitalize">{p.payment_mode || 'cash'}</td>
                      <td className="px-3 py-2 text-right font-mono text-emerald-700 font-medium">₹{(p.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50 font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-stone-700">Total Received</td>
                    <td className="px-3 py-2 text-right text-emerald-800">₹{(project.received_amount || 0).toLocaleString()}</td>
                  </tr>
                  <tr className="bg-stone-50 font-semibold">
                    <td colSpan={3} className="px-3 py-2 text-right text-stone-700">Balance</td>
                    <td className={`px-3 py-2 text-right ${(project.balance || 0) > 0 ? 'text-amber-800' : 'text-emerald-800'}`}>₹{(project.balance || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              <div className="text-center text-xs text-stone-400 pt-2 border-t border-stone-100">
                <p>This is a computer-generated statement</p>
              </div>
              <div className="flex justify-center gap-3 no-print pt-4">
                <button onClick={() => window.print()} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineReceiptPercent size={16} /> Print</button>
                <button onClick={() => setBillReceiptView(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-700 hover:bg-stone-50 border border-stone-200"><HiOutlineClipboardDocumentList size={16} /> View Receipts</button>
              </div>
            </div>
          </div>
        )}
        {billReceiptView && (
          <div className="space-y-6" id="interior-payment-receipt">
            <div className="flex gap-2 mb-2 no-print">
              <button onClick={() => setBillReceiptView(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer">
                ← Back to Statement
              </button>
              <button onClick={downloadBillPdf} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer">
                <HiOutlineArrowDownTray size={14} /> Download PDF
              </button>
            </div>
            {[...(project.payments || [])].sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date)).map((p, pidx) => (
              <div key={p._id || pidx} ref={pidx === 0 ? billRef : null} className="border border-stone-200 rounded-2xl p-8 bg-white mb-4">
                <div className="flex items-center gap-4 border-b border-stone-200 pb-6 mb-6">
                  <img src={logo} alt="Shivam International" className="w-16 h-16 rounded-xl object-cover" />
                  <div>
                    <h2 className="text-xl font-bold text-stone-900">Shivam International</h2>
                    <p className="text-xs text-stone-500">Real Estate & Interior Solutions</p>
                  </div>
                  <div className="ml-auto text-right">
                    <h3 className="text-lg font-bold text-stone-900">PAYMENT RECEIPT</h3>
                    <p className="text-xs text-stone-400">Payment #{pidx + 1}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                  <div>
                    <p className="text-stone-400 text-xs">Project</p>
                    <p className="font-semibold text-stone-900">{project.title}</p>
                    <p className="text-stone-400 text-xs mt-2">Flat</p>
                    <p className="font-semibold text-stone-900">{project.flat_id || project.project_code || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-stone-400 text-xs">Date</p>
                    <p className="font-semibold text-stone-900">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                    <p className="text-stone-400 text-xs mt-2">Payment Mode</p>
                    <p className="font-semibold text-stone-900 capitalize">{p.payment_mode?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="border-t border-stone-100 pt-4 mb-4">
                  <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Received From</h3>
                  <p className="text-base font-bold text-stone-900">{project.client_id?.full_name || '-'}</p>
                  {project.client_id?.phone && <p className="text-sm text-stone-500">{project.client_id.phone}</p>}
                </div>
                <table className="w-full text-sm mb-6">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 text-stone-400 font-semibold text-xs uppercase">Description</th>
                      <th className="text-right py-2 text-stone-400 font-semibold text-xs uppercase">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-stone-100">
                      <td className="py-3 text-stone-700">Interior Work Payment</td>
                      <td className="py-3 text-right font-semibold text-stone-900">{p.amount?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <td className="py-3 text-sm font-bold text-stone-900">Total Amount</td>
                      <td className="py-3 text-right text-base font-bold text-stone-900">₹{(p.amount || 0).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
                {p.transaction_id && (
                  <div className="text-xs text-stone-400 border-t border-stone-100 pt-4">
                    <p>Transaction ID: {p.transaction_id}</p>
                  </div>
                )}
                <div className="text-center text-xs text-stone-400 mt-6 pt-4 border-t border-stone-100">
                  <p>This is a computer-generated receipt</p>
                  <p>Processed by: {p.received_by?.full_name || 'System'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal isOpen={materialModalOpen} onClose={() => setMaterialModalOpen(false)} title="Add Material" size="sm">
        <form onSubmit={async (e) => {
          e.preventDefault();
          try {
            await API.post(`/interior-projects/${id}/materials`, {
              item_name: materialForm.item_name,
              cost: Number(materialForm.cost),
              vendor: materialForm.from_stock ? undefined : (materialForm.vendor || undefined),
              from_stock: materialForm.from_stock,
              stock_item: materialForm.from_stock ? materialForm.stock_item : undefined,
            });
            toast('Material added');
            setMaterialModalOpen(false);
            fetchProject();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        }} className="space-y-4">
          <div className="flex items-center gap-4 mb-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="materialSource" checked={!materialForm.from_stock} onChange={() => setMaterialForm({ ...materialForm, from_stock: false, stock_item: '', item_name: '', cost: '' })} className="cursor-pointer" />
              <span className="text-sm font-medium text-stone-700">New Purchase</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="materialSource" checked={materialForm.from_stock} onChange={() => setMaterialForm({ ...materialForm, from_stock: true, vendor: '', item_name: '', cost: '' })} className="cursor-pointer" />
              <span className="text-sm font-medium text-stone-700">From Stock</span>
            </label>
          </div>
          {materialForm.from_stock ? (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Select Stock Item *</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={materialForm.stock_item} onChange={(e) => {
                const item = stockItems.find((s) => s._id === e.target.value);
                setMaterialForm({ ...materialForm, stock_item: e.target.value, item_name: item ? item.item_name : '', cost: item ? (item.unit_price || 0) : '' });
              }} required>
                <option value="">Select stock item</option>
                {stockItems.filter((s) => (s.current_quantity || 0) > 0).map((s) => <option key={s._id} value={s._id}>{s.item_name} (Qty: {s.current_quantity}, ₹{s.unit_price || 0})</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Item Name</label><input className={inputClass} value={materialForm.item_name} readOnly /></div>
                <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Cost (₹)</label><input type="number" className={inputClass} value={materialForm.cost} onChange={(e) => setMaterialForm({ ...materialForm, cost: e.target.value })} required /></div>
              </div>
            </div>
          ) : (
            <>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Item Name *</label><input className={inputClass} value={materialForm.item_name} onChange={(e) => setMaterialForm({ ...materialForm, item_name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Cost (₹) *</label><input type="number" min="0" step="0.01" className={inputClass} value={materialForm.cost} onChange={(e) => setMaterialForm({ ...materialForm, cost: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Vendor</label>
                <select className={`${inputClass} appearance-none cursor-pointer`} value={materialForm.vendor} onChange={(e) => setMaterialForm({ ...materialForm, vendor: e.target.value })}>
                  <option value="">Select vendor</option>
                  {vendors.map((v) => <option key={v._id} value={v._id}>{v.name}</option>)}
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setMaterialModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Add</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => { if (confirmAction) confirmAction(); setConfirmOpen(false); }} title="Confirm" message="Are you sure?" />
    </div>
  );
}

