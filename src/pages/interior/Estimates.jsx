import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineReceiptPercent, HiOutlinePrinter, HiOutlineTrash, HiOutlinePencilSquare } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function Estimates() {
  const [estimates, setEstimates] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [form, setForm] = useState({
    lead: '', project: '', full_name: '', mobile: '', email: '',
    title: '', instructions: '', delivery_terms: '',
    valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '',
  });
  const leadsMap = Object.fromEntries(leads.map((l) => [l._id, l]));

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      API.get('/estimates'),
      API.get('/leads'),
      API.get('/interior-projects'),
    ]).then(([eRes, lRes, pRes]) => {
      setEstimates(eRes.data);
      setLeads(lRes.data);
      setProjects(pRes.data);
    }).catch(() => toast('Failed to load', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { item_name: '', description: '', quantity: 1, unit: 'pcs', rate: 0, amount: 0, delivery_time: '' }],
    });
  };

  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx] = { ...items[idx], [field]: value };
    if (field === 'quantity' || field === 'rate') {
      items[idx].amount = (Number(items[idx].quantity) || 0) * (Number(items[idx].rate) || 0);
    }
    setForm({ ...form, items });
  };

  const removeItem = (idx) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/estimates', {
        ...form,
        items: form.items.map((i) => ({
          ...i,
          quantity: Number(i.quantity),
          rate: Number(i.rate),
          amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0),
        })),
        tax_percent: Number(form.tax_percent),
        discount: Number(form.discount),
      });
      toast('Estimate created');
      setModalOpen(false);
      setForm({ lead: '', project: '', full_name: '', mobile: '', email: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' });
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/estimates/${selected._id}`);
      toast('Estimate deleted');
      fetchData();
    } catch { toast('Error', 'error'); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => window.print(), 200);
  };

  useEffect(() => {
    const handleAfterPrint = () => setPrintMode(false);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const statusColors = {
    draft: 'bg-stone-50 text-stone-700 ring-1 ring-stone-200',
    sent: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    accepted: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    rejected: 'bg-red-50 text-red-700 ring-1 ring-red-200',
    expired: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  };

  const renderEstimateContent = (est) => (
    <div className="bg-white" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '210mm', margin: '0 auto', padding: '20mm 15mm' }}>
      <div className="flex items-start justify-between mb-6" style={{ borderBottom: '2px solid #1e293b', paddingBottom: '15px' }}>
        <div className="flex items-center gap-4">
          {est.company_logo && (
            <img src={est.company_logo} alt="Company Logo" style={{ maxHeight: '70px', width: 'auto', objectFit: 'contain' }} />
          )}
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>{est.tenantData?.company_name || est.tenantData?.company_name || 'Company Name'}</h1>
            {est.company_phone && (
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                <p style={{ margin: '2px 0' }}>+91 98991 46931 | 9891075835</p>
                <p style={{ margin: '2px 0' }}>{est.company_phone}</p>
              </div>
            )}
            {est.company_address && (
              <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', maxWidth: '300px' }}>{est.company_address}</p>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>ESTIMATE</h2>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>#{est.estimate_number}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '13px' }}>
        <div>
          <p style={{ fontWeight: 'bold', color: '#1e293b', margin: '0 0 4px 0' }}>
            {est.full_name || est.lead?.full_name || est.client?.full_name || 'N/A'}
          </p>
          {(est.mobile || est.lead?.mobile || est.client?.phone) && (
            <p style={{ color: '#64748b', margin: '2px 0' }}>M: {est.mobile || est.lead?.mobile || est.client?.phone}</p>
          )}
          {(est.email || est.lead?.email || est.client?.email) && (
            <p style={{ color: '#64748b', margin: '2px 0' }}>E: {est.email || est.lead?.email || est.client?.email}</p>
          )}
          {est.project && (
            <p style={{ color: '#64748b', margin: '2px 0' }}>Project: {est.project.title}</p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ color: '#64748b', margin: '2px 0' }}>Date: <strong style={{ color: '#1e293b' }}>{formatDate(est.createdAt)}</strong></p>
          {est.valid_until && (
            <p style={{ color: '#64748b', margin: '2px 0' }}>Valid Until: <strong style={{ color: '#1e293b' }}>{formatDate(est.valid_until)}</strong></p>
          )}
          <p style={{ color: '#64748b', margin: '2px 0' }}>Status: <strong style={{ color: '#1e293b', textTransform: 'capitalize' }}>{est.status}</strong></p>
        </div>
      </div>

      {est.instructions && (
        <div style={{ marginBottom: '15px', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Scope / Instructions</p>
          <p style={{ fontSize: '13px', color: '#334155', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{est.instructions}</p>
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '15px' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #1e293b' }}>#</th>
            <th style={{ padding: '10px 8px', textAlign: 'left', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #1e293b' }}>Item</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #1e293b' }}>Qty</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #1e293b' }}>Rate</th>
            <th style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#475569', fontSize: '11px', textTransform: 'uppercase', borderBottom: '2px solid #1e293b' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {est.items?.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '8px', color: '#64748b' }}>{idx + 1}</td>
              <td style={{ padding: '8px' }}>
                <p style={{ fontWeight: '600', color: '#1e293b', margin: 0 }}>{item.item_name}</p>
                {item.description && <p style={{ fontSize: '11px', color: '#64748b', margin: '2px 0 0 0' }}>{item.description}</p>}
              </td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#334155' }}>₹{(item.rate || 0).toLocaleString()}</td>
              <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#1e293b' }}>₹{(item.amount || 0).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: '#f8fafc' }}>
            <td colSpan={3} style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#475569', borderTop: '2px solid #e2e8f0' }}></td>
            <td style={{ padding: '8px', textAlign: 'right', fontWeight: '600', color: '#475569', borderTop: '2px solid #e2e8f0' }}>Subtotal</td>
            <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700', color: '#1e293b', borderTop: '2px solid #e2e8f0' }}>₹{(est.subtotal || 0).toLocaleString()}</td>
          </tr>
          {est.tax_percent > 0 && (
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={3}></td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#475569' }}>Tax ({est.tax_percent}%)</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#1e293b' }}>₹{(est.tax_amount || 0).toLocaleString()}</td>
            </tr>
          )}
          {est.discount > 0 && (
            <tr style={{ background: '#f8fafc' }}>
              <td colSpan={3}></td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#475569' }}>Discount</td>
              <td style={{ padding: '8px', textAlign: 'right', color: '#dc2626' }}>-₹{(est.discount || 0).toLocaleString()}</td>
            </tr>
          )}
          <tr style={{ background: '#f1f5f9' }}>
            <td colSpan={3}></td>
            <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '13px', borderTop: '2px solid #1e293b' }}>Grand Total</td>
            <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: '#1e293b', fontSize: '14px', borderTop: '2px solid #1e293b' }}>₹{(est.grand_total || 0).toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      {est.delivery_terms && (
        <div className="terms-section" style={{ fontSize: '12px', color: '#475569', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '15px' }}>
          <p style={{ fontWeight: 'bold', color: '#334155', margin: '0 0 4px 0' }}>Terms & Conditions:</p>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{est.delivery_terms}</p>
        </div>
      )}

      {est.notes && (
        <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '15px' }}>
          <p style={{ fontWeight: '600', color: '#475569', margin: '0 0 2px 0' }}>Notes:</p>
          <p style={{ margin: 0 }}>{est.notes}</p>
        </div>
      )}

      <div className="signature-section" style={{ marginTop: '30px', paddingTop: '15px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>Client Signature</p>
            <div style={{ width: '200px', height: '60px', border: '1px dashed #94a3b8', borderRadius: '4px', marginTop: '4px' }} />
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>Sign above</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px 0' }}>Created By</p>
            <p style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b', margin: 0 }}>
              {est.created_by_name || est.created_by?.full_name || est.processed_by?.full_name || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginTop: '20px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
        <p style={{ margin: '2px 0' }}>This is a computer-generated estimate &bull; Valid without signature</p>
      </div>
    </div>
  );

  useEffect(() => {
    if (!viewModalOpen && printMode) setPrintMode(false);
  }, [viewModalOpen, printMode]);

  return (
    <div className="space-y-6">
      <style>{`
        #estimate-print { display: none; }
        @media print {
          @page { size: A4 portrait; margin: 5mm; }
          body * { visibility: hidden; }
          #estimate-print, #estimate-print * { visibility: visible; }
          html, body { height: auto; overflow: visible; }
          #estimate-print {
            display: block !important;
            position: static !important;
            width: 100% !important; max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #estimate-print > div {
            padding: 5mm 8mm !important;
            max-width: none !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          table { page-break-inside: auto; width: 100% !important; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
          tfoot { display: table-footer-group; }
          #estimate-print .signature-section { page-break-inside: avoid; }
          #estimate-print .terms-section { page-break-inside: avoid; }
        }
      `}</style>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Estimates</h1>
          <p className="text-stone-500 mt-1">Create and manage project estimates with letterhead</p>
        </div>
        <button onClick={() => { setForm({ lead: '', project: '', full_name: '', mobile: '', email: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' }); setModalOpen(true); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlinePlus size={16} /> New Estimate</button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" /></div>
        ) : estimates.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <HiOutlineReceiptPercent size={40} className="mx-auto mb-3 text-stone-200" />
            <p>No estimates yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Lead / Client</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Project</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase">Created</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est) => (
                  <tr key={est._id} className="border-b border-stone-100 hover:bg-stone-50/50 cursor-pointer" onClick={() => { setSelected(est); setViewModalOpen(true); }}>
                    <td className="px-4 py-3 font-mono text-xs text-stone-500">{est.estimate_number}</td>
                    <td className="px-4 py-3 font-medium text-stone-900">{est.title || 'Untitled'}</td>
                    <td className="px-4 py-3 text-stone-700">{est.full_name || est.lead?.full_name || est.client?.full_name || '-'}</td>
                    <td className="px-4 py-3 text-stone-600">{est.project?.title || '-'}</td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-stone-900">₹{(est.grand_total || 0).toLocaleString()}</td>
                    <td className="px-4 py-3"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[est.status] || statusColors.draft}`}>{est.status?.charAt(0).toUpperCase() + est.status?.slice(1)}</span></td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(est.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => { setSelected(est); setForm({ lead: est.lead?._id || '', project: est.project?._id || '', full_name: est.full_name || est.lead?.full_name || '', mobile: est.mobile || est.lead?.mobile || '', email: est.email || est.lead?.email || '', title: est.title || '', instructions: est.instructions || '', delivery_terms: est.delivery_terms || '', valid_until: est.valid_until ? est.valid_until.split('T')[0] : '', items: est.items?.map((i) => ({ ...i })) || [], tax_percent: est.tax_percent || 0, discount: est.discount || 0, notes: est.notes || '' }); setModalOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"><HiOutlinePencilSquare size={15} /></button>
                      <button onClick={() => { setSelected(est); setConfirmOpen(true); }} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all"><HiOutlineTrash size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setSelected(null); setForm({ lead: '', project: '', full_name: '', mobile: '', email: '', title: '', instructions: '', delivery_terms: '', valid_until: '', items: [], tax_percent: 0, discount: 0, notes: '' }); }} title={selected ? 'Edit Estimate' : 'New Estimate'} size="xl">
        <form onSubmit={selected ? async (e) => {
          e.preventDefault();
          try {
            await API.put(`/estimates/${selected._id}`, {
              ...form,
              items: form.items.map((i) => ({ ...i, quantity: Number(i.quantity), rate: Number(i.rate), amount: (Number(i.quantity) || 0) * (Number(i.rate) || 0) })),
              tax_percent: Number(form.tax_percent),
              discount: Number(form.discount),
            });
            toast('Estimate updated');
            setModalOpen(false);
            setSelected(null);
            fetchData();
          } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
        } : handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Title</label><input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Kitchen Renovation Estimate" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Valid Until</label><input type="date" className={inputClass} value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Lead</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.lead} onChange={(e) => {
                const leadId = e.target.value;
                const lead = leadsMap[leadId];
                setForm({ ...form, lead: leadId, full_name: lead?.full_name || '', mobile: lead?.mobile || '', email: lead?.email || '' });
              }}>
                <option value="">Select lead</option>
                {leads.map((l) => <option key={l._id} value={l._id}>{l.full_name} {l.mobile ? `(${l.mobile})` : ''}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Project</label>
              <select className={`${inputClass} appearance-none cursor-pointer`} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                <option value="">Select project</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.title} ({p.flat_id || p.project_code || '-'})</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Full Name</label><input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Auto-filled from lead" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Mobile</label><input className={inputClass} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} placeholder="Auto-filled from lead" /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Email</label><input className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Auto-filled from lead" /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Instructions / Scope</label><textarea className={inputClass} rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="Describe what will be delivered..." /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Delivery Terms</label><textarea className={inputClass} rows={2} value={form.delivery_terms} onChange={(e) => setForm({ ...form, delivery_terms: e.target.value })} placeholder="Payment terms, delivery timeline..." /></div>

          <div className="border-t border-stone-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-stone-700">Items</h4>
              <button type="button" onClick={addItem} className="text-sm text-stone-600 hover:text-stone-900 font-semibold flex items-center gap-1 cursor-pointer"><HiOutlinePlus size={14} /> Add Item</button>
            </div>
            {form.items.length === 0 ? (
              <p className="text-sm text-stone-400 text-center py-6">No items added. Click "Add Item" to add materials/services.</p>
            ) : (
              <div className="space-y-3">
                {form.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-50 border border-stone-200">
                    <div className="flex gap-3 items-start">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-3 gap-2">
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Item Name</label><input className={`${inputClass} text-xs`} value={item.item_name} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} placeholder="Item name" /></div>
                          <div className="col-span-2"><label className="block text-xs font-medium text-stone-500 mb-0.5">Description</label><input className={`${inputClass} text-xs`} value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Optional description" /></div>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Qty</label><input type="number" min="1" className={`${inputClass} text-xs`} value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Unit</label><input className={`${inputClass} text-xs`} value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Rate (₹)</label><input type="number" min="0" className={`${inputClass} text-xs`} value={item.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Amount</label><input className={`${inputClass} text-xs bg-stone-100`} value={item.amount} readOnly /></div>
                          <div><label className="block text-xs font-medium text-stone-500 mb-0.5">Delivery</label><input className={`${inputClass} text-xs`} value={item.delivery_time} onChange={(e) => updateItem(idx, 'delivery_time', e.target.value)} placeholder="e.g. 2 weeks" /></div>
                        </div>
                      </div>
                      <button type="button" onClick={() => removeItem(idx)} className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-all mt-5"><HiOutlineTrash size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 border-t border-stone-200 pt-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tax %</label><input type="number" min="0" step="0.01" className={inputClass} value={form.tax_percent} onChange={(e) => setForm({ ...form, tax_percent: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Discount (₹)</label><input type="number" min="0" step="0.01" className={inputClass} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><input className={inputClass} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setModalOpen(false); setSelected(null); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold ... bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold ... border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create Estimate'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={viewModalOpen} onClose={() => setViewModalOpen(false)} title="Estimate" size="2xl">
        {selected && (
          <div>
            {renderEstimateContent(selected)}
            <div className="no-print" style={{ textAlign: 'center', marginTop: '20px' }}>
              <button onClick={handlePrint} style={{ padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', border: 'none', background: '#1e293b', color: 'white', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlinePrinter size={16} /> Print / PDF
              </button>
            </div>
          </div>
        )}
      </Modal>

      {printMode && selected && <div id="estimate-print">{renderEstimateContent(selected)}</div>}

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Estimate" message="Are you sure?" />
    </div>
  );
}
