import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi2';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissionsByModule, setPermissionsByModule] = useState({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', permissions: {}, is_active: true });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([
        API.get('/roles'),
        API.get('/permissions/by-module'),
      ]);
      setRoles(rRes.data);
      setPermissionsByModule(pRes.data);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to load roles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const buildPermissionMap = () => {
    const map = {};
    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      map[module] = {};
      perms.forEach((p) => { map[module][p.action] = false; });
    });
    return map;
  };

  const generateSlug = (name) => name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

  const openCreate = () => {
    setSelected(null);
    setForm({ name: '', slug: '', description: '', permissions: buildPermissionMap(), is_active: true });
    setModalOpen(true);
  };

  const openEdit = (role) => {
    setSelected(role);
    const permMap = buildPermissionMap();
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach((p) => {
        if (permMap[p.module] && p.action in permMap[p.module]) {
          permMap[p.module][p.action] = true;
        }
      });
    }
    setForm({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permissions: permMap,
      is_active: role.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (selected) {
        await API.put(`/roles/${selected._id}`, payload);
        toast('Role updated');
      } else {
        await API.post('/roles', payload);
        toast('Role created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error saving role', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/roles/${selected._id}`);
      toast('Role deleted');
      setConfirmOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error deleting role', 'error');
    }
  };

  const updatePermission = (module, action, value) => {
    setForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [module]: { ...prev.permissions[module], [action]: value },
      },
    }));
  };

  const toggleAll = (module, value) => {
    setForm((prev) => {
      const updated = { ...prev.permissions[module] };
      Object.keys(updated).forEach((action) => { updated[action] = value; });
      return { ...prev, permissions: { ...prev.permissions, [module]: updated } };
    });
  };

  const selectAll = () => {
    const all = {};
    Object.entries(permissionsByModule).forEach(([module, perms]) => {
      all[module] = {};
      perms.forEach((p) => { all[module][p.action] = true; });
    });
    setForm((prev) => ({ ...prev, permissions: all }));
  };

  const deselectAll = () => {
    setForm((prev) => ({ ...prev, permissions: buildPermissionMap() }));
  };

  const countPermissions = (perms) => {
    if (!perms) return 0;
    if (Array.isArray(perms)) return perms.length;
    return Object.values(perms).reduce((sum, mod) => sum + Object.values(mod).filter(Boolean).length, 0);
  };

  const moduleKeys = Object.keys(permissionsByModule).sort();

  const columns = [
    { header: 'Name', accessor: 'name' },
    { header: 'Slug', accessor: 'slug' },
    { header: 'Description', accessor: 'description' },
    {
      header: 'Permissions',
      render: (row) => <span className="text-sm text-stone-600 dark:text-stone-400">{countPermissions(row.permissions)}</span>,
    },
    {
      header: 'Users',
      render: (row) => <span className="text-sm font-medium text-stone-700 dark:text-stone-300">{row.user_count || 0}</span>,
    },
    {
      header: 'System',
      render: (row) => row.is_system
        ? <span className="bg-stone-100 text-stone-600 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-stone-800 dark:text-stone-400 dark:ring-stone-700">System</span>
        : <span className="text-stone-400 dark:text-stone-500">—</span>,
    },
    {
      header: 'Status',
      render: (row) => (
        <span className={
          row.is_active
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800'
            : 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800'
        }>{row.is_active ? 'Active' : 'Inactive'}</span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 dark:hover:text-stone-300 transition-colors cursor-pointer border-0" title="Edit">
            <HiPencil className="w-4 h-4" />
          </button>
          {!row.is_system && (
            <button onClick={() => { setSelected(row); setConfirmOpen(true); }}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer border-0" title="Delete">
              <HiTrash className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const allActions = [...new Set(
    Object.values(permissionsByModule).flatMap((perms) => perms.map((p) => p.action))
  )];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-stone-100">Roles</h1>
          <p className="text-stone-500 mt-1 dark:text-stone-400">Manage user roles and granular permissions</p>
        </div>
        <button onClick={openCreate}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600 dark:shadow-none">
          <HiPlus className="w-4 h-4" /> Add Role
        </button>
      </div>

      <DataTable columns={columns} data={roles} loading={loading} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Role' : 'Create Role'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Name *</label>
              <input value={form.name} onChange={(e) => {
                const name = e.target.value;
                setForm({ ...form, name, slug: selected ? form.slug : generateSlug(name) });
              }} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} required
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-stone-700 mb-1.5 dark:text-stone-300">Description</label>
              <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:bg-stone-800 dark:border-stone-700 dark:text-stone-200 dark:focus:ring-stone-400/20 dark:focus:border-stone-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-stone-700 dark:text-stone-300">Permissions</h3>
              <div className="flex gap-2">
                <button type="button" onClick={selectAll}
                  className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 border-0 cursor-pointer">Select All</button>
                <button type="button" onClick={deselectAll}
                  className="text-xs px-3 py-1 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700 border-0 cursor-pointer">Deselect All</button>
              </div>
            </div>
            <div className="border border-stone-200 rounded-xl overflow-hidden dark:border-stone-700 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-12 gap-0 bg-stone-50 px-4 py-2.5 border-b border-stone-200 text-xs font-semibold text-stone-500 sticky top-0 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-400">
                <div className="col-span-3">Module</div>
                <div className={`col-span-9 grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.max(allActions.length, 1)}, minmax(64px, 1fr))` }}>
                  {allActions.map((action) => (
                    <span key={action} className="text-center capitalize">{action}</span>
                  ))}
                </div>
              </div>
              {moduleKeys.map((module) => {
                const perm = form.permissions[module] || {};
                return (
                  <div key={module} className="grid grid-cols-12 gap-0 px-4 py-2.5 border-b border-stone-100 last:border-0 items-center hover:bg-stone-50/50 dark:border-stone-800 dark:hover:bg-stone-800/30">
                    <div className="col-span-3 text-sm font-medium text-stone-700 capitalize flex items-center gap-2 dark:text-stone-300">
                      {module.replace(/_/g, ' ')}
                      <button type="button" onClick={() => toggleAll(module, true)}
                        className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border-0 bg-transparent cursor-pointer">all</button>
                      <button type="button" onClick={() => toggleAll(module, false)}
                        className="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 border-0 bg-transparent cursor-pointer">none</button>
                    </div>
                    <div className={`col-span-9 grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.max(allActions.length, 1)}, minmax(64px, 1fr))` }}>
                      {allActions.map((action) => (
                        <label key={action} className="flex items-center justify-center cursor-pointer">
                          <input type="checkbox" checked={!!perm[action]}
                            onChange={(e) => updatePermission(module, action, e.target.checked)}
                            className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900/20 dark:border-stone-600 dark:text-stone-300 dark:focus:ring-stone-400/20" />
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
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

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Role" message="Are you sure you want to delete this role? Users assigned to this role may lose their permissions." />
    </div>
  );
}
