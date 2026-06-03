import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiPlus } from 'react-icons/hi2';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: '', branch_id: '', password: '', is_active: true });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, bRes] = await Promise.all([
        API.get('/users'),
        API.get('/roles'),
        API.get('/branches'),
      ]);
      setUsers(uRes.data);
      setRoles(rRes.data);
      setBranches(bRes.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm({ full_name: '', email: '', phone: '', role: '', branch_id: '', password: '', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setSelected(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      role: user.role_slug || user.role || '',
      branch_id: user.branch_id?._id || user.branch_id || '',
      password: '',
      is_active: user.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      if (selected) {
        await API.put(`/users/${selected._id}`, payload);
        toast('User updated');
      } else {
        await API.post('/users', payload);
        toast('User created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error saving user', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/users/${selected._id}`);
      toast('User deleted');
      setConfirmOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await API.put(`/users/${user._id}`, { is_active: !user.is_active });
      toast(`User ${user.is_active ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error toggling status', 'error');
    }
  };

  const roleStyles = {
    admin: 'bg-stone-100 text-stone-800 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:ring-stone-700',
    manager: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:ring-amber-800',
    designer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800',
    accountant: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700',
    sales_agent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800',
  };

  const columns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Role',
      render: (row) => {
        const slug = row.role_slug || row.role;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[slug] || 'bg-stone-50 text-stone-600 ring-1 ring-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:ring-stone-700'}`}>
            {slug?.replace(/_/g, ' ')}
          </span>
        );
      },
    },
    {
      header: 'Branch',
      render: (row) => row.branch_id?.name || '-',
    },
    {
      header: 'Status',
      render: (row) => (
        <button
          onClick={() => handleToggleActive(row)}
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer border-0 transition-colors ${
            row.is_active
              ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800 dark:hover:bg-emerald-900/40'
              : 'bg-red-50 text-red-700 ring-1 ring-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800 dark:hover:bg-red-900/40'
          }`}
          title={row.is_active ? 'Click to deactivate' : 'Click to activate'}
        >
          {row.is_active ? 'Active' : 'Inactive'}
        </button>
      ),
    },
    {
      header: 'Last Login',
      render: (row) => {
        if (!row.last_login) return <span className="text-sm text-stone-400">Never</span>;
        return <span className="text-sm text-stone-500 dark:text-stone-400">{new Date(row.last_login).toLocaleDateString()}</span>;
      },
    },
    {
      header: 'Created',
      render: (row) => {
        if (!row.created_at) return <span className="text-sm text-stone-400">—</span>;
        return <span className="text-sm text-stone-500 dark:text-stone-400">{new Date(row.created_at).toLocaleDateString()}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-stone-100">Users</h1>
          <p className="text-stone-500 mt-1 dark:text-stone-400">Manage system users and their roles</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">
          <HiPlus className="w-4 h-4" /> Add User
        </button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} onEdit={openEdit} onDelete={(u) => { setSelected(u); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit User' : 'Create User'} size="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Full Name *</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Role *</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400">
                <option value="">Select role</option>
                {roles.map((r) => <option key={r._id || r.slug} value={r.slug || r.name}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Branch *</label>
              <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400">
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Password {selected && '(leave blank to keep)'}{!selected && '*'}</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!selected}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 dark:border-stone-600 dark:text-stone-300 dark:focus:ring-stone-400/20" />
            <span className="text-sm text-stone-700 font-medium dark:text-stone-300">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700 dark:hover:bg-stone-700">Cancel</button>
            <button type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." />
    </div>
  );
}
