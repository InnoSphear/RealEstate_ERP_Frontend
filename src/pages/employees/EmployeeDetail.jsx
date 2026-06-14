import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlineArrowUpTray, HiOutlineDocumentText } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [commissionTotals, setCommissionTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [docModal, setDocModal] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docName, setDocName] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`/employees/${id}`),
      API.get(`/attendance/employee/${id}?month=${month}`),
      API.get(`/leaves/employee/${id}`),
      API.get(`/commissions/employee/${id}`),
    ]).then(([eRes, aRes, lRes, cRes]) => {
      setEmployee(eRes.data);
      setAttendance(Array.isArray(aRes.data) ? aRes.data : []);
      setLeaves(Array.isArray(lRes.data) ? lRes.data : []);
      setCommissions(Array.isArray(cRes.data.commissions) ? cRes.data.commissions : []);
      setCommissionTotals(Array.isArray(cRes.data.totals) ? cRes.data.totals : []);
    }).catch(() => toast('Failed to load employee details', 'error')).finally(() => setLoading(false));
  }, [id, month]);

  const handleDocUpload = async (e) => {
    e.preventDefault();
    if (!docFile) return;
    const fd = new FormData();
    fd.append('document', docFile);
    fd.append('name', docName);
    try {
      await API.post(`/employees/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast('Document uploaded');
      setDocModal(false);
      setDocFile(null);
      setDocName('');
      const { data } = await API.get(`/employees/${id}`);
      setEmployee(data);
    } catch (err) { toast(err.response?.data?.message || 'Upload failed', 'error'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!employee) return <p className="text-stone-500">Employee not found</p>;

  const presentDays = attendance.filter((a) => a.status === 'present').length;
  const totalDays = attendance.length;
  const avgHours = totalDays > 0 ? (attendance.reduce((s, a) => {
    if (a.check_in && a.check_out) {
      const diff = (new Date(a.check_out) - new Date(a.check_in)) / (1000 * 60 * 60);
      return s + diff;
    }
    return s;
  }, 0) / totalDays).toFixed(1) : '0';

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  return (
    <div className="space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors">
        <HiOutlineArrowLeft size={16} /> Back
      </button>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {employee.photo ? (
              <img src={employee.photo} alt="" className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">N/A</div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-stone-900">{employee.full_name}</h1>
              <p className="text-stone-500 mt-1">{employee.employee_id} &middot; {employee.department} &middot; {employee.designation}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${employee.is_active ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>{employee.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Personal & Bank Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Email</label><p className="text-sm text-stone-700 mt-1">{employee.email || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Mobile</label><p className="text-sm text-stone-700 mt-1">{employee.mobile || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Alternate Mobile</label><p className="text-sm text-stone-700 mt-1">{employee.alternate_mobile || '-'}</p></div>
          <div className="sm:col-span-2"><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Address</label><p className="text-sm text-stone-700 mt-1">{employee.address || '-'}{employee.city ? `, ${employee.city}` : ''}{employee.state ? `, ${employee.state}` : ''}{employee.pincode ? ` - ${employee.pincode}` : ''}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Joining Date</label><p className="text-sm text-stone-700 mt-1">{employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Salary</label><p className="text-sm text-stone-700 mt-1">{employee.salary ? `₹${Number(employee.salary).toLocaleString()}` : '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Employee Type</label><p className="text-sm text-stone-700 mt-1">{employee.employee_type || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Bank Name</label><p className="text-sm text-stone-700 mt-1">{employee.bank_name || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Bank Account</label><p className="text-sm text-stone-700 mt-1">{employee.bank_account_no || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Bank IFSC</label><p className="text-sm text-stone-700 mt-1">{employee.bank_ifsc || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">PAN Number</label><p className="text-sm text-stone-700 mt-1">{employee.pan_number || '-'}</p></div>
          <div><label className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Aadhar Number</label><p className="text-sm text-stone-700 mt-1">{employee.aadhar_number || '-'}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-stone-900">Documents</h3>
          <button onClick={() => setDocModal(true)} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineArrowUpTray size={15} /> Upload</button>
        </div>
        {employee.documents && employee.documents.length > 0 ? (
          <div className="space-y-2">
            {employee.documents.map((doc, i) => (
              <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 hover:bg-stone-100 transition-colors text-sm text-stone-700">
                <HiOutlineDocumentText size={18} className="text-stone-400" />
                <span className="flex-1">{doc.name || doc.filename || 'Document'}</span>
                <span className="text-stone-400 text-xs">Download</span>
              </a>
            ))}
          </div>
        ) : <p className="text-sm text-stone-400">No documents uploaded</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-stone-900">Attendance Summary</h3>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 text-center"><p className="text-2xl font-bold text-emerald-700">{presentDays}</p><p className="text-xs text-emerald-600 font-medium mt-1">Present</p></div>
            <div className="p-4 rounded-xl bg-stone-50 text-center"><p className="text-2xl font-bold text-stone-700">{totalDays}</p><p className="text-xs text-stone-600 font-medium mt-1">Total</p></div>
            <div className="p-4 rounded-xl bg-blue-50 text-center"><p className="text-2xl font-bold text-blue-700">{avgHours}h</p><p className="text-xs text-blue-600 font-medium mt-1">Avg Hours</p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Leave Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-amber-50 text-center"><p className="text-2xl font-bold text-amber-700">{leaves.filter((l) => l.status === 'pending').length}</p><p className="text-xs text-amber-600 font-medium mt-1">Pending</p></div>
            <div className="p-4 rounded-xl bg-emerald-50 text-center"><p className="text-2xl font-bold text-emerald-700">{leaves.filter((l) => l.status === 'approved').length}</p><p className="text-xs text-emerald-600 font-medium mt-1">Approved</p></div>
            <div className="p-4 rounded-xl bg-red-50 text-center"><p className="text-2xl font-bold text-red-700">{leaves.filter((l) => l.status === 'rejected').length}</p><p className="text-xs text-red-600 font-medium mt-1">Rejected</p></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
        <h3 className="text-base font-semibold text-stone-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-stone-50"><p className="text-lg font-bold text-stone-900">{presentDays}/{totalDays}</p><p className="text-xs text-stone-500 mt-1">Attendance Rate</p></div>
          <div className="p-4 rounded-xl bg-stone-50"><p className="text-lg font-bold text-stone-900">{avgHours}h</p><p className="text-xs text-stone-500 mt-1">Avg Work Hours</p></div>
          <div className="p-4 rounded-xl bg-stone-50"><p className="text-lg font-bold text-stone-900">{leaves.length}</p><p className="text-xs text-stone-500 mt-1">Total Leaves</p></div>
          <div className="p-4 rounded-xl bg-stone-50"><p className="text-lg font-bold text-stone-900">{totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0}%</p><p className="text-xs text-stone-500 mt-1">Attendance %</p></div>
        </div>
      </div>

      {commissions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow overflow-hidden p-6 sm:p-8">
          <h3 className="text-base font-semibold text-stone-900 mb-4">Commission Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {['pending', 'approved', 'paid', 'cancelled'].map((s) => {
              const t = commissionTotals.find((x) => x._id === s);
              return (
                <div key={s} className="p-4 rounded-xl bg-stone-50">
                  <p className="text-lg font-bold text-stone-900 capitalize">{t ? `₹${t.total.toLocaleString()}` : '₹0'}</p>
                  <p className="text-xs text-stone-500 mt-1 capitalize">{s} ({t?.count || 0})</p>
                </div>
              );
            })}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 bg-stone-50/50">
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Source</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody>
                {commissions.slice(0, 10).map((c) => (
                  <tr key={c._id} className="border-b border-stone-100 hover:bg-stone-50/50 transition-colors">
                    <td className="px-4 py-3 text-stone-700 font-medium">₹{(c.commission_amount || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-stone-700 capitalize">{c.source}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-50 text-stone-700 ring-1 ring-stone-200">{c.status}</span></td>
                    <td className="px-4 py-3 text-stone-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={docModal} onClose={() => setDocModal(false)} title="Upload Document">
        <form onSubmit={handleDocUpload} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Document Name</label><input className={inputClass} value={docName} onChange={(e) => setDocName(e.target.value)} required /></div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">File</label><input type="file" className={inputClass} onChange={(e) => setDocFile(e.target.files[0])} required /></div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setDocModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Upload</button></div>
        </form>
      </Modal>
    </div>
  );
}
