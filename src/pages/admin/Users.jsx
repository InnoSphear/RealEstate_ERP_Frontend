import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const roles = ['admin', 'manager', 'designer', 'sales_agent', 'accountant'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', role: 'sales_agent', branch_id: '', password: '', is_active: true });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([API.get('/users'), API.get('/branches')]);
      setUsers(uRes.data);
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
    setForm({ full_name: '', email: '', phone: '', role: 'sales_agent', branch_id: '', password: '', is_active: true });
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setSelected(user);
    setForm({ full_name: user.full_name, email: user.email, phone: user.phone || '', role: user.role, branch_id: user.branch_id?._id || user.branch_id || '', password: '', is_active: user.is_active });
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
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const columns = [
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
    {
      header: 'Role',
      accessor: 'role',
      render: (row) => {
        const roleStyles = { admin: 'bg-red-100 text-red-800', manager: 'bg-yellow-100 text-yellow-800', designer: 'bg-blue-100 text-blue-800', accountant: 'bg-gray-100 text-gray-800', sales_agent: 'bg-green-100 text-green-800' };
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[row.role] || 'bg-gray-100 text-gray-800'}`}>{row.role?.replace('_', ' ')}</span>;
      },
    },
    {
      header: 'Branch',
      accessor: 'branch_id',
      render: (row) => row.branch_id?.name || '-',
    },
    {
      header: 'Status',
      render: (row) => <span className={row.is_active ? 'bg-green-100 text-green-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' : 'bg-red-100 text-red-800 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'}>{row.is_active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Users</h1>
          <p className="text-text-secondary">Manage system users and their roles</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">+ Add User</button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} onEdit={openEdit} onDelete={(u) => { setSelected(u); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit User' : 'Create User'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Full Name *</label>
              <input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Email *</label>
              <input type="email" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Phone</label>
              <input className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Role *</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                {roles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Branch *</label>
              <select className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Password {selected && '(leave blank to keep)'} *</label>
              <input type="password" className="w-full px-3 py-2 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!selected} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-border text-primary focus:ring-primary" />
            <span className="text-sm text-text">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-transparent text-text-secondary hover:bg-border border border-border">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-primary text-white hover:bg-primary-dark">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." />
    </div>
  );
}
