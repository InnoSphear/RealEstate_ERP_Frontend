import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineMapPin, HiOutlineBuildingOffice2, HiOutlineCalendarDays, HiOutlinePhoto, HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlineCloudArrowDown } from 'react-icons/hi2';

const statusBadge = (v) => {
  const map = { planning: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:ring-blue-800', ongoing: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800', completed: 'bg-green-50 text-green-700 ring-1 ring-green-200 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-800', on_hold: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800', cancelled: 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-800' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'}`}>{v?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>;
};

export default function ProjectDetail() {
  const id = window.location.pathname.split('/').pop();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateForm, setUpdateForm] = useState({ date: new Date().toISOString().split('T')[0], title: '', description: '' });
  const [updateImages, setUpdateImages] = useState([]);

  useEffect(() => {
    (async () => {
      try { const { data } = await API.get(`/projects/${id}`); setProject(data); }
      catch (err) { toast('Failed to load project', 'error'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleAddUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(updateForm).forEach(([k, v]) => { if (v) fd.append(k, v); });
      updateImages.forEach((img) => fd.append('images', img));
      await API.post(`/projects/${id}/daily-updates`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Daily update added');
      setUpdateModal(false);
      setUpdateForm({ date: new Date().toISOString().split('T')[0], title: '', description: '' });
      setUpdateImages([]);
      const { data } = await API.get(`/projects/${id}`);
      setProject(data);
    } catch (err) { toast(err.response?.data?.message || 'Error adding update', 'error'); }
  };

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 luxury-shadow p-5">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-stone-100 dark:border-stone-700">
        {Icon && <Icon size={16} className="text-stone-400" />}{title}
      </h3>
      {children}
    </div>
  );

  const DetailRow = ({ label, value }) => value ? (
    <div className="flex justify-between py-2.5 border-b border-stone-100 dark:border-stone-700 last:border-0">
      <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
      <span className="text-sm font-medium text-stone-900 dark:text-white text-right">{value}</span>
    </div>
  ) : null;

  if (loading) return <div className="flex items-center justify-center py-32"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent dark:border-white" /></div>;
  if (!project) return <div className="text-center py-20 text-stone-400 dark:text-stone-500">Project not found</div>;

  const p = project;

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"><HiOutlineArrowLeft size={16} /> Back</button>
        <button onClick={() => { window.location.href = `/projects/${id}/edit`; }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600"><HiOutlinePencilSquare size={15} /> Edit</button>
      </div>

      <div className="relative h-56 sm:h-72 lg:h-96 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-700">
        {p.images?.length ? (
          <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-stone-300 dark:text-stone-500"><HiOutlineBuildingOffice2 size={60} /></div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{p.project_name || 'Project'}</h1>
          <div className="flex items-center gap-3 text-white/80 text-sm">
            {p.location && <span className="flex items-center gap-1"><HiOutlineMapPin size={14} />{p.location}</span>}
            {p.builder_name && <span>{p.builder_name}</span>}
            <span>{statusBadge(p.status)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Project Information" icon={HiOutlineBuildingOffice2}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <DetailRow label="Builder Name" value={p.builder_name} />
              <DetailRow label="Builder Contact" value={p.builder_contact} />
              <DetailRow label="Builder Email" value={p.builder_email} />
              <DetailRow label="Location" value={p.location} />
              <DetailRow label="City" value={p.city} />
              <DetailRow label="State" value={p.state} />
              <DetailRow label="Launch Date" value={p.launch_date ? new Date(p.launch_date).toLocaleDateString() : null} />
              <DetailRow label="Completion Date" value={p.completion_date ? new Date(p.completion_date).toLocaleDateString() : null} />
              <DetailRow label="Total Units" value={p.total_units} />
              <DetailRow label="Available Units" value={p.available_units ?? '-'} />
            </div>
          </Section>

          <Section title="Description">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{p.description || 'No description provided.'}</p>
          </Section>

          {p.amenities?.length ? (
            <Section title="Amenities">
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(p.amenities) ? p.amenities : p.amenities.split(',').map((s) => s.trim())).filter(Boolean).map((a, i) => (
                  <span key={i} className="px-3 py-1.5 bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-medium ring-1 ring-stone-200 dark:ring-stone-600">{a}</span>
                ))}
              </div>
            </Section>
          ) : null}

          {p.unit_types?.length ? (
            <Section title="Unit Types">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 dark:border-stone-700">
                      <th className="text-left px-3 py-2.5 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">Total</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">Available</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">Price Range</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-stone-500 dark:text-stone-400 text-xs uppercase tracking-wider">Carpet Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.unit_types.map((ut, i) => (
                      <tr key={i} className="border-b border-stone-100 dark:border-stone-700 last:border-0">
                        <td className="px-3 py-2.5 text-stone-900 dark:text-white font-medium">{ut.type || '-'}</td>
                        <td className="px-3 py-2.5 text-stone-700 dark:text-stone-200">{ut.total ?? '-'}</td>
                        <td className="px-3 py-2.5 text-stone-700 dark:text-stone-200">{ut.available ?? '-'}</td>
                        <td className="px-3 py-2.5 text-stone-700 dark:text-stone-200">{ut.price_range || '-'}</td>
                        <td className="px-3 py-2.5 text-stone-700 dark:text-stone-200">{ut.carpet_area || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          <Section title="Daily Updates">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-stone-500 dark:text-stone-400">Project progress updates</p>
              <button onClick={() => { setUpdateForm({ date: new Date().toISOString().split('T')[0], title: '', description: '' }); setUpdateImages([]); setUpdateModal(true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600"><HiOutlinePlusCircle size={14} /> Add Update</button>
            </div>
            {p.daily_updates?.length ? (
              <div className="space-y-4">
                {p.daily_updates.map((u, i) => (
                  <div key={i} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-700">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-sm text-stone-900 dark:text-white">{u.title}</h4>
                      <span className="text-xs text-stone-400 dark:text-stone-500 flex items-center gap-1"><HiOutlineCalendarDays size={13} />{u.date ? new Date(u.date).toLocaleDateString() : ''}</span>
                    </div>
                    {u.description && <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">{u.description}</p>}
                    {u.images?.length ? (
                      <div className="flex gap-2 mt-2">
                        {u.images.map((img, j) => (
                          <img key={j} src={img} alt="" className="w-20 h-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-stone-400 dark:text-stone-500 py-6 text-sm">No updates yet</p>
            )}
          </Section>
        </div>

        <div className="space-y-6">
          <Section title="Units Overview">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
                <p className="text-2xl font-bold text-stone-900 dark:text-white">{p.total_units || 0}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Units</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-stone-50 dark:bg-stone-700">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{p.available_units ?? 0}</p>
                <p className="text-xs text-stone-500 dark:text-stone-400">Available</p>
              </div>
            </div>
          </Section>

          <Section title="Documents" icon={HiOutlineDocumentText}>
            {p.documents?.length ? (
              <div className="space-y-2">
                {p.documents.map((doc, i) => (
                  <a key={i} href={doc.url || doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700">
                    <HiOutlineDocumentText size={16} className="text-stone-400" />
                    <span className="flex-1 truncate">{doc.name || `Document ${i + 1}`}</span>
                    <HiOutlineCloudArrowDown size={14} className="text-stone-400" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-stone-400 dark:text-stone-500 text-center py-4">No documents</p>
            )}
          </Section>

          {p.brochure_url && (
            <Section title="Brochure">
              <a href={p.brochure_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold bg-stone-900 text-white hover:bg-stone-800 transition-colors shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">
                <HiOutlineCloudArrowDown size={16} /> Download Brochure
              </a>
            </Section>
          )}

          <Section title="Gallery">
            {p.images?.length ? (
              <div className="grid grid-cols-2 gap-2">
                {p.images.map((img, i) => (
                  <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="aspect-video rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-700 group">
                    <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-stone-300 dark:text-stone-500"><HiOutlinePhoto size={32} /><p className="text-xs mt-1">No images</p></div>
            )}
          </Section>
        </div>
      </div>

      <Modal isOpen={updateModal} onClose={() => setUpdateModal(false)} title="Add Daily Update">
        <form onSubmit={handleAddUpdate} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Date *</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white" value={updateForm.date} onChange={(e) => setUpdateForm({ ...updateForm, date: e.target.value })} required />
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Title *</label>
            <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={updateForm.title} onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })} required />
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Description</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={3} value={updateForm.description} onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })} />
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Images</label>
            <input type="file" multiple accept="image/*" onChange={(e) => setUpdateImages([...e.target.files])} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-stone-100 dark:file:bg-stone-700 file:text-sm file:font-semibold text-stone-500 dark:text-stone-400 dark:file:text-stone-200" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setUpdateModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">Add Update</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
