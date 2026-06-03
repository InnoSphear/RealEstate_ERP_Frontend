import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { HiArrowLeft, HiPencil, HiBuildingOffice2, HiEnvelope, HiPhone, HiCalendarDays, HiUsers, HiHomeModern } from 'react-icons/hi2';

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({});

  const fetchTenant = async () => {
    setLoading(true);
    try {
      const res = await API.get(`/tenants/${id}`);
      setTenant(res.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to load tenant', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenant(); }, [id]);

  const openEdit = () => {
    setForm({
      company_name: tenant.company_name,
      company_email: tenant.company_email || '',
      company_phone: tenant.company_phone || '',
      company_address: tenant.company_address || '',
      subscription_plan: tenant.subscription_plan || 'basic',
      subscription_status: tenant.subscription_status || 'inactive',
      subscription_start_date: tenant.subscription_start_date?.split('T')[0] || '',
      subscription_end_date: tenant.subscription_end_date?.split('T')[0] || '',
      max_users: tenant.max_users || 10,
      max_properties: tenant.max_properties || 50,
      is_active: tenant.is_active,
    });
    setEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/tenants/${id}`, form);
      toast('Tenant updated');
      setEditModalOpen(false);
      fetchTenant();
    } catch (err) {
      toast(err.response?.data?.message || 'Error updating tenant', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 dark:border-stone-300"></div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500 dark:text-stone-400">Tenant not found</p>
        <button onClick={() => navigate('/admin/tenants')}
          className="mt-4 text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer border-0 bg-transparent">Back to Tenants</button>
      </div>
    );
  }

  const usagePercent = (current, max) => max > 0 ? Math.min(Math.round((current / max) * 100), 100) : 0;
  const userPercent = usagePercent(tenant.user_count || 0, tenant.max_users || 1);
  const propPercent = usagePercent(tenant.property_count || 0, tenant.max_properties || 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/tenants')}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors cursor-pointer border-0">
            <HiArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-stone-100">{tenant.company_name}</h1>
            <p className="text-stone-500 mt-1 dark:text-stone-400">Tenant details and management</p>
          </div>
        </div>
        <button onClick={openEdit}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">
          <HiPencil className="w-4 h-4" /> Edit
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 dark:bg-stone-900 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 dark:text-stone-100">Company Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoItem icon={<HiBuildingOffice2 className="w-5 h-5" />} label="Company Name" value={tenant.company_name} />
            <InfoItem icon={<HiEnvelope className="w-5 h-5" />} label="Email" value={tenant.company_email || '-'} />
            <InfoItem icon={<HiPhone className="w-5 h-5" />} label="Phone" value={tenant.company_phone || '-'} />
            <InfoItem icon={<HiCalendarDays className="w-5 h-5" />} label="Created" value={new Date(tenant.created_at).toLocaleDateString()} />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Address</label>
            <p className="text-sm text-stone-700 dark:text-stone-300">{tenant.company_address || 'No address provided'}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 dark:bg-stone-900 dark:border-stone-800">
          <h2 className="text-lg font-semibold text-stone-900 mb-4 dark:text-stone-100">Status</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Account Status</label>
              <span className={
                tenant.is_active
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800'
                  : 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800'
              }>{tenant.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Subscription Plan</label>
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 capitalize">{tenant.subscription_plan || 'Basic'}</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Subscription Status</label>
              <span className={
                tenant.subscription_status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800'
              }>{tenant.subscription_status || 'Inactive'}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1 dark:text-stone-400">Subscription Period</label>
              <p className="text-sm text-stone-700 dark:text-stone-300">
                {tenant.subscription_start_date
                  ? `${new Date(tenant.subscription_start_date).toLocaleDateString()} — ${tenant.subscription_end_date ? new Date(tenant.subscription_end_date).toLocaleDateString() : 'Ongoing'}`
                  : 'Not set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 dark:bg-stone-900 dark:border-stone-800">
        <h2 className="text-lg font-semibold text-stone-900 mb-6 dark:text-stone-100">Usage Statistics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <UsageBar icon={<HiUsers className="w-4 h-4" />} label="Users" current={tenant.user_count || 0} max={tenant.max_users || 1} percent={userPercent} color="bg-blue-500" />
          <UsageBar icon={<HiHomeModern className="w-4 h-4" />} label="Properties" current={tenant.property_count || 0} max={tenant.max_properties || 1} percent={propPercent} color="bg-emerald-500" />
        </div>
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Tenant" size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Company Name *</label>
              <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Email *</label>
              <input type="email" value={form.company_email} onChange={(e) => setForm({ ...form, company_email: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Phone</label>
              <input value={form.company_phone} onChange={(e) => setForm({ ...form, company_phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Address</label>
              <textarea rows={2} value={form.company_address} onChange={(e) => setForm({ ...form, company_address: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Subscription Plan *</label>
              <select value={form.subscription_plan} onChange={(e) => setForm({ ...form, subscription_plan: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400">
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Subscription Status</label>
              <select value={form.subscription_status} onChange={(e) => setForm({ ...form, subscription_status: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Start Date</label>
              <input type="date" value={form.subscription_start_date} onChange={(e) => setForm({ ...form, subscription_start_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">End Date</label>
              <input type="date" value={form.subscription_end_date} onChange={(e) => setForm({ ...form, subscription_end_date: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Max Users</label>
              <input type="number" min={1} value={form.max_users} onChange={(e) => setForm({ ...form, max_users: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Max Properties</label>
              <input type="number" min={1} value={form.max_properties} onChange={(e) => setForm({ ...form, max_properties: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 dark:border-stone-600 dark:text-stone-300 dark:focus:ring-stone-400/20" />
            <span className="text-sm text-stone-700 font-medium dark:text-stone-300">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 mt-0.5 text-stone-400 dark:text-stone-500">{icon}</div>
      <div>
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">{label}</p>
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{value}</p>
      </div>
    </div>
  );
}

function UsageBar({ icon, label, current, max, percent, color }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-stone-400 dark:text-stone-500">{icon}</span>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">{label}</p>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">{current} / {max}</p>
      </div>
      <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden dark:bg-stone-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-xs text-stone-400 mt-1 dark:text-stone-500">{percent}% used</p>
    </div>
  );
}
