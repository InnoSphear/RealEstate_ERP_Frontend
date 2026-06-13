import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlinePhone, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineArrowPath } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  new: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  contacted: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  hot: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  warm: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  cold: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  follow_up: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  site_visit: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  negotiation: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  won: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  lost: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const historyIcons = {
  creation: 'bg-blue-100 text-blue-600',
  status_change: 'bg-purple-100 text-purple-600',
  assignment: 'bg-amber-100 text-amber-600',
  conversion: 'bg-emerald-100 text-emerald-600',
  call_note: 'bg-stone-100 text-stone-600',
  update: 'bg-stone-100 text-stone-600',
};

const tabs = ['Overview', 'Timeline', 'Follow-ups', 'Call Notes'];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [convertModalOpen, setConvertModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [callNoteModalOpen, setCallNoteModalOpen] = useState(false);
  const [callNote, setCallNote] = useState('');
  const [conversionForm, setConversionForm] = useState({ transaction_type: 'purchase', property_id: '', property_search: '', interior_project: {} });
  const [properties, setProperties] = useState([]);
  const [history, setHistory] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [users, setUsers] = useState([]);
  const [transferUserId, setTransferUserId] = useState('');
  const [form, setForm] = useState({});

  const fetchLead = () => {
    setLoading(true);
    API.get(`/leads/${id}`)
      .then((res) => {
        setLead(res.data);
        setForm({
          full_name: res.data.full_name || '',
          email: res.data.email || '',
          mobile: res.data.mobile || '',
          alternate_mobile: res.data.alternate_mobile || '',
          address: res.data.address || '',
          city: res.data.city || '',
          state: res.data.state || '',
          pincode: res.data.pincode || '',
          budget: res.data.budget || '',
          property_type: res.data.property_type || '',
          source: res.data.source || 'website',
          status: res.data.status || 'new',
          requirement: res.data.requirement || '',
          preferred_locations: res.data.preferred_locations || [],
          notes: res.data.notes || '',
          lead_score: res.data.lead_score || 0,
        });
      })
      .catch(() => toast('Failed to load lead', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLead(); }, [id]);

  useEffect(() => {
    if (!lead) return;
    if (activeTab === 'Timeline') {
      API.get(`/leads/${id}/history`).then((res) => setHistory(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    }
    if (activeTab === 'Follow-ups') {
      API.get(`/follow-ups?lead=${id}`).then((res) => setFollowUps(Array.isArray(res.data) ? res.data : [])).catch(() => {});
    }
  }, [activeTab, lead, id]);

  useEffect(() => {
    API.get('/users').then((res) => setUsers(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/leads/${id}`, form);
      toast('Lead updated');
      setEditModalOpen(false);
      fetchLead();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const searchProperties = async (q) => {
    try {
      const { data } = await API.get(`/properties?search=${encodeURIComponent(q)}`);
      setProperties(Array.isArray(data) ? data : data.properties || []);
    } catch { setProperties([]); }
  };

  useEffect(() => {
    if (convertModalOpen && (conversionForm.transaction_type === 'sell' || conversionForm.transaction_type === 'purchase')) {
      searchProperties('');
    }
  }, [convertModalOpen, conversionForm.transaction_type]);

  const handleConvert = async () => {
    try {
      const payload = { transaction_type: conversionForm.transaction_type };
      if (conversionForm.transaction_type === 'sell' || conversionForm.transaction_type === 'purchase') {
        if (!conversionForm.property_id) return toast('Select a property', 'error');
        payload.property_id = conversionForm.property_id;
      }
      if (conversionForm.transaction_type === 'interior') {
        payload.interior_project = conversionForm.interior_project;
      }
      const res = await API.put(`/leads/${id}/convert-to-client`, payload);
      toast('Lead converted to client');
      setConvertModalOpen(false);
      setConversionForm({ transaction_type: 'purchase', property_id: '', property_search: '', interior_project: {} });
      fetchLead();
    } catch (err) {
      toast(err.response?.data?.message || 'Conversion failed', 'error');
    }
  };

  const handleTransfer = async () => {
    if (!transferUserId) return toast('Select a user', 'error');
    try {
      await API.put(`/leads/${id}/transfer`, { assigned_to: transferUserId });
      toast('Lead transferred');
      setTransferModalOpen(false);
      fetchLead();
    } catch (err) {
      toast(err.response?.data?.message || 'Transfer failed', 'error');
    }
  };

  const handleAddCallNote = async () => {
    if (!callNote.trim()) return toast('Enter a call note', 'error');
    try {
      await API.post(`/leads/${id}/call-notes`, { note: callNote });
      toast('Call note added');
      setCallNote('');
      setCallNoteModalOpen(false);
      fetchLead();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
  const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Lead not found</p>
        <button onClick={() => navigate('/leads')} className="mt-4 text-sm text-stone-900 underline">Back to leads</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leads')} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">{lead.full_name}</h1>
              <span className={statusColors[lead.status] || statusColors.new}>{lead.status?.replace('_', ' ')}</span>
              {lead.converted_to_client && <span className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">Converted</span>}
            </div>
            <p className="text-stone-500 mt-1">Lead ID: {lead.lead_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCallNoteModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
            <HiOutlinePhone size={15} /> Log Call
          </button>
          {!lead.converted_to_client && (
            <button onClick={() => setConvertModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
              <HiOutlineCheckCircle size={15} /> Convert
            </button>
          )}
          <button onClick={() => setTransferModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
            <HiOutlineArrowPath size={15} /> Transfer
          </button>
          <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
            <HiOutlinePencilSquare size={16} /> Edit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Mobile</p>
            <p className="text-sm text-stone-900 mt-1">{lead.mobile || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Email</p>
            <p className="text-sm text-stone-900 mt-1">{lead.email || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Source</p>
            <p className="text-sm text-stone-900 mt-1 capitalize">{lead.source || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Lead Score</p>
            <p className={`text-sm font-semibold mt-1 ${lead.lead_score > 60 ? 'text-emerald-600' : lead.lead_score > 30 ? 'text-amber-600' : 'text-red-600'}`}>{lead.lead_score}/100</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Assigned To</p>
            <p className="text-sm text-stone-900 mt-1">{lead.assigned_to?.full_name || 'Unassigned'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Budget</p>
            <p className="text-sm text-stone-900 mt-1">{lead.budget ? `₹${Number(lead.budget).toLocaleString()}` : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Property Type</p>
            <p className="text-sm text-stone-900 mt-1 capitalize">{lead.property_type || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Next Follow-up</p>
            <p className="text-sm text-stone-900 mt-1">{lead.next_follow_up ? formatDate(lead.next_follow_up) : '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">City</p>
            <p className="text-sm text-stone-900 mt-1">{lead.city || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">State</p>
            <p className="text-sm text-stone-900 mt-1">{lead.state || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Created</p>
            <p className="text-sm text-stone-900 mt-1">{formatDate(lead.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Last Contacted</p>
            <p className="text-sm text-stone-900 mt-1">{lead.last_contacted ? formatDate(lead.last_contacted) : '-'}</p>
          </div>
        </div>
        {lead.requirement && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Requirement</p>
            <p className="text-sm text-stone-700">{lead.requirement}</p>
          </div>
        )}
        {lead.preferred_locations?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Preferred Locations</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {lead.preferred_locations.map((loc, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-stone-50 text-stone-600 text-xs font-medium">{loc}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-b border-stone-200">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === tab ? 'text-stone-900 border-stone-900' : 'text-stone-400 border-transparent hover:text-stone-600'}`}>{tab}</button>
          ))}
        </div>
      </div>

      {activeTab === 'Overview' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Additional Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Alternate Mobile</p>
              <p className="text-sm text-stone-900 mt-1">{lead.alternate_mobile || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Address</p>
              <p className="text-sm text-stone-900 mt-1">{lead.address || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Pincode</p>
              <p className="text-sm text-stone-900 mt-1">{lead.pincode || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Converted to Client</p>
              <p className="text-sm text-stone-900 mt-1">{lead.converted_to_client ? `Yes (${lead.converted_client?.full_name || ''})` : 'No'}</p>
            </div>
            {lead.conversion_details?.transaction_type && (
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Deal Type</p>
                <p className="text-sm text-stone-900 mt-1 capitalize">{lead.conversion_details.transaction_type}</p>
              </div>
            )}
            {lead.conversion_details?.property && (
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Property</p>
                <p className="text-sm text-stone-900 mt-1">{lead.conversion_details.property.property_id} - {lead.conversion_details.property.location}</p>
              </div>
            )}
            {lead.conversion_details?.interior_project && (
              <div>
                <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Interior Project</p>
                <p className="text-sm text-stone-900 mt-1">{lead.conversion_details.interior_project.title || 'Interior Project'}</p>
              </div>
            )}
          </div>
          {lead.notes && (
            <div className="mt-4 pt-4 border-t border-stone-100">
              <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-stone-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'Timeline' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Lead Timeline</h3>
          {history.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No history recorded yet</p>
          ) : (
            <div className="space-y-0">
              {history.map((entry, i) => (
                <div key={entry._id || i} className="flex gap-4 pb-4 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${historyIcons[entry.type] || 'bg-stone-100 text-stone-600'}`}>
                      {entry.type === 'creation' ? 'N' : entry.type === 'status_change' ? 'S' : entry.type === 'assignment' ? 'A' : entry.type === 'conversion' ? 'C' : entry.type === 'call_note' ? 'P' : 'U'}
                    </div>
                    {i < history.length - 1 && <div className="w-px flex-1 bg-stone-200 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-stone-900 font-medium">{entry.description || entry.type}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {entry.user?.full_name || 'System'} &middot; {formatDate(entry.createdAt)} {formatTime(entry.createdAt)}
                    </p>
                    {entry.field && entry.old_value !== undefined && (
                      <p className="text-xs text-stone-500 mt-1">
                        {entry.field}: <span className="line-through text-red-500">{String(entry.old_value)}</span> &rarr; <span className="text-emerald-600">{String(entry.new_value)}</span>
                      </p>
                    )}
                    {entry.type === 'call_note' && entry.metadata?.note && (
                      <p className="text-xs text-stone-600 mt-1 bg-stone-50 p-2 rounded-lg italic">"{entry.metadata.note}"</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Follow-ups' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Follow-ups</h3>
          {followUps.length === 0 ? (
            <p className="text-sm text-stone-400 text-center py-8">No follow-ups scheduled</p>
          ) : (
            <div className="space-y-3">
              {followUps.map((fu) => (
                <div key={fu._id} className="flex items-center justify-between p-4 rounded-xl bg-stone-50">
                  <div>
                    <p className="text-sm text-stone-900 font-medium">{fu.notes || 'No notes'}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(fu.follow_up_date)} {fu.follow_up_time || ''} &middot; Assigned to {fu.assigned_to?.full_name || 'Unknown'}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    fu.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    fu.status === 'missed' ? 'bg-red-50 text-red-700' :
                    fu.status === 'rescheduled' ? 'bg-amber-50 text-amber-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>{fu.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Call Notes' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Call Notes</h3>
          {(!lead.call_notes || lead.call_notes.length === 0) ? (
            <p className="text-sm text-stone-400 text-center py-8">No call notes recorded</p>
          ) : (
            <div className="space-y-3">
              {lead.call_notes.map((note, i) => (
                <div key={i} className="p-4 rounded-xl bg-stone-50 border-l-4 border-stone-300">
                  <p className="text-sm text-stone-700">{note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Lead">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name *</label><input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile *</label><input className={inputClass} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Alternate Mobile</label><input className={inputClass} value={form.alternate_mobile} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['new','contacted','hot','warm','cold','follow_up','site_visit','negotiation','won','lost'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Source</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {['facebook','google','instagram','website','walk_in','referral','99acres','magicbricks','housing','other','social_media','call','ad'].map((s) => <option key={s} value={s}>{s.replace('_', ' ').charAt(0).toUpperCase() + s.replace('_', ' ').slice(1)}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Lead Score (0-100)</label><input type="number" min={0} max={100} className={inputClass} value={form.lead_score} onChange={(e) => setForm({ ...form, lead_score: parseInt(e.target.value) || 0 })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Budget</label><input type="number" className={inputClass} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Property Type</label><input className={inputClass} value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">City</label><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">State</label><input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement</label><textarea className={inputClass} rows={2} value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Save Changes</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={convertModalOpen} onClose={() => setConvertModalOpen(false)} title="Convert to Client" size="lg">
        <p className="text-sm text-stone-600 mb-5">Convert <strong>{lead.full_name}</strong> to a client with deal details.</p>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Transaction Type *</label>
            <select className={inputClass + " appearance-none cursor-pointer"} value={conversionForm.transaction_type} onChange={(e) => setConversionForm({ ...conversionForm, transaction_type: e.target.value, property_id: '', property_search: '', interior_project: {} })}>
              <option value="purchase">Purchase</option>
              <option value="sell">Sell</option>
              <option value="interior">Interior</option>
            </select>
          </div>

          {(conversionForm.transaction_type === 'sell' || conversionForm.transaction_type === 'purchase') && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Select Property</label>
              <input
                className={inputClass + " mb-2"}
                placeholder="Search properties..."
                value={conversionForm.property_search}
                onChange={(e) => {
                  setConversionForm({ ...conversionForm, property_search: e.target.value });
                  searchProperties(e.target.value);
                }}
              />
              <div className="max-h-48 overflow-y-auto border border-stone-200 rounded-xl divide-y divide-stone-100">
                {properties.length === 0 ? (
                  <p className="text-sm text-stone-400 p-3 text-center">No properties found</p>
                ) : properties.map((p) => (
                  <div
                    key={p._id}
                    className={`p-3 text-sm cursor-pointer transition-colors ${conversionForm.property_id === p._id ? 'bg-stone-100 font-semibold' : 'hover:bg-stone-50'}`}
                    onClick={() => setConversionForm({ ...conversionForm, property_id: p._id, property_search: `${p.property_id} - ${p.location} (${p.property_type})` })}
                  >
                    {p.property_id} - {p.location} ({p.property_type}) {p.price_sale ? `- ₹${Number(p.price_sale).toLocaleString()}` : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          {conversionForm.transaction_type === 'interior' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Title *</label>
                  <input className={inputClass} value={conversionForm.interior_project.title || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, title: e.target.value } })} placeholder="e.g. 3BHK Interior Design" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Project Type</label>
                  <select className={inputClass + " appearance-none cursor-pointer"} value={conversionForm.interior_project.project_type || 'residential'} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, project_type: e.target.value } })}>
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="office">Office</option>
                    <option value="renovation">Renovation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Total Area (sqft)</label>
                  <input type="number" className={inputClass} value={conversionForm.interior_project.total_area_sqft || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, total_area_sqft: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Estimated Budget (₹)</label>
                  <input type="number" className={inputClass} value={conversionForm.interior_project.estimated_budget || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, estimated_budget: e.target.value } })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">Scope of Work</label>
                <textarea className={inputClass} rows={3} value={conversionForm.interior_project.scope_of_work || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, scope_of_work: e.target.value } })} placeholder="Describe the scope of interior work..." />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Start Date</label>
                  <input type="date" className={inputClass} value={conversionForm.interior_project.start_date || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, start_date: e.target.value } })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Expected End Date</label>
                  <input type="date" className={inputClass} value={conversionForm.interior_project.expected_end_date || ''} onChange={(e) => setConversionForm({ ...conversionForm, interior_project: { ...conversionForm.interior_project, expected_end_date: e.target.value } })} />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setConvertModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleConvert} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/10">Convert to Client</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={transferModalOpen} onClose={() => setTransferModalOpen(false)} title="Transfer Lead" size="sm">
        <div className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Transfer to</label>
            <select className={inputClass + " appearance-none cursor-pointer"} value={transferUserId} onChange={(e) => setTransferUserId(e.target.value)}>
              <option value="">Select user</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.full_name} ({u.email})</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setTransferModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleTransfer} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Transfer</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={callNoteModalOpen} onClose={() => setCallNoteModalOpen(false)} title="Log Call Note" size="sm">
        <div className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Call Note</label>
            <textarea className={inputClass} rows={4} value={callNote} onChange={(e) => setCallNote(e.target.value)} placeholder="Enter details of the call..." />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setCallNoteModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleAddCallNote} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Save Note</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}