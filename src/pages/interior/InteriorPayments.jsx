import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import logo from '../../assets/logo.jpeg';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate().toString().padStart(2, '0');
  return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function InteriorPayments() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewPayment, setViewPayment] = useState(null);
  const [billView, setBillView] = useState(false);
  const billRef = useRef(null);
  const [filterProject, setFilterProject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const downloadBillPdf = async () => {
    if (!billRef.current) return;
    try {
      const canvas = await html2canvas(billRef.current, { scale: 2, useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Interior_Receipt_${viewPayment?._id?.slice(-6) || 'payment'}.pdf`);
    } catch {
      toast('Failed to generate PDF', 'error');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterProject) params.append('project_id', filterProject);
      if (dateFrom) params.append('from_date', dateFrom);
      if (dateTo) params.append('to_date', dateTo);
      const qs = params.toString();
      const [pRes, projRes] = await Promise.all([
        API.get(`/interior-projects/payments/all${qs ? `?${qs}` : ''}`),
        API.get('/interior-projects'),
      ]);
      setData(pRes.data);
      setProjects(projRes.data);
    } catch { toast('Failed to load', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filterProject, dateFrom, dateTo]);

  const columns = [
    { header: 'Project', render: (r) => (
      <span className="text-stone-900 font-medium cursor-pointer hover:underline" onClick={() => navigate(`/interior-projects/${r.project_id}`)}>{r.project_title}</span>
    )},
    { header: 'Flat ID', render: (r) => r.flat_id || '-' },
    { header: 'Client', render: (r) => r.client?.full_name || '-' },
    { header: 'Amount', render: (r) => r.amount ? `₹${r.amount.toLocaleString()}` : '-' },
    { header: 'Date', render: (r) => r.payment_date ? formatDate(r.payment_date) : '-' },
    { header: 'Mode', render: (r) => <span className="bg-stone-50 text-stone-700 ring-1 ring-stone-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize">{r.payment_mode?.replace(/_/g, ' ')}</span> },
    { header: 'Txn ID', render: (r) => r.transaction_id || '-' },
    { header: 'Received By', render: (r) => r.payment_receiver_name || r.received_by?.full_name || '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Interior Payments</h1><p className="text-stone-500 mt-1">All payments received across interior projects</p></div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title} - {p.flat_id || p.project_code || ''}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors" />
      </div>

      <DataTable columns={columns} data={data} loading={loading} onView={(r) => { setViewPayment(r); setViewModalOpen(true); }} />

      <Modal isOpen={viewModalOpen} onClose={() => { setViewModalOpen(false); setBillView(false); }} title={billView ? 'Payment Receipt' : `Payment Details`} size="lg">
        {viewPayment && !billView && (
          <div className="space-y-6">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setBillView(true)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                View Receipt
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Project</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.project_title || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Client</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.client?.full_name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Flat</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.flat_id || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Amount</p><p className="text-sm font-medium text-stone-900 mt-1">₹{viewPayment.amount?.toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Date</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_date ? formatDate(viewPayment.payment_date) : '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Mode</p><p className="text-sm font-medium text-stone-900 mt-1 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ')}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Transaction ID</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.transaction_id || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Received By</p><p className="text-sm font-medium text-stone-900 mt-1">{viewPayment.payment_receiver_name || viewPayment.received_by?.full_name || '-'}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Contract Amount</p><p className="text-sm font-medium text-stone-900 mt-1">₹{(viewPayment.contract_amount || 0).toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Received</p><p className="text-sm font-medium text-stone-900 mt-1">₹{(viewPayment.received_amount || 0).toLocaleString()}</p></div>
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Balance</p><p className={`text-sm font-medium mt-1 ${(viewPayment.balance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>₹{(viewPayment.balance || 0).toLocaleString()}</p></div>
            </div>
            {viewPayment.notes && (
              <div><p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Notes</p><p className="text-sm text-stone-700 bg-stone-50 rounded-xl px-4 py-3">{viewPayment.notes}</p></div>
            )}
          </div>
        )}
        {viewPayment && billView && (
          <div className="space-y-6" id="interior-payment-bill">
            <div className="flex gap-2 mb-2">
              <button onClick={() => setBillView(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors">
                ← Back to Details
              </button>
              <button onClick={downloadBillPdf} className="px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors">
                <HiOutlineArrowDownTray size={14} /> Download PDF
              </button>
            </div>
            <div ref={billRef} className="border border-stone-200 rounded-2xl p-8 bg-white">
              <div className="flex items-center gap-4 border-b border-stone-200 pb-6 mb-6">
                <img src={logo} alt="Shivan International" className="w-16 h-16 rounded-xl object-cover" />
                <div>
                  <h2 className="text-xl font-bold text-stone-900">Shivan International</h2>
                  <p className="text-xs text-stone-500">Real Estate & Interior Solutions</p>
                </div>
                <div className="ml-auto text-right">
                  <h3 className="text-lg font-bold text-stone-900">PAYMENT RECEIPT</h3>
                  <p className="text-xs text-stone-400">Interior Project Payment</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                  <p className="text-stone-400 text-xs">Project</p>
                  <p className="font-semibold text-stone-900">{viewPayment.project_title || '-'}</p>
                  <p className="text-stone-400 text-xs mt-2">Flat</p>
                  <p className="font-semibold text-stone-900">{viewPayment.flat_id || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-400 text-xs">Date</p>
                  <p className="font-semibold text-stone-900">{viewPayment.payment_date ? new Date(viewPayment.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}</p>
                  <p className="text-stone-400 text-xs mt-2">Payment Mode</p>
                  <p className="font-semibold text-stone-900 capitalize">{viewPayment.payment_mode?.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="border-t border-stone-100 pt-4 mb-4">
                <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Received From</h3>
                <p className="text-base font-bold text-stone-900">{viewPayment.client?.full_name || '-'}</p>
                {viewPayment.client?.phone && <p className="text-sm text-stone-500">{viewPayment.client.phone}</p>}
              </div>
              <table className="w-full text-sm mb-6">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-2 text-stone-400 font-semibold text-xs uppercase">Description</th>
                    <th className="text-right py-2 text-stone-400 font-semibold text-xs uppercase">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-stone-100">
                    <td className="py-3 text-stone-700">Interior Work Payment</td>
                    <td className="py-3 text-right font-semibold text-stone-900">{viewPayment.amount?.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="py-3 text-sm font-bold text-stone-900">Total Amount</td>
                    <td className="py-3 text-right text-base font-bold text-stone-900">₹{(viewPayment.amount || 0).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                <div className="p-3 rounded-xl bg-stone-50 text-center">
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Contract</p>
                  <p className="text-base font-bold text-stone-900">₹{(viewPayment.contract_amount || 0).toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 text-center">
                  <p className="text-xs text-blue-600 uppercase tracking-wider">Total Received</p>
                  <p className="text-base font-bold text-blue-700">₹{(viewPayment.received_amount || 0).toLocaleString()}</p>
                </div>
                <div className={`p-3 rounded-xl text-center ${(viewPayment.balance || 0) > 0 ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                  <p className={`text-xs uppercase tracking-wider ${(viewPayment.balance || 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>Balance</p>
                  <p className={`text-base font-bold ${(viewPayment.balance || 0) > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>₹{(viewPayment.balance || 0).toLocaleString()}</p>
                </div>
              </div>
              {viewPayment.transaction_id && (
                <div className="text-xs text-stone-400 border-t border-stone-100 pt-4">
                  <p>Transaction ID: {viewPayment.transaction_id}</p>
                </div>
              )}
              <div className="text-center text-xs text-stone-400 mt-6 pt-4 border-t border-stone-100">
                <p>This is a computer-generated receipt</p>
                <p>Processed by: {viewPayment.payment_receiver_name || viewPayment.received_by?.full_name || 'System'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

