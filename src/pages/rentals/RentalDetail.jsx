import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlinePrinter, HiOutlineUser, HiOutlineBuildingOffice2 } from 'react-icons/hi2';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import { toast } from '../../components/Toast';

const statusColors = {
  vacant: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  occupied: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  under_maintenance: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

export default function RentalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rental, setRental] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [form, setForm] = useState({});

  const fetchRental = () => {
    setLoading(true);
    API.get(`/rental-apartments/${id}`)
      .then((res) => {
        setRental(res.data);
        setForm({
          unit_number: res.data.unit_number || '',
          building_name: res.data.building_name || '',
          floor: res.data.floor || '',
          bedrooms: res.data.bedrooms || 0,
          bathrooms: res.data.bathrooms || 0,
          area_sqft: res.data.area_sqft || '',
          rent_amount: res.data.rent_amount || '',
          security_deposit: res.data.security_deposit || '',
          maintenance_charge: res.data.maintenance_charge || '',
          furnishing: res.data.furnishing || 'unfurnished',
          status: res.data.status || 'vacant',
          owner: res.data.owner || { name: '', contact: '', email: '', address: '' },
          tenant_info: res.data.tenant_info || { name: '', contact: '', email: '', aadhar: '', move_in_date: '', move_out_date: '', emergency_contact: '' },
          rental_start_date: res.data.rental_start_date ? res.data.rental_start_date.split('T')[0] : '',
          rental_end_date: res.data.rental_end_date ? res.data.rental_end_date.split('T')[0] : '',
          agreement_period_months: res.data.agreement_period_months || 11,
          rent_due_day: res.data.rent_due_day || 5,
          notice_period_days: res.data.notice_period_days || 30,
          amenities: res.data.amenities || [],
          notes: res.data.notes || '',
        });
      })
      .catch(() => toast('Failed to load rental', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchRental(); }, [id]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        rent_amount: Number(form.rent_amount),
        security_deposit: Number(form.security_deposit),
        maintenance_charge: Number(form.maintenance_charge),
        area_sqft: form.area_sqft ? Number(form.area_sqft) : undefined,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        agreement_period_months: Number(form.agreement_period_months),
        rent_due_day: Number(form.rent_due_day),
        notice_period_days: Number(form.notice_period_days),
      };
      await API.put(`/rental-apartments/${id}`, payload);
      toast('Rental updated');
      setEditModalOpen(false);
      fetchRental();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handlePrint = () => {
    window.open(`/api/rental-apartments/${id}/print`, '_blank');
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="text-center py-20 text-stone-500">
        <p>Rental not found</p>
        <button onClick={() => navigate('/rental-apartments')} className="mt-4 text-sm text-stone-900 underline">Back to rentals</button>
      </div>
    );
  }

  const SummaryCard = ({ label, value, icon: Icon }) => (
    <div className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-3">
      {Icon && <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-500"><Icon size={20} /></div>}
      <div>
        <p className="text-xs text-stone-400">{label}</p>
        <p className="text-sm font-semibold text-stone-900 mt-0.5">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/rental-apartments')} className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all">
            <HiOutlineArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Unit {rental.unit_number}</h1>
              <span className={statusColors[rental.status] || statusColors.vacant}>{rental.status?.replace('_', ' ')}</span>
            </div>
            <p className="text-stone-500 mt-1">{rental.building_name || 'No building'} {rental.floor ? `- Floor ${rental.floor}` : ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">
            <HiOutlinePrinter size={15} /> Print
          </button>
          <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
            <HiOutlinePencilSquare size={16} /> Edit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="Rent Amount" value={`₹${Number(rental.rent_amount).toLocaleString()}/mo`} />
        <SummaryCard label="Security Deposit" value={`₹${Number(rental.security_deposit).toLocaleString()}`} />
        <SummaryCard label="Bedrooms / Bathrooms" value={`${rental.bedrooms}B / ${rental.bathrooms}Ba`} />
        <SummaryCard label="Area" value={rental.area_sqft ? `${rental.area_sqft} sqft` : '-'} />
        <SummaryCard label="Furnishing" value={rental.furnishing?.replace('_', ' ')} />
        <SummaryCard label="Maintenance" value={rental.maintenance_charge ? `₹${Number(rental.maintenance_charge).toLocaleString()}` : '-'} />
        <SummaryCard label="Rent Due Day" value={`Day ${rental.rent_due_day || 5}`} />
        <SummaryCard label="Agreement Period" value={`${rental.agreement_period_months || 11} months`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineBuildingOffice2 size={18} className="text-stone-500" />
            <h3 className="text-base font-semibold text-stone-900">Owner Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-stone-500">Name</span><span className="text-sm font-medium text-stone-900">{rental.owner?.name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-stone-500">Contact</span><span className="text-sm font-medium text-stone-900">{rental.owner?.contact || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-stone-500">Email</span><span className="text-sm font-medium text-stone-900">{rental.owner?.email || '-'}</span></div>
            <div className="flex justify-between"><span className="text-sm text-stone-500">Address</span><span className="text-sm font-medium text-stone-900">{rental.owner?.address || '-'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineUser size={18} className="text-stone-500" />
            <h3 className="text-base font-semibold text-stone-900">Tenant Details</h3>
          </div>
          {rental.tenant_info?.name ? (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm text-stone-500">Name</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-500">Contact</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.contact || '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-500">Email</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.email || '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-500">Aadhar</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.aadhar || '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-500">Move-in Date</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.move_in_date ? formatDate(rental.tenant_info.move_in_date) : '-'}</span></div>
              <div className="flex justify-between"><span className="text-sm text-stone-500">Emergency Contact</span><span className="text-sm font-medium text-stone-900">{rental.tenant_info.emergency_contact || '-'}</span></div>
            </div>
          ) : (
            <p className="text-sm text-stone-400 py-4 text-center">Unit is vacant</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5">
        <h3 className="text-base font-semibold text-stone-900 mb-3">Rental Period</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div><p className="text-xs text-stone-400 font-semibold uppercase">Start Date</p><p className="text-sm text-stone-900 mt-1">{rental.rental_start_date ? formatDate(rental.rental_start_date) : '-'}</p></div>
          <div><p className="text-xs text-stone-400 font-semibold uppercase">End Date</p><p className="text-sm text-stone-900 mt-1">{rental.rental_end_date ? formatDate(rental.rental_end_date) : '-'}</p></div>
          <div><p className="text-xs text-stone-400 font-semibold uppercase">Notice Period</p><p className="text-sm text-stone-900 mt-1">{rental.notice_period_days} days</p></div>
        </div>
      </div>

      {rental.amenities?.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="text-base font-semibold text-stone-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {rental.amenities.map((a, i) => (
              <span key={i} className="px-3 py-1.5 rounded-xl bg-stone-50 text-stone-600 text-xs font-medium">{a}</span>
            ))}
          </div>
        </div>
      )}

      {rental.notes && (
        <div className="bg-white rounded-2xl border border-stone-200 p-5">
          <h3 className="text-base font-semibold text-stone-900 mb-2">Notes</h3>
          <p className="text-sm text-stone-700 whitespace-pre-wrap">{rental.notes}</p>
        </div>
      )}

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Rental" size="xl">
        <form onSubmit={handleSave} className="space-y-5">
          <h4 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2">Unit Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Unit Number *</label><input className={inputClass} value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Building Name</label><input className={inputClass} value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Floor</label><input className={inputClass} value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Bedrooms</label><input type="number" className={inputClass} value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Bathrooms</label><input type="number" className={inputClass} value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Area (sqft)</label><input type="number" className={inputClass} value={form.area_sqft} onChange={(e) => setForm({ ...form, area_sqft: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Rent Amount *</label><input type="number" className={inputClass} value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Security Deposit</label><input type="number" className={inputClass} value={form.security_deposit} onChange={(e) => setForm({ ...form, security_deposit: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Maintenance Charge</label><input type="number" className={inputClass} value={form.maintenance_charge} onChange={(e) => setForm({ ...form, maintenance_charge: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Furnishing</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.furnishing} onChange={(e) => setForm({ ...form, furnishing: e.target.value })}>
              {['fully_furnished', 'semi_furnished', 'unfurnished'].map((f) => <option key={f} value={f}>{f.replace('_', ' ')}</option>)}
            </select></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Status</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {['vacant', 'occupied', 'under_maintenance'].map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select></div>
          </div>
          <h4 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2 pt-2">Owner Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Owner Name *</label><input className={inputClass} value={form.owner.name} onChange={(e) => setForm({ ...form, owner: { ...form.owner, name: e.target.value } })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Owner Contact *</label><input className={inputClass} value={form.owner.contact} onChange={(e) => setForm({ ...form, owner: { ...form.owner, contact: e.target.value } })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Owner Email</label><input type="email" className={inputClass} value={form.owner.email} onChange={(e) => setForm({ ...form, owner: { ...form.owner, email: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Owner Address</label><input className={inputClass} value={form.owner.address} onChange={(e) => setForm({ ...form, owner: { ...form.owner, address: e.target.value } })} /></div>
          </div>
          <h4 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2 pt-2">Tenant Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tenant Name</label><input className={inputClass} value={form.tenant_info.name} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, name: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tenant Contact</label><input className={inputClass} value={form.tenant_info.contact} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, contact: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Tenant Email</label><input type="email" className={inputClass} value={form.tenant_info.email} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, email: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Aadhar Number</label><input className={inputClass} value={form.tenant_info.aadhar} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, aadhar: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Move-in Date</label><input type="date" className={inputClass} value={form.tenant_info.move_in_date} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, move_in_date: e.target.value } })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Emergency Contact</label><input className={inputClass} value={form.tenant_info.emergency_contact} onChange={(e) => setForm({ ...form, tenant_info: { ...form.tenant_info, emergency_contact: e.target.value } })} /></div>
          </div>
          <h4 className="text-sm font-semibold text-stone-800 border-b border-stone-100 pb-2 pt-2">Agreement Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Rental Start Date</label><input type="date" className={inputClass} value={form.rental_start_date} onChange={(e) => setForm({ ...form, rental_start_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Rental End Date</label><input type="date" className={inputClass} value={form.rental_end_date} onChange={(e) => setForm({ ...form, rental_end_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Rent Due Day</label><input type="number" min={1} max={31} className={inputClass} value={form.rent_due_day} onChange={(e) => setForm({ ...form, rent_due_day: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notice Period (days)</label><input type="number" className={inputClass} value={form.notice_period_days} onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">Save Changes</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}