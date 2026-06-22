import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  inactive: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  blocked: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const sources = ['referral', 'website', 'social_media', 'walk_in', 'call', 'ad'];
const requirementTypes = ['buy', 'rent', 'lease', 'interior', 'sell'];
const statuses = ['active', 'inactive', 'blocked'];

export default function ClientList() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin', 'manager');
  const [data, setData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState({ status: '', source: '', assigned_to: '', requirement_type: '', date_from: '', date_to: '' });

  const initForm = {
    full_name: '', email: '', mobile: '', alternate_mobile: '', address: '', city: '', state: '', pincode: '',
    requirement_type: 'buy', budget_min: '', budget_max: '', requirement: '', preferred_locations: [],
    source: 'referral', notes: '', status: 'active', assigned_to: '',
    transaction_type: '', property: '',
  };
  const [form, setForm] = useState(initForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
    const qs = params.toString();
    API.get(`/clients${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load clients', 'error')).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filters]);

  useEffect(() => {
    API.get('/employees').then((res) => setEmployees(res.data)).catch(() => {});
    API.get('/properties').then((res) => setProperties(res.data)).catch(() => {});
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
      requirement_type: row.requirement_type || 'buy',
      budget_min: row.budget_min || '',
      budget_max: row.budget_max || '',
      requirement: row.requirement || '',
      preferred_locations: row.preferred_locations || [],
      source: row.source || 'referral',
      notes: row.notes || '',
      status: row.status || 'active',
      assigned_to: row.assigned_to?._id || row.assigned_to || '',
      transaction_type: row.transaction_type || '',
      property: row.property?._id || row.property || '',
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        property: form.property || undefined,
        assigned_to: form.assigned_to || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      };
      if (selected) {
        await API.put(`/clients/${selected._id}`, payload);
        toast('Client updated');
      } else {
        await API.post('/clients', payload);
        toast('Client created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/clients/${selected._id}`);
      toast('Client deleted');
      fetchData();
    } catch (err) {
      toast('Error deleting', 'error');
    }
  };

  const handleLocationToggle = (loc) => {
    const cur = form.preferred_locations || [];
    setForm({
      ...form,
      preferred_locations: cur.includes(loc) ? cur.filter((l) => l !== loc) : [...cur, loc],
    });
  };

  const columns = [
    { header: 'ID', accessor: 'client_id' },
    { header: 'Name', accessor: 'full_name' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'Email', accessor: 'email' },
    { header: 'Requirement', render: (r) => <span className="capitalize text-sm">{r.requirement_type?.replace(/_/g, ' ') || '-'}</span> },
    { header: 'Client Type', render: (r) => r.transaction_type ? <span className="capitalize text-sm">{r.transaction_type}</span> : '-' },
    { header: 'Budget Range', render: (r) => (r.budget_min || r.budget_max) ? `₹${(r.budget_min || 0).toLocaleString()} - ₹${(r.budget_max || 0).toLocaleString()}` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status] || statusColors.active}>{r.status}</span> },
    { header: 'Assigned To', render: (r) => r.assigned_to?.full_name || '-' },
    { header: 'Converted', render: (r) => r.converted ? <span className="text-emerald-600 font-semibold">Yes</span> : 'No' },
    { header: 'Created', render: (r) => r.created_at ? new Date(r.created_at).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Clients</h1>
          <p className="text-stone-500 mt-1">Manage your clients</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          + Add Client
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filters.source} onChange={(e) => setFilters({ ...filters, source: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Sources</option>
          {sources.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={filters.assigned_to} onChange={(e) => setFilters({ ...filters, assigned_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Assignees</option>
          {employees.map((e) => <option key={e._id} value={e._id}>{e.full_name} ({e.employee_id})</option>)}
        </select>
        <input type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="From" />
        <input type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" placeholder="To" />
        <select value={filters.requirement_type} onChange={(e) => setFilters({ ...filters, requirement_type: e.target.value })} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Requirements</option>
          {requirementTypes.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onView={(r) => navigate(`/clients/${r._id}`)}
        onEdit={openEdit}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Client' : 'Create Client'} size="xl">
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
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.requirement_type} onChange={(e) => setForm({ ...form, requirement_type: e.target.value })}>
                {requirementTypes.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Client Type</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
                <option value="">Select Type</option>
                <option value="rent">Rent</option>
                <option value="purchase">Purchase</option>
                <option value="sell">Sell</option>
                <option value="interior">Interior</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Property</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
                <option value="">Select Property</option>
                {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id} - {p.location || p.name || p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Min Budget</label>
              <input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Max Budget</label>
              <input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Source</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                {sources.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Assigned To</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
                <option value="">Unassigned</option>
                {employees.map((e) => <option key={e._id} value={e._id}>{e.full_name} ({e.employee_id})</option>)}
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
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Client" message="Are you sure you want to delete this client?" />
    </div>
  );
}
