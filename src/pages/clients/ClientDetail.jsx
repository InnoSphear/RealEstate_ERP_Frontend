import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineDocumentArrowUp } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  inactive: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  blocked: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const tabs = ['Overview', 'Timeline', 'Communications', 'Properties', 'Documents'];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({});
  const [allProperties, setAllProperties] = useState([]);

  const fetchClient = () => {
    setLoading(true);
    API.get(`/clients/${id}`)
      .then((res) => {
        setClient(res.data);
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          mobile: res.data.mobile || '',
          alternate_mobile: res.data.alternate_mobile || '',
          address: res.data.address || '',
          city: res.data.city || '',
          state: res.data.state || '',
          pincode: res.data.pincode || '',
          requirement_type: res.data.requirement_type || 'buy',
          budget_min: res.data.budget_min || '',
          budget_max: res.data.budget_max || '',
          requirement: res.data.requirement || '',
          preferred_locations: res.data.preferred_locations || [],
          source: res.data.source || 'referral',
          notes: res.data.notes || '',
          status: res.data.status || 'active',
          transaction_type: res.data.transaction_type || '',
          property: res.data.property?._id || res.data.property || '',
        });
      })
      .catch(() => toast('Failed to load client', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchClient(); API.get('/properties').then((res) => setAllProperties(res.data)).catch(() => {}); }, [id]);

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'Timeline') {
      API.get(`/clients/${id}/timeline`).then((res) => setTimeline(Array.isArray(res.data) ? res.data : res.data?.data || [])).catch(() => {});
    }
    if (activeTab === 'Communications') {
      Promise.all([
        API.get(`/clients/${id}/follow-ups`).catch(() => ({ data: [] })),
        API.get(`/clients/${id}/communications`).catch(() => ({ data: [] })),
      ]).then(([fRes, cRes]) => {
        setCommunications([...(fRes.data || []), ...(cRes.data || [])]);
      });
    }
    if (activeTab === 'Properties') {
      API.get(`/clients/${id}/properties`).then((res) => setProperties(Array.isArray(res.data) ? res.data : res.data?.data || [])).catch(() => {});
    }
    if (activeTab === 'Documents') {
      API.get(`/clients/${id}/documents`).then((res) => setDocuments(Array.isArray(res.data) ? res.data : res.data?.data || [])).catch(() => {});
    }
  }, [activeTab, client, id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/clients/${id}`, {
        ...form,
        property: form.property || undefined,
        budget_min: form.budget_min ? Number(form.budget_min) : undefined,
        budget_max: form.budget_max ? Number(form.budget_max) : undefined,
      });
      toast('Client updated');
      setEditModalOpen(false);
      fetchClient();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      await API.post(`/clients/${id}/documents`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Document uploaded');
      setUploadModalOpen(false);
      const res = await API.get(`/clients/${id}/documents`);
      setDocuments(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      toast('Upload failed', 'error');
    }
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Client not found</p>
        <button onClick={() => navigate('/clients')} className="mt-4 text-sm text-stone-900 underline">Back to clients</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/clients')} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{client.full_name}</h1>
              <span className={statusColors[client.status] || statusColors.active}>{client.status}</span>
            </div>
            <p className="text-stone-500 mt-1">Client ID: {client.client_id || client._id}</p>
          </div>
        </div>
        <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
          <HiOutlinePencilSquare size={16} />
          Edit
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Mobile</p>
            <p className="text-sm text-stone-900 mt-1">{client.mobile || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Email</p>
            <p className="text-sm text-stone-900 mt-1">{client.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Source</p>
            <p className="text-sm text-stone-900 mt-1 capitalize">{client.source?.replace(/_/g, ' ') || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Assigned To</p>
            <p className="text-sm text-stone-900 mt-1">{client.assigned_to?.full_name || '-'}</p>
          </div>
        </div>
      </div>

      <div className="border-b border-stone-200">
        <div className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? 'text-stone-900 border-stone-900' : 'text-stone-400 border-transparent hover:text-stone-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div>
        {activeTab === 'Overview' && (
          <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Address</p>
                <p className="text-sm text-stone-900 mt-1">{client.address || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">City</p>
                <p className="text-sm text-stone-900 mt-1">{client.city || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">State</p>
                <p className="text-sm text-stone-900 mt-1">{client.state || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Pincode</p>
                <p className="text-sm text-stone-900 mt-1">{client.pincode || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Requirement Type</p>
                <p className="text-sm text-stone-900 mt-1 capitalize">{client.requirement_type?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Client Type</p>
                <p className="text-sm text-stone-900 mt-1 capitalize">{client.transaction_type || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Property</p>
                <p className="text-sm text-stone-900 mt-1">{client.property?.property_id || client.property?.name || client.property?.title || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Budget Range</p>
                <p className="text-sm text-stone-900 mt-1">
                  {client.budget_min || client.budget_max
                    ? `₹${(client.budget_min || 0).toLocaleString()} - ₹${(client.budget_max || 0).toLocaleString()}`
                    : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Requirement</p>
                <p className="text-sm text-stone-900 mt-1">{client.requirement || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Preferred Locations</p>
                <p className="text-sm text-stone-900 mt-1">{(client.preferred_locations || []).join(', ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Converted From Lead</p>
                <p className="text-sm text-stone-900 mt-1">{client.converted_from_lead ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Lead Score</p>
                <p className="text-sm text-stone-900 mt-1">{client.lead_score ?? '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Alternate Mobile</p>
                <p className="text-sm text-stone-900 mt-1">{client.alternate_mobile || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Created At</p>
                <p className="text-sm text-stone-900 mt-1">{client.created_at ? new Date(client.created_at).toLocaleDateString() : '-'}</p>
              </div>
            </div>
            {client.notes && (
              <div className="mt-6 pt-6 border-t border-stone-100">
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Notes</p>
                <p className="text-sm text-stone-900 mt-1">{client.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Timeline' && (
          <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
            {timeline.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No timeline activity yet</p>
            ) : (
              <div className="space-y-4">
                {timeline.map((entry, i) => (
                  <div key={entry._id || i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-stone-300 mt-1.5" />
                      {i < timeline.length - 1 && <div className="w-px flex-1 bg-stone-200 mt-1" />}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-sm font-medium text-stone-900">{entry.action || entry.type || 'Activity'}</p>
                      <p className="text-xs text-stone-500 mt-0.5">{entry.description || entry.message || ''}</p>
                      <p className="text-xs text-stone-400 mt-1">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Communications' && (
          <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
            {communications.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No communications yet</p>
            ) : (
              <div className="space-y-4">
                {communications.map((comm, i) => (
                  <div key={comm._id || i} className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-stone-900 capitalize">{comm.type || comm.follow_up_type || 'Follow-up'}</span>
                      <span className="text-xs text-stone-400">{comm.date || comm.follow_up_date ? new Date(comm.date || comm.follow_up_date).toLocaleDateString() : ''}</span>
                    </div>
                    <p className="text-sm text-stone-600">{comm.notes || comm.message || 'No notes'}</p>
                    {comm.assigned_to && <p className="text-xs text-stone-400 mt-2">By: {comm.assigned_to?.full_name || 'Unknown'}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Properties' && (
          <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
            {properties.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No properties interacted with</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {properties.map((prop) => (
                  <div key={prop._id} className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <p className="text-sm font-semibold text-stone-900">{prop.title || prop.name || 'Property'}</p>
                    <p className="text-xs text-stone-500 mt-1">{prop.property_type || ''} {prop.city ? `- ${prop.city}` : ''}</p>
                    {prop.status && <span className="text-xs text-stone-400 mt-1 block capitalize">{prop.status.replace(/_/g, ' ')}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Documents' && (
          <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-stone-900">Documents</h3>
              <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
                <HiOutlineDocumentArrowUp size={16} />
                Upload
              </button>
            </div>
            {documents.length === 0 ? (
              <p className="text-stone-400 text-sm text-center py-8">No documents uploaded</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc._id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{doc.name || doc.file_name || 'Document'}</p>
                      <p className="text-xs text-stone-400">{doc.type || doc.file_type || ''} {doc.size ? `- ${(doc.size / 1024).toFixed(1)} KB` : ''}</p>
                    </div>
                    {doc.url && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-stone-900 underline">View</a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Client" size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label><input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Alternate Mobile</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.alternate_mobile} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">City</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">State</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Pincode</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement Type</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.requirement_type} onChange={(e) => setForm({ ...form, requirement_type: e.target.value })}>
              <option value="buy">Buy</option><option value="rent">Rent</option><option value="lease">Lease</option><option value="interior">Interior</option><option value="sell">Sell</option>
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Client Type</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.transaction_type} onChange={(e) => setForm({ ...form, transaction_type: e.target.value })}>
              <option value="">Select Type</option><option value="rent">Rent</option><option value="purchase">Purchase</option><option value="sell">Sell</option><option value="interior">Interior</option>
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Property</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">Select Property</option>
              {allProperties.map((p) => <option key={p._id} value={p._id}>{p.property_id} - {p.location || p.name || p.title}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Min Budget</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Max Budget</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Source</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              <option value="referral">Referral</option><option value="website">Website</option><option value="social_media">Social Media</option><option value="walk_in">Walk-in</option><option value="call">Call</option><option value="ad">Ad</option>
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option>
            </select></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Address</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Update</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} title="Upload Document" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-stone-600">Upload a document for this client</p>
          <input type="file" onChange={handleUpload} className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-stone-900 file:text-white hover:file:bg-stone-800 file:cursor-pointer cursor-pointer" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setUploadModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
