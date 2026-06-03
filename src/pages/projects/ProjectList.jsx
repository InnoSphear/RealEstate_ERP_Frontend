import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiOutlineSquares2X2, HiOutlineTableCells, HiOutlineMapPin, HiOutlineBuildingOffice2, HiOutlineCalendarDays } from 'react-icons/hi2';

const statusOptions = ['planning', 'ongoing', 'completed', 'on_hold', 'cancelled'];

const statusBadge = (v) => {
  const map = { planning: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', ongoing: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', completed: 'bg-green-50 text-green-700 ring-1 ring-green-200', on_hold: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200', cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'}`}>{v?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
};

const emptyForm = () => ({
  project_name: '', builder_name: '', builder_contact: '', builder_email: '',
  location: '', city: '', state: '', launch_date: '', completion_date: '',
  total_units: '', available_units: '', amenities: '', description: '', status: 'planning',
});

export default function ProjectList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState({ status: '', city: '', builder_name: '' });

  const queryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    const qs = params.toString();
    return qs ? `/projects?${qs}` : '/projects';
  };

  const fetchData = async () => {
    setLoading(true);
    try { const { data: d } = await API.get(queryString()); setData(Array.isArray(d) ? d : d.projects || []); }
    catch (err) { toast('Failed to load projects', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filters]);

  const openCreate = () => { setSelected(null); setForm(emptyForm()); setImages([]); setModalOpen(true); };
  const openEdit = (row) => {
    setSelected(row);
    setForm({
      project_name: row.project_name || '', builder_name: row.builder_name || '', builder_contact: row.builder_contact || '', builder_email: row.builder_email || '',
      location: row.location || '', city: row.city || '', state: row.state || '', launch_date: row.launch_date ? row.launch_date.split('T')[0] : '', completion_date: row.completion_date ? row.completion_date.split('T')[0] : '',
      total_units: row.total_units || '', available_units: row.available_units || '', amenities: Array.isArray(row.amenities) ? row.amenities.join(', ') : (row.amenities || ''), description: row.description || '', status: row.status || 'planning',
    });
    setImages([]);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      images.forEach((img) => fd.append('images', img));
      if (selected) { await API.put(`/projects/${selected._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast('Project updated'); }
      else { await API.post('/projects', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast('Project created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error saving project', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/projects/${selected._id}`); toast('Project deleted'); fetchData(); }
    catch (err) { toast('Error deleting project', 'error'); }
  };

  const navigateTo = (id) => { window.location.href = `/projects/${id}`; };

  const columns = [
    { header: 'Project Name', accessor: 'project_name' },
    { header: 'Builder', accessor: 'builder_name' },
    { header: 'Location', render: (r) => [r.location, r.city].filter(Boolean).join(', ') || '-' },
    { header: 'Status', render: (r) => statusBadge(r.status) },
    { header: 'Total Units', render: (r) => r.total_units || '-' },
    { header: 'Available', render: (r) => r.available_units ?? '-' },
    { header: 'Completion', render: (r) => r.completion_date ? new Date(r.completion_date).toLocaleDateString() : '-' },
  ];

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-white">Projects</h1><p className="text-stone-500 mt-1 dark:text-stone-400">Manage all real estate projects</p></div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2.5 transition-all ${viewMode === 'table' ? 'bg-stone-900 text-white dark:bg-stone-600' : 'text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-200'}`}><HiOutlineTableCells size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-stone-900 text-white dark:bg-stone-600' : 'text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-200'}`}><HiOutlineSquares2X2 size={18} /></button>
          </div>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">+ Add Project</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white">
          <option value="">All Status</option>
          {statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
        <input type="text" placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors w-32 dark:text-white dark:placeholder-stone-400" />
        <input type="text" placeholder="Builder" value={filters.builder_name} onChange={(e) => setFilters({ ...filters, builder_name: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors w-32 dark:text-white dark:placeholder-stone-400" />
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
          onView={(r) => navigateTo(r._id)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent dark:border-white" /></div>
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-20 text-stone-400 dark:text-stone-500">No projects found</div>
          ) : data.map((p) => (
            <div key={p._id} onClick={() => navigateTo(p._id)} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 luxury-shadow overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
              <div className="relative h-48 bg-stone-100 dark:bg-stone-700 overflow-hidden">
                {p.images?.length ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-300 dark:text-stone-500"><HiOutlineBuildingOffice2 size={40} /></div>
                )}
                <div className="absolute top-3 right-3">{statusBadge(p.status)}</div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1 truncate">{p.project_name || 'Project'}</h3>
                <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-2">
                  <HiOutlineMapPin size={14} />
                  <span className="truncate">{p.location || p.city || '-'}</span>
                </div>
                {p.builder_name && <p className="text-xs text-stone-400 dark:text-stone-500 mb-2">{p.builder_name}</p>}
                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400 pt-2 border-t border-stone-100 dark:border-stone-700">
                  <span>{p.total_units || 0} units</span>
                  <span>{p.available_units ?? 0} available</span>
                  {p.completion_date && (
                    <span className="ml-auto flex items-center gap-1"><HiOutlineCalendarDays size={13} />{new Date(p.completion_date).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Project' : 'Create Project'} size="xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Project Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Project Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Builder Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.builder_name} onChange={(e) => setForm({ ...form, builder_name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Builder Contact</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.builder_contact} onChange={(e) => setForm({ ...form, builder_contact: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Builder Email</label><input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.builder_email} onChange={(e) => setForm({ ...form, builder_email: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Location & Dates</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Location *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">City *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">State</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Launch Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white" value={form.launch_date} onChange={(e) => setForm({ ...form, launch_date: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Completion Date</label><input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white" value={form.completion_date} onChange={(e) => setForm({ ...form, completion_date: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Units & Status</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Total Units *</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.total_units} onChange={(e) => setForm({ ...form, total_units: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Available Units</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.available_units} onChange={(e) => setForm({ ...form, available_units: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Status *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>{statusOptions.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select></div>
            </div>
          </div>

          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Amenities</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={2} placeholder="Comma separated: pool, gym, clubhouse..." value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>

          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Description</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>

          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setImages([...e.target.files])} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-stone-100 dark:file:bg-stone-700 file:text-sm file:font-semibold text-stone-500 dark:text-stone-400 dark:file:text-stone-200" />
            {images.length > 0 && <p className="text-xs text-stone-500 mt-1">{images.length} file(s) selected</p>}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Project" message="Are you sure you want to delete this project?" />
    </div>
  );
}
