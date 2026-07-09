import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineDocumentArrowUp, HiOutlineCalendarDays, HiOutlineCurrencyRupee } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const formatCurrency = (n) => n ? `₹${Number(n).toLocaleString()}` : '-';
const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

const statusColors = {
  active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  inactive: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  blocked: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const tabs = ['Overview', 'Timeline', 'Properties', 'Documents'];

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Overview');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [properties, setProperties] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({});
  const [allProperties, setAllProperties] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [followUpModalOpen, setFollowUpModalOpen] = useState(false);
  const [followUpForm, setFollowUpForm] = useState({ follow_up_date: '', follow_up_time: '', notes: '', reason: '', assigned_to: '' });
  const [newNoteText, setNewNoteText] = useState('');
  const [paymentView, setPaymentView] = useState('new');
  const [paymentForm, setPaymentForm] = useState({ payment_reason: '', amount: '', payment_status: 'paid', payment_mode: 'cash', reference_number: '', paid_by: '', credited_to: '', payment_date: new Date().toISOString().split('T')[0], remarks: '' });
  const [billView, setBillView] = useState(false);
  const [billPayment, setBillPayment] = useState(null);
  const [billData, setBillData] = useState(null);
  const [dues, setDues] = useState([]);
  const [duesLoading, setDuesLoading] = useState(false);
  const [receiptView, setReceiptView] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [paymentReasonsList, setPaymentReasonsList] = useState([]);

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
          assigned_to: res.data.assigned_to?._id || res.data.assigned_to || '',
        });
      })
      .catch(() => toast('Failed to load client', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClient();
    API.get('/properties?limit=500').then((res) => {
      const props = Array.isArray(res.data) ? res.data : res.data?.data || res.data?.properties || [];
      setAllProperties(props.filter((p) => !p.client || p.client?._id === id));
    }).catch(() => {});
    API.get('/employees').then((res) => setEmployees(res.data)).catch(() => {});
    API.get('/payments/reasons').then((res) => setPaymentReasonsList(Array.isArray(res.data) ? res.data : [])).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'Timeline') {
      API.get(`/clients/${id}/timeline`).then((res) => setTimeline(Array.isArray(res.data) ? res.data : res.data?.data || [])).catch(() => {});
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
        assigned_to: form.assigned_to || undefined,
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
      toast(err.response?.data?.message || 'Upload failed', 'error');
    }
    e.target.value = '';
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    try {
      const res = await API.post(`/clients/${id}/notes`, { text: newNoteText });
      setClient(res.data);
      setNewNoteText('');
      toast('Note added');
    } catch {
      toast('Error adding note', 'error');
    }
  };

  const handleCreateFollowUp = async () => {
    if (!followUpForm.follow_up_date || !followUpForm.assigned_to) return toast('Date and assignee required', 'error');
    try {
      await API.post('/follow-ups', {
        client_id: id,
        assigned_to: followUpForm.assigned_to,
        follow_up_date: followUpForm.follow_up_date,
        follow_up_time: followUpForm.follow_up_time || undefined,
        notes: followUpForm.notes || undefined,
        reason: followUpForm.reason || undefined,
      });
      toast('Follow-up created');
      setFollowUpModalOpen(false);
      setFollowUpForm({ follow_up_date: '', follow_up_time: '', notes: '', reason: '', assigned_to: '' });
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleCreatePayment = async () => {
    if (!paymentForm.amount) return toast('Amount required', 'error');
    if (paymentForm.payment_status === 'paid' && !paymentForm.payment_mode) return toast('Payment mode required for paid payments', 'error');
    try {
      const payload = {
        client_id: id,
        amount: Number(paymentForm.amount),
        payment_reason: paymentForm.payment_reason || undefined,
        payment_status: paymentForm.payment_status,
        payment_date: paymentForm.payment_date || undefined,
        remarks: paymentForm.remarks || undefined,
      };
      if (paymentForm.payment_status === 'paid') {
        payload.payment_mode = paymentForm.payment_mode;
        payload.reference_number = paymentForm.reference_number || undefined;
        payload.paid_by = paymentForm.paid_by || undefined;
        payload.credited_to = paymentForm.credited_to || undefined;
        payload.purchaser_name = paymentForm.paid_by || undefined;
      }
      await API.post('/payments', payload);
      toast('Payment created');
      setPaymentForm({ payment_reason: '', amount: '', payment_status: 'paid', payment_mode: 'cash', reference_number: '', paid_by: '', credited_to: '', payment_date: new Date().toISOString().split('T')[0], remarks: '' });
      setPaymentView('history');
      const res = await API.get(`/payments/by-client/${id}`);
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast(err.response?.data?.message || 'Error creating payment', 'error');
    }
  };

  const fetchPayments = async () => {
    setPaymentsLoading(true);
    try {
      const res = await API.get(`/payments/by-client/${id}`);
      setPayments(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load payments', 'error');
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchBillData = async () => {
    try {
      const res = await API.get(`/payments/client-bill/${id}`);
      setBillData(res.data);
    } catch {
      toast('Failed to load bill data', 'error');
    }
  };

  const fetchPaymentReceipt = async (paymentId) => {
    try {
      const res = await API.get(`/payments/${paymentId}/receipt`);
      setReceiptData(res.data);
      setReceiptView(true);
    } catch {
      toast('Failed to load receipt', 'error');
    }
  };

  const fetchDues = async () => {
    setDuesLoading(true);
    try {
      const res = await API.get(`/client-dues/by-client/${id}`);
      setDues(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast('Failed to load dues', 'error');
    } finally {
      setDuesLoading(false);
    }
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
          <div className="space-y-6">
            <div className="flex gap-2 mb-6 flex-wrap">
              <button onClick={() => setFollowUpModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
                <HiOutlineCalendarDays size={16} />
                Add Follow-up
              </button>

              <button onClick={() => setUploadModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
                <HiOutlineDocumentArrowUp size={16} />
                Upload Document
              </button>
              <button onClick={() => setPaymentModalOpen(true)} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200">
                <HiOutlineCurrencyRupee size={16} />
                Payment
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-stone-900">Requirements</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${client.requirement_type === 'buy' ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : client.requirement_type === 'rent' ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' : client.requirement_type === 'lease' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' : client.requirement_type === 'interior' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200' : 'bg-stone-50 text-stone-700 ring-1 ring-stone-200'}`}>
                  {client.requirement_type?.replace(/_/g, ' ') || 'N/A'}
                </span>
              </div>
              {client.requirement ? (
                <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <p className="text-sm text-stone-700">{client.requirement}</p>
                </div>
              ) : (
                <p className="text-sm text-stone-400 mb-4">No requirement specified</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Min Budget</p>
                  <p className="text-sm font-medium text-stone-900 mt-1">{client.budget_min ? `₹${client.budget_min.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Max Budget</p>
                  <p className="text-sm font-medium text-stone-900 mt-1">{client.budget_max ? `₹${client.budget_max.toLocaleString()}` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Client Type</p>
                  <p className="text-sm font-medium text-stone-900 mt-1 capitalize">{client.transaction_type || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Preferred Locations</p>
                  <p className="text-sm font-medium text-stone-900 mt-1">{(client.preferred_locations || []).join(', ') || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-base font-semibold text-stone-900 mb-4">Notes Timeline</h3>
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {client.notes_timeline?.length > 0 ? client.notes_timeline.map((n, i) => (
                  <div key={i} className="p-3 rounded-xl bg-amber-50 border-l-4 border-amber-300">
                    <p className="text-sm text-stone-700">{n.text}</p>
                    <p className="text-xs text-stone-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </div>
                )) : (
                  <p className="text-sm text-stone-400 italic">No notes yet</p>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
                  placeholder="Add a note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddNote(); }}
                />
                <button onClick={handleAddNote} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Add</button>
              </div>
              {client.requirement && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider mb-1">Requirement</p>
                  <p className="text-sm text-stone-700 whitespace-pre-wrap">{client.requirement}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
              <h3 className="text-base font-semibold text-stone-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Email</p>
                  <p className="text-sm text-stone-900 mt-1">{client.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Mobile</p>
                  <p className="text-sm text-stone-900 mt-1">{client.mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Alternate Mobile</p>
                  <p className="text-sm text-stone-900 mt-1">{client.alternate_mobile || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Address</p>
                  <p className="text-sm text-stone-900 mt-1">{client.address ? `${client.address}${client.city ? `, ${client.city}` : ''}${client.state ? `, ${client.state}` : ''}${client.pincode ? ` - ${client.pincode}` : ''}` : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Source</p>
                  <p className="text-sm text-stone-900 mt-1 capitalize">{client.source?.replace(/_/g, ' ') || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Assigned To</p>
                  <p className="text-sm text-stone-900 mt-1">{client.assigned_to?.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Property</p>
                  <p className="text-sm text-stone-900 mt-1">
                    {client.property ? (
                      <span 
                        className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium"
                        onClick={() => navigate(`/properties/${client.property._id || client.property}`)}
                      >
                        {client.property.property_id || client.property.name || client.property.title || 'View Property'}
                      </span>
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-stone-400 font-semibold uppercase tracking-wider">Created At</p>
                  <p className="text-sm text-stone-900 mt-1">{client.createdAt ? new Date(client.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                </div>
              </div>
            </div>
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
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Assigned To</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={form.assigned_to} onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">Unassigned</option>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.full_name} ({e.employee_id})</option>)}
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

      <Modal isOpen={followUpModalOpen} onClose={() => setFollowUpModalOpen(false)} title="Schedule Follow-up" size="md">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Follow-up Date *</label>
            <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={followUpForm.follow_up_date} onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_date: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Follow-up Time</label>
            <input type="time" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={followUpForm.follow_up_time} onChange={(e) => setFollowUpForm({ ...followUpForm, follow_up_time: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Assign To *</label>
            <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={followUpForm.assigned_to} onChange={(e) => setFollowUpForm({ ...followUpForm, assigned_to: e.target.value })} required>
              <option value="">Select user</option>
              {employees.map((u) => <option key={u._id} value={u._id}>{u.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reason</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={followUpForm.reason} onChange={(e) => setFollowUpForm({ ...followUpForm, reason: e.target.value })} placeholder="Why this follow-up?" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
            <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={followUpForm.notes} onChange={(e) => setFollowUpForm({ ...followUpForm, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setFollowUpModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button onClick={handleCreateFollowUp} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Create Follow-up</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={paymentModalOpen} onClose={() => { setPaymentModalOpen(false); setBillView(false); setBillPayment(null); setReceiptView(false); setReceiptData(null); }} title={billView && billPayment ? `Bill - ${billPayment.payment_number || ''}` : receiptView ? `Receipt - ${receiptData?.payment?.receipt_number || ''}` : `Payments - ${client?.full_name || ''}`} size={billView || receiptView || paymentView === 'complete_bill' || paymentView === 'dues' ? '2xl' : 'xl'}>
        <div className="flex gap-2 mb-4 border-b border-stone-200 pb-4">
          <button onClick={() => { setPaymentView('new'); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${paymentView === 'new' ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}>New Payment</button>
          <button onClick={() => { setPaymentView('history'); fetchPayments(); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${paymentView === 'history' ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}>Payment History</button>
          <button onClick={() => { setPaymentView('complete_bill'); fetchPayments(); fetchBillData(); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${paymentView === 'complete_bill' ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}>Complete Bill</button>
          <button onClick={() => { setPaymentView('dues'); fetchDues(); }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${paymentView === 'dues' ? 'bg-stone-900 text-white shadow-lg shadow-stone-900/10' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}>Due Payments</button>
        </div>

        {receiptView && receiptData ? (
          <div className="space-y-4">
            <style>{`
              @media print {
                @page { size: A4; margin: 12mm; }
                body * { visibility: hidden; }
                #receipt-print, #receipt-print * { visibility: visible; }
                #receipt-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                .no-print { display: none !important; }
              }
            `}</style>
            <div className="flex gap-2 no-print">
              <button onClick={() => setReceiptView(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer">← Back</button>
              <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer border-0">🖨 Print Receipt</button>
            </div>
            <div id="receipt-print" className="bg-white" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', padding: '20mm 15mm' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
                {receiptData.tenant?.company_logo && (
                  <img src={receiptData.tenant.company_logo} alt="Company Logo" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} />
                )}
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0' }}>{receiptData.tenant?.company_name || 'Company Name'}</h1>
                {receiptData.tenant?.company_address && (
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>{receiptData.tenant.company_address}</p>
                )}
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>+91 98991 46931 | 9891075835</p>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>PAYMENT RECEIPT</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Receipt #: {receiptData.payment?.receipt_number || receiptData.payment?.payment_number || 'N/A'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Received From</p>
                  <p style={{ fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{receiptData.payment?.purchaser_name || receiptData.payment?.paid_by || receiptData.client?.full_name || client?.full_name || 'N/A'}</p>
                  <p style={{ color: '#64748b', margin: '2px 0' }}>{client?.mobile || ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Date</p>
                  <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{receiptData.payment?.payment_date ? new Date(receiptData.payment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 8px', color: '#334155' }}>{receiptData.payment?.payment_reason || receiptData.payment?.reason || 'Payment'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{(receiptData.payment?.amount || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #1e293b', background: '#f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Total Amount</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>₹{(receiptData.payment?.amount || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              {receiptData.payment?.payment_status === 'paid' && (
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '15px' }}>
                  <p style={{ margin: '4px 0' }}><strong>Payment Mode:</strong> {receiptData.payment.payment_mode?.replace(/_/g, ' ') || 'N/A'}</p>
                  {receiptData.payment.reference_number && <p style={{ margin: '4px 0' }}><strong>Reference No:</strong> {receiptData.payment.reference_number}</p>}
                  {receiptData.payment.paid_by && <p style={{ margin: '4px 0' }}><strong>Paid By:</strong> {receiptData.payment.paid_by}</p>}
                  {receiptData.payment.credited_to && <p style={{ margin: '4px 0' }}><strong>Credited To:</strong> {receiptData.payment.credited_to}</p>}
                </div>
              )}
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}><strong>Received By:</strong> {receiptData.payment?.processed_by?.full_name || receiptData.payment?.created_by?.full_name || 'System'}</p>
              {receiptData.payment?.remarks && (
                <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0', fontStyle: 'italic' }}>Remarks: {receiptData.payment.remarks}</p>
              )}
              <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Authorized Signature</p>
                <div style={{ width: '200px', height: '50px', border: '1px dashed #94a3b8', borderRadius: '4px', marginTop: '4px' }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ margin: '2px 0' }}>This is a computer-generated receipt &bull; Valid without signature</p>
              </div>
            </div>
          </div>
        ) : billView && billPayment ? (
          <div className="space-y-4">
            <style>{`
              @media print {
                @page { size: A4; margin: 12mm; }
                body * { visibility: hidden; }
                #single-bill-print, #single-bill-print * { visibility: visible; }
                #single-bill-print { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                .no-print { display: none !important; }
              }
            `}</style>
            <div className="flex gap-2 no-print">
              <button onClick={() => setBillView(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer">← Back</button>
              <button onClick={() => window.print()} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors cursor-pointer border-0">🖨 Print Bill</button>
            </div>
            <div id="single-bill-print" className="bg-white" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', padding: '20mm 15mm' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: '4px 0' }}>{billPayment.tenantData?.company_name || billPayment._id ? 'Company Name' : 'Company Name'}</h1>
                <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>+91 98991 46931 | 9891075835</p>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>PAYMENT BILL</h2>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Bill #: {billPayment.payment_number || billPayment._id?.slice(-8)}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Bill To</p>
                  <p style={{ fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{client?.full_name || ''}</p>
                  <p style={{ color: '#64748b', margin: '2px 0' }}>{client?.mobile || ''}</p>
                  <p style={{ color: '#64748b', margin: '2px 0' }}>{client?.email || ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Date</p>
                  <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>
                    {billPayment.payment_date ? new Date(billPayment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '8px' }}>Payment Mode</p>
                  <p style={{ fontWeight: '600', color: '#1e293b', margin: 0, textTransform: 'capitalize' }}>{billPayment.payment_mode?.replace(/_/g, ' ') || 'N/A'}</p>
                </div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #1e293b' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 8px', color: '#334155' }}>{billPayment.payment_reason || billPayment.reason || 'Payment Amount'}</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>{(billPayment.amount || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: '2px solid #1e293b', background: '#f8fafc' }}>
                    <td style={{ padding: '10px 8px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Total Amount</td>
                    <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>₹{(billPayment.amount || 0).toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}><strong>Received By:</strong> {billPayment.processed_by?.full_name || 'System'}</p>
              <div style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Authorized Signature</p>
                <div style={{ width: '200px', height: '50px', border: '1px dashed #94a3b8', borderRadius: '4px', marginTop: '4px' }} />
              </div>
              <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                <p style={{ margin: '2px 0' }}>This is a computer-generated bill &bull; Valid without signature</p>
              </div>
            </div>
          </div>
        ) : paymentView === 'new' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Reason</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={paymentForm.payment_reason} onChange={(e) => setPaymentForm({ ...paymentForm, payment_reason: e.target.value })}>
                <option value="">Select reason</option>
                {paymentReasonsList.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amount (₹) *</label>
              <input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Status</label>
              <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={paymentForm.payment_status} onChange={(e) => setPaymentForm({ ...paymentForm, payment_status: e.target.value })}>
                <option value="paid">Paid</option>
                <option value="due">Due</option>
              </select>
            </div>

            {paymentForm.payment_status === 'paid' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Payment Mode</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Reference Number</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.reference_number} onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })} placeholder="UTR / Cheque / Transaction ID" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Person Who Made Payment</label>
                  <input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.paid_by} onChange={(e) => setPaymentForm({ ...paymentForm, paid_by: e.target.value })} placeholder="Name of the person" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-700 mb-1.5">Credited To</label>
                  <select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer" value={paymentForm.credited_to} onChange={(e) => setPaymentForm({ ...paymentForm, credited_to: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Company Account">Company Account</option>
                    <option value="Admin">Admin</option>
                    <option value="Employee">Employee</option>
                    <option value="Bank Account">Bank Account</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Date</label>
              <input type="date" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">Remarks (Optional)</label>
              <textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" rows={2} value={paymentForm.remarks} onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
              <button onClick={handleCreatePayment} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Create Payment</button>
            </div>
          </div>
        ) : paymentView === 'complete_bill' ? (
          <div>
            <style>{`
              @media print {
                @page { size: A4; margin: 15mm; }
                body * { visibility: hidden; }
                #complete-bill, #complete-bill * { visibility: visible; }
                #complete-bill { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                #complete-bill .no-print { display: none !important; }
              }
            `}</style>
            {paymentsLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No payments recorded for this client</p>
            ) : (
              <div id="complete-bill" className="bg-white" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', padding: '15mm' }}>
                <div className="no-print" style={{ textAlign: 'right', marginBottom: '10px' }}>
                  <button onClick={() => window.print()} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer' }}>🖨 Print Bill</button>
                </div>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '15px', marginBottom: '20px' }}>
                  {billData?.tenant?.company_logo && (
                    <img src={billData.tenant.company_logo} alt="Logo" style={{ maxHeight: '60px', width: 'auto', objectFit: 'contain', marginBottom: '8px' }} />
                  )}
                  <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{billData?.tenant?.company_name || 'Company Name'}</h1>
                  {billData?.tenant?.company_address && (
                    <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>{billData.tenant.company_address}</p>
                  )}
                  <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0' }}>+91 98991 46931 | 9891075835</p>
                  <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', marginTop: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Complete Payment Statement</h2>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '13px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Bill To</p>
                    <p style={{ fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{client?.full_name || ''}</p>
                    <p style={{ color: '#64748b', margin: '2px 0' }}>{client?.mobile || ''}</p>
                    <p style={{ color: '#64748b', margin: '2px 0' }}>{client?.email || ''}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Statement Date</p>
                    <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #1e293b', background: '#f1f5f9' }}>
                      <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>#</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>Date</th>
                      <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>Reason</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '8px 6px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '10px', textTransform: 'uppercase' }}>Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const isPaid = p.payment_status === 'paid' || p.status === 'completed';
                      return (
                        <tr key={p._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px 6px', color: '#64748b' }}>{i + 1}</td>
                          <td style={{ padding: '8px 6px', color: '#334155', fontSize: '11px' }}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</td>
                          <td style={{ padding: '8px 6px', color: '#334155' }}>{p.payment_reason || p.reason || 'Payment'}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>₹{(p.amount || 0).toLocaleString()}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'center' }}>
                            <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', background: isPaid ? '#dcfce7' : '#fef3c7', color: isPaid ? '#166534' : '#92400e' }}>
                              {isPaid ? 'Paid' : 'Due'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', color: '#64748b', fontSize: '11px', textTransform: 'capitalize' }}>{isPaid ? (p.payment_mode?.replace(/_/g, ' ') || '-') : '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: '2px solid #1e293b', background: '#f8fafc' }}>
                      <td colSpan={2} style={{ padding: '10px 6px' }}></td>
                      <td style={{ padding: '10px 6px', fontWeight: 'bold', color: '#1e293b', fontSize: '13px' }}>Total</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '13px' }}>₹{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr style={{ background: '#f0fdf4' }}>
                      <td colSpan={2}></td>
                      <td style={{ padding: '6px', fontWeight: '600', color: '#166534', fontSize: '12px' }}>Total Paid</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '600', color: '#166534', fontSize: '12px' }}>₹{payments.filter(p => p.payment_status === 'paid' || p.status === 'completed').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr style={{ background: '#fef3c7' }}>
                      <td colSpan={2}></td>
                      <td style={{ padding: '6px', fontWeight: '600', color: '#92400e', fontSize: '12px' }}>Total Due</td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: '600', color: '#92400e', fontSize: '12px' }}>₹{payments.filter(p => p.payment_status === 'due').reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr style={{ borderTop: '2px solid #1e293b' }}>
                      <td colSpan={2}></td>
                      <td style={{ padding: '10px 6px', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>Balance</td>
                      <td style={{ padding: '10px 6px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>
                        ₹{(payments.filter(p => p.payment_status === 'due').reduce((s, p) => s + (p.amount || 0), 0)).toLocaleString()}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
                {billData?.summary?.remarks && (
                  <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>Remarks: {billData.summary.remarks}</p>
                )}
                <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ margin: '2px 0' }}>This is a computer-generated statement</p>
                </div>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Close</button>
            </div>
          </div>
        ) : paymentView === 'dues' ? (
          <div>
            {duesLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>
            ) : dues.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No due payments for this client</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">#</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Amount</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Paid</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Remaining</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Reason</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Due Date</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((d, i) => (
                      <tr key={d._id} className="border-b border-stone-100 hover:bg-stone-50">
                        <td className="py-3 px-2 text-stone-700 font-medium">{i + 1}</td>
                        <td className="py-3 px-2 font-semibold text-stone-900">{formatCurrency(d.amount)}</td>
                        <td className="py-3 px-2 text-stone-700">{d.paid_amount ? formatCurrency(d.paid_amount) : '-'}</td>
                        <td className="py-3 px-2 text-stone-700">{d.remaining ? formatCurrency(d.remaining) : '-'}</td>
                        <td className="py-3 px-2 text-stone-600">{d.reason || '-'}</td>
                        <td className="py-3 px-2 text-stone-600 text-xs">{d.due_date ? new Date(d.due_date).toLocaleDateString('en-IN') : '-'}</td>
                        <td className="py-3 px-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            d.status === 'paid' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                            d.status === 'partial' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' :
                            d.status === 'waived' ? 'bg-stone-50 text-stone-700 ring-1 ring-stone-200' :
                            'bg-red-50 text-red-700 ring-1 ring-red-200'
                          }`}>{d.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-end">
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Close</button>
            </div>
          </div>
        ) : (
          <div>
            {paymentsLoading ? (
              <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>
            ) : payments.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-8">No payments recorded for this client</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">#</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Reason</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Amount</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Status</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Date</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Mode</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Ref No</th>
                      <th className="text-left py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Received By</th>
                      <th className="text-right py-3 px-2 text-stone-500 font-semibold text-xs uppercase">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p, i) => {
                      const isPaid = p.payment_status === 'paid' || p.status === 'completed';
                      return (
                        <tr key={p._id} className="border-b border-stone-100 hover:bg-stone-50">
                          <td className="py-3 px-2 text-stone-700 font-medium">{i + 1}</td>
                          <td className="py-3 px-2 text-stone-700">{p.payment_reason || p.reason || 'Payment'}</td>
                          <td className="py-3 px-2 font-semibold text-stone-900">{formatCurrency(p.amount)}</td>
                          <td className="py-3 px-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isPaid ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
                              {isPaid ? 'Paid' : 'Due'}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-stone-600 text-xs">{formatDateTime(p.payment_date)}</td>
                          <td className="py-3 px-2">
                            {isPaid ? (
                              <span className="text-xs uppercase bg-stone-100 px-2 py-0.5 rounded-full">{p.payment_mode?.replace(/_/g, ' ') || '-'}</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 px-2 text-stone-600 text-xs">{p.reference_number || p.utr_number || '-'}</td>
                          <td className="py-3 px-2 text-stone-700">{p.processed_by?.full_name || '-'}</td>
                          <td className="py-3 px-2 text-right">
                            <button onClick={() => fetchPaymentReceipt(p._id)} className="text-xs font-semibold text-stone-900 underline hover:text-stone-700 cursor-pointer">Receipt</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-stone-100 flex justify-between items-center">
              <p className="text-sm text-stone-500">Total: <span className="font-semibold text-stone-900">{formatCurrency(payments.reduce((s, p) => s + (p.amount || 0), 0))}</span></p>
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

