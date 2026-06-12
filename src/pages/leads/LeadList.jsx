import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';

const statusColors = {
  new: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  contacted: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  hot: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  warm: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cold: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  follow_up: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  site_visit: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  negotiation: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  won: 'bg-green-50 text-green-700 ring-1 ring-green-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  lost: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const sourceColors = {
  referral: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  website: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  social_media: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  walk_in: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  call: 'bg-lime-50 text-lime-700 ring-1 ring-lime-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  ad: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const statuses = ['new', 'contacted', 'hot', 'warm', 'cold', 'follow_up', 'site_visit', 'negotiation', 'won', 'lost'];
const sources = ['referral', 'website', 'social_media', 'walk_in', 'call', 'ad'];
const propertyTypes = ['apartment', 'villa', 'plot', 'commercial', 'office', 'warehouse'];

function getScoreColor(score) {
  if (!score && score !== 0) return '';
  if (score <= 30) return 'bg-red-500';
  if (score <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getScoreTextColor(score) {
  if (!score && score !== 0) return 'text-stone-500';
  if (score <= 30) return 'text-red-600';
  if (score <= 60) return 'text-yellow-600';
  return 'text-green-600';
}

export default function LeadList() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin', 'manager');
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [transferTo, setTransferTo] = useState('');

  const [filters, setFilters] = useState({ status: '', source: '', assigned_to: '', date_from: '', date_to: '', search: '' });

  const initForm = {
    full_name: '', email: '', mobile: '', alternate_mobile: '', address: '', city: '', state: '', pincode: '',
    requirement: '', budget: '', property_type: 'apartment', preferred_locations: [], source: 'referral', notes: '',
  };
  const [form, setForm] = useState(initForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    API.get(`/leads${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load leads', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filters]);

  useEffect(() => {
    API.get('/users').then((res) => setUsers(res.data)).catch(() => {});
  }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(initForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      full_name: row.full_name || '',
      email: row.email || '',
      mobile: row.mobile || '',
      alternate_mobile: row.alternate_mobile || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      pincode: row.pincode || '',
      requirement: row.requirement || '',
      budget: row.budget || '',
      property_type: row.property_type || 'apartment',
      preferred_locations: row.preferred_locations || [],
      source: row.source || 'referral',
      notes: row.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) {
        await API.put(`/leads/${selected._id}`, form);
        toast('Lead updated');
      } else {
        await API.post('/leads', form);
        toast('Lead created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/leads/${selected._id}`);
      toast('Lead deleted');
      fetchData();
    } catch (err) {
      toast('Error deleting', 'error');
    }
  };

  const handleTransfer = async () => {
    if (!transferTo) { toast('Select a user', 'warning'); return; }
    try {
      await API.put(`/leads/${selected._id}/transfer`, { assigned_to: transferTo });
      toast('Lead transferred to sales');
      setTransferModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Transfer failed', 'error');
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await API.post('/leads/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Leads imported successfully');
      setImportModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Import failed', 'error');
    }
    e.target.value = '';
  };

  const openTransfer = (row) => {
    setSelected(row);
    setTransferTo('');
    setTransferModalOpen(true);
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    window.open(`/api/leads/export?${params.toString()}`, '_blank');
  };

  const handleLocationToggle = (loc) => {
    const cur = form.preferred_locations || [];
    setForm({
      ...form,
      preferred_locations: cur.includes(loc) ? cur.filter((l) => l !== loc) : [...cur, loc],
    });
  };

  const columns = [
    { header: 'ID', accessor: 'lead_id' },
    { header: 'Name', accessor: 'full_name' },
    { header: 'Mobile', accessor: 'mobile' },
    {
      header: 'Source',
      render: (r) => <span className={sourceColors[r.source] || sourceColors.referral}>{r.source?.replace(/_/g, ' ')}</span>,
    },
    {
      header: 'Status',
      render: (r) => <span className={statusColors[r.status] || statusColors.new}>{r.status?.replace(/_/g, ' ')}</span>,
    },
    {
      header: 'Score',
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 bg-stone-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${getScoreColor(r.lead_score)}`} style={{ width: `${Math.min(r.lead_score || 0, 100)}%` }} />
          </div>
          <span className={`text-xs font-semibold ${getScoreTextColor(r.lead_score)}`}>{r.lead_score || 0}</span>
        </div>
      ),
    },
    { header: 'Assigned To', render: (r) => r.assigned_to?.name || r.assigned_to?.full_name || '-' },
    { header: 'Next Follow Up', render: (r) => r.next_follow_up ? new Date(r.next_follow_up).toLocaleDateString() : '-' },
    { header: 'Created', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Leads</h1>
          <p className="text-stone-500 mt-1">Manage your leads and prospects</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
            <HiOutlineArrowDownTray size={15} /> Export
          </button>
          <button onClick={() => setImportModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
            Bulk Import
          </button>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
            + Add Lead
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Assignees</option>
          {users.map((u) => <option key={u._id} value={u._id}>{u.name || u.full_name}</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="From" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="To" />
        <input
          type="text"
          placeholder="Search by name, email or mobile..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors w-64"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onView={(r) => navigate(`/leads/${r._id}`)}
        onEdit={isAdmin ? openEdit : null}
        onDelete={isAdmin ? (r) => { setSelected(r); setConfirmOpen(true); } : null}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Lead' : 'Create Lead'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label>
              <input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Alternate Mobile</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.alternate_mobile} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">City</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">State</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Pincode</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Budget</label>
              <input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })}>
                {propertyTypes.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {sources.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Preferred Locations</label>
            <div className="flex flex-wrap gap-2">
              {['Downtown', 'Suburbs', 'Airport Area', 'City Center', 'East Side', 'West Side'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => handleLocationToggle(loc)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${(form.preferred_locations || []).includes(loc) ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  {loc}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-between items-center pt-2">
            <div>
              {selected && isAdmin && (
                <button type="button" onClick={() => openTransfer(selected)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200">
                  Transfer to Sales
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
              <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transfer to Sales" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Assign this lead to a sales person</p>
          <select value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
            <option value="">Select user</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name || u.full_name}</option>)}
          </select>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setTransferModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleTransfer} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Transfer</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} title="Import Leads from Excel" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Upload an Excel file (.xlsx, .xls) with lead data</p>
          <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 file:cursor-pointer cursor-pointer" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setImportModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Lead" message="Are you sure you want to delete this lead?" />
    </div>
  );
}
