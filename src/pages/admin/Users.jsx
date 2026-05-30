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
      render: (row) => {
        const roleStyles = { admin: 'bg-stone-100 text-stone-800 ring-1 ring-stone-200', manager: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', designer: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', accountant: 'bg-stone-50 text-stone-600 ring-1 ring-stone-200', sales_agent: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };
        return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleStyles[row.role] || 'bg-stone-50 text-stone-600 ring-1 ring-stone-200'}`}>{row.role?.replace(/_/g, ' ')}</span>;
      },
    },
    {
      header: 'Branch',
      render: (row) => row.branch_id?.name || '-',
    },
    {
      header: 'Status',
      render: (row) => <span className={row.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium' : 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'}>{row.is_active ? 'Active' : 'Inactive'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Users</h1>
          <p className="text-stone-500 mt-1">Manage system users and their roles</p>
        </div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add User</button>
      </div>

      <DataTable columns={columns} data={users} loading={loading} onEdit={openEdit} onDelete={(u) => { setSelected(u); setConfirmOpen(true); }} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit User' : 'Create User'} size="md">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Email *</label>
              <input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Phone</label>
              <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Role *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Branch *</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} required>
                <option value="">Select branch</option>
                {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Password {selected && '(leave blank to keep)'} *</label>
              <input type="password" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!selected} />
            </div>
          </div>
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20" />
            <span className="text-sm text-stone-700 font-medium">Active</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." />
    </div>
  );
}
