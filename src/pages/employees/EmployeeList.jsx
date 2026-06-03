import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const departmentOptions = ['telecalling', 'sales', 'accounts', 'agent', 'reception', 'management', 'it'];
const employeeTypeOptions = ['telecaller', 'sales', 'accounts', 'agent', 'reception'];

const statusColors = {
  true: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  false: 'bg-red-50 text-red-700 ring-1 ring-red-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const initialForm = {
  full_name: '', email: '', mobile: '', alternate_mobile: '', address: '', city: '', state: '', pincode: '',
  joining_date: '', department: '', designation: '', employee_type: '',
  salary: '', bank_name: '', bank_account_no: '', bank_ifsc: '', pan_number: '', aadhar_number: '',
};

export default function EmployeeList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState(initialForm);

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterDept) params.append('department', filterDept);
    if (filterType) params.append('employee_type', filterType);
    if (filterStatus !== '') params.append('is_active', filterStatus);
    const qs = params.toString();
    API.get(`/employees${qs ? `?${qs}` : ''}`).then((res) => setData(res.data)).catch(() => toast('Failed to load employees', 'error')).finally(() => setLoading(false));
  };
  useEffect(() => { fetchData(); }, [filterDept, filterType, filterStatus]);

  const openCreate = () => {
    setSelected(null);
    setForm({ ...initialForm, employee_id: `EMP${String(Date.now()).slice(-6)}` });
    setPhotoFile(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      employee_id: row.employee_id || '',
      full_name: row.full_name || '',
      email: row.email || '',
      mobile: row.mobile || '',
      alternate_mobile: row.alternate_mobile || '',
      address: row.address || '',
      city: row.city || '',
      state: row.state || '',
      pincode: row.pincode || '',
      joining_date: row.joining_date ? row.joining_date.split('T')[0] : '',
      department: row.department || '',
      designation: row.designation || '',
      employee_type: row.employee_type || '',
      salary: row.salary || '',
      bank_name: row.bank_name || '',
      bank_account_no: row.bank_account_no || '',
      bank_ifsc: row.bank_ifsc || '',
      pan_number: row.pan_number || '',
      aadhar_number: row.aadhar_number || '',
    });
    setPhotoFile(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photoFile) fd.append('photo', photoFile);
    if (selected) fd.append('_id', selected._id);
    try {
      if (selected) {
        await API.put(`/employees/${selected._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast('Employee updated');
      } else {
        await API.post('/employees', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast('Employee created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error saving employee', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/employees/${selected._id}`); toast('Employee deleted'); fetchData(); } catch (err) { toast('Error deleting employee', 'error'); }
  };

  const columns = [
    { header: 'ID', accessor: 'employee_id' },
    { header: 'Photo', render: (r) => r.photo ? <img src={r.photo} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 text-xs">N/A</div> },
    { header: 'Name', accessor: 'full_name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Mobile', accessor: 'mobile' },
    { header: 'Department', accessor: 'department' },
    { header: 'Designation', accessor: 'designation' },
    { header: 'Type', accessor: 'employee_type' },
    { header: 'Status', render: (r) => <span className={statusColors[r.is_active]}>{r.is_active ? 'Active' : 'Inactive'}</span> },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";
  const labelClass = "block text-sm font-semibold text-stone-700 mb-1.5";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight">Employees</h1><p className="text-stone-500 mt-1">Manage your workforce</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">+ Add Employee</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Departments</option>
          {departmentOptions.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Types</option>
          {employeeTypeOptions.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer">
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} onEdit={openEdit} onDelete={(r) => { setSelected(r); setConfirmOpen(true); }} onView={(r) => navigate(`/employees/${r._id}`)} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Employee' : 'Create Employee'} size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className={labelClass}>Employee ID</label><input className={inputClass} value={form.employee_id} onChange={(e) => setForm({ ...form, employee_id: e.target.value })} /></div>
            <div><label className={labelClass}>Full Name *</label><input className={inputClass} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div><label className={labelClass}>Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className={labelClass}>Mobile *</label><input className={inputClass} value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required /></div>
            <div><label className={labelClass}>Alternate Mobile</label><input className={inputClass} value={form.alternate_mobile} onChange={(e) => setForm({ ...form, alternate_mobile: e.target.value })} /></div>
            <div><label className={labelClass}>Joining Date</label><input type="date" className={inputClass} value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} /></div>
            <div><label className={labelClass}>Department *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required><option value="">Select</option>{departmentOptions.map((d) => <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>)}</select></div>
            <div><label className={labelClass}>Designation</label><input className={inputClass} value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} /></div>
            <div><label className={labelClass}>Employee Type *</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.employee_type} onChange={(e) => setForm({ ...form, employee_type: e.target.value })} required><option value="">Select</option>{employeeTypeOptions.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
            <div className="sm:col-span-2"><label className={labelClass}>Address</label><input className={inputClass} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className={labelClass}>City</label><input className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
            <div><label className={labelClass}>State</label><input className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
            <div><label className={labelClass}>Pincode</label><input className={inputClass} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
            <div><label className={labelClass}>Salary</label><input type="number" className={inputClass} value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} /></div>
            <div><label className={labelClass}>Bank Name</label><input className={inputClass} value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
            <div><label className={labelClass}>Bank Account No</label><input className={inputClass} value={form.bank_account_no} onChange={(e) => setForm({ ...form, bank_account_no: e.target.value })} /></div>
            <div><label className={labelClass}>Bank IFSC</label><input className={inputClass} value={form.bank_ifsc} onChange={(e) => setForm({ ...form, bank_ifsc: e.target.value })} /></div>
            <div><label className={labelClass}>PAN Number</label><input className={inputClass} value={form.pan_number} onChange={(e) => setForm({ ...form, pan_number: e.target.value })} /></div>
            <div><label className={labelClass}>Aadhar Number</label><input className={inputClass} value={form.aadhar_number} onChange={(e) => setForm({ ...form, aadhar_number: e.target.value })} /></div>
            <div><label className={labelClass}>Photo</label><input type="file" accept="image/*" className={inputClass} onChange={(e) => setPhotoFile(e.target.files[0])} /></div>
          </div>
          <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button><button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Employee" message="Are you sure you want to delete this employee?" />
    </div>
  );
}
