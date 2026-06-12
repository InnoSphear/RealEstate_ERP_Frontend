import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';
import { HiArrowPath, HiPlus, HiTrash } from 'react-icons/hi2';
import Modal from '../../components/Modal';

const MODULE_LABELS = {
  leads: 'Leads', clients: 'Clients', properties: 'Properties', projects: 'Projects',
  invoices: 'Invoices', payments: 'Payments', expenses: 'Expenses', income: 'Income',
  commissions: 'Commissions', employees: 'Employees', attendance: 'Attendance',
  leaves: 'Leaves', site_visits: 'Site Visits', follow_ups: 'Follow Ups',
  visitors: 'Visitors', reports: 'Reports', users: 'Users', roles: 'Roles',
  settings: 'Settings', dashboard: 'Dashboard', activity_logs: 'Activity Logs',
  notifications: 'Notifications', property_keys: 'Property Keys', tenants: 'Tenants',
  branches: 'Branches',
};

export default function Permissions() {
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ module: '', action: '', description: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await API.get('/permissions/by-module');
      setGrouped(res.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to load permissions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSeed = async () => {
    if (!confirm('This will create all default permissions if they do not exist. Continue?')) return;
    setSeeding(true);
    try {
      await API.post('/permissions/seed');
      toast('Default permissions seeded');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error seeding permissions', 'error');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post('/permissions', form);
      toast('Permission created');
      setModalOpen(false);
      setForm({ module: '', action: '', description: '' });
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error creating permission', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this permission? This may affect roles using it.')) return;
    try {
      await API.delete(`/permissions/${id}`);
      toast('Permission deleted');
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error deleting permission', 'error');
    }
  };

  const moduleKeys = Object.keys(grouped).sort();
  const totalPermissions = moduleKeys.reduce((sum, m) => sum + grouped[m].length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-stone-100">Permissions</h1>
          <p className="text-stone-500 mt-1 dark:text-stone-400">{totalPermissions} total permissions across {moduleKeys.length} modules</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">
            <HiPlus className="w-4 h-4" /> Add Permission
          </button>
          <button onClick={handleSeed} disabled={seeding}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700">
            <HiArrowPath className={`w-4 h-4 ${seeding ? 'animate-spin' : ''}`} /> Seed Defaults
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {moduleKeys.map((module) => {
          const perms = grouped[module];
          const label = MODULE_LABELS[module] || module.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return (
            <div key={module} className="bg-white rounded-xl border border-stone-200 overflow-hidden dark:bg-stone-900 dark:border-stone-700">
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between dark:bg-stone-800 dark:border-stone-700">
                <h3 className="text-sm font-semibold text-stone-800 capitalize dark:text-stone-200">{label}</h3>
                <span className="text-xs text-stone-400 font-medium">{perms.length}</span>
              </div>
              <div className="p-1">
                {perms.map((perm) => (
                  <div key={perm._id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-stone-50 group dark:hover:bg-stone-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md dark:bg-stone-800 dark:text-stone-400">{perm.action}</span>
                      {perm.description && (
                        <span className="text-xs text-stone-400 dark:text-stone-500 truncate max-w-[120px]">{perm.description}</span>
                      )}
                    </div>
                    <button onClick={() => handleDelete(perm._id)}
                      className="p-1 rounded-md text-stone-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all dark:hover:bg-red-900/20 border-0 cursor-pointer">
                      <HiTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {perms.length === 0 && (
                  <p className="text-xs text-stone-400 text-center py-4 dark:text-stone-500">No permissions</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Permission" size="sm">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Module *</label>
            <input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} required placeholder="e.g. leads, clients"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Action *</label>
            <input value={form.action} onChange={(e) => setForm({ ...form, action: e.target.value })} required placeholder="e.g. create, read, update, delete"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description"
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">Create</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
