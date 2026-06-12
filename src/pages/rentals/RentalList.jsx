import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowDownTray } from 'react-icons/hi2';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const statusColors = {
  vacant: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  occupied: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  under_maintenance: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
};

const initForm = {
  unit_number: '', building_name: '', floor: '', bedrooms: 0, bathrooms: 0,
  area_sqft: '', rent_amount: '', security_deposit: '', maintenance_charge: '',
  furnishing: 'unfurnished', status: 'vacant',
  owner: { name: '', contact: '', email: '', address: '' },
  tenant_info: { name: '', contact: '', email: '', aadhar: '', move_in_date: '', move_out_date: '', emergency_contact: '' },
  rental_start_date: '', rental_end_date: '', agreement_period_months: 11, rent_due_day: 5,
  notice_period_days: 30, amenities: [], notes: '', property: '',
};

export default function RentalList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(initForm);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.append('status', filterStatus);
    if (search) params.append('search', search);
    API.get(`/rental-apartments${params.toString() ? `?${params}` : ''}`)
      .then((res) => setData(res.data))
      .catch(() => toast('Failed to load rentals', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterStatus, search]);
  useEffect(() => { API.get('/properties?listing_type=rent').then((res) => setProperties(res.data)).catch(() => {}); }, []);

  const openCreate = () => {
    setSelected(null);
    setForm(initForm);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setSelected(row);
    setForm({
      unit_number: row.unit_number || '',
      building_name: row.building_name || '',
      floor: row.floor || '',
      bedrooms: row.bedrooms || 0,
      bathrooms: row.bathrooms || 0,
      area_sqft: row.area_sqft || '',
      rent_amount: row.rent_amount || '',
      security_deposit: row.security_deposit || '',
      maintenance_charge: row.maintenance_charge || '',
      furnishing: row.furnishing || 'unfurnished',
      status: row.status || 'vacant',
      owner: row.owner || { name: '', contact: '', email: '', address: '' },
      tenant_info: row.tenant_info || { name: '', contact: '', email: '', aadhar: '', move_in_date: '', move_out_date: '', emergency_contact: '' },
      rental_start_date: row.rental_start_date ? row.rental_start_date.split('T')[0] : '',
      rental_end_date: row.rental_end_date ? row.rental_end_date.split('T')[0] : '',
      agreement_period_months: row.agreement_period_months || 11,
      rent_due_day: row.rent_due_day || 5,
      notice_period_days: row.notice_period_days || 30,
      amenities: row.amenities || [],
      notes: row.notes || '',
      property: row.property?._id || '',
    });
    setModalOpen(true);
  };

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
      if (selected) {
        await API.put(`/rental-apartments/${selected._id}`, payload);
        toast('Rental updated');
      } else {
        await API.post('/rental-apartments', payload);
        toast('Rental created');
      }
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/rental-apartments/${selected._id}`);
      toast('Rental deleted');
      fetchData();
    } catch (err) {
      toast('Error deleting', 'error');
    }
  };

  const handleAmenityToggle = (amenity) => {
    const cur = form.amenities || [];
    setForm({ ...form, amenities: cur.includes(amenity) ? cur.filter((a) => a !== amenity) : [...cur, amenity] });
  };

  const columns = [
    { header: 'Unit', accessor: 'unit_number' },
    { header: 'Building', accessor: 'building_name' },
    { header: 'Rent', render: (r) => `₹${Number(r.rent_amount).toLocaleString()}/mo` },
    { header: 'Deposit', render: (r) => `₹${Number(r.security_deposit).toLocaleString()}` },
    { header: 'Bed/Bath', render: (r) => `${r.bedrooms}B / ${r.bathrooms}Ba` },
    { header: 'Area', render: (r) => r.area_sqft ? `${r.area_sqft} sqft` : '-' },
    { header: 'Status', render: (r) => <span className={statusColors[r.status]}>{r.status?.replace('_', ' ')}</span> },
    { header: 'Tenant', render: (r) => r.tenant_info?.name || 'Vacant' },
  ];

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Rental Apartments</h1>
          <p className="text-stone-500 mt-1">Manage rental units, tenants, and agreements</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">
            + Add Rental
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-colors appearance-none cursor-pointer">
          <option value="">All Status</option>
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="under_maintenance">Under Maintenance</option>
        </select>
        <input
          type="text" placeholder="Search unit, building, owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors w-64"
        />
      </div>

      <DataTable columns={columns} data={data} loading={loading}
        onView={(r) => navigate(`/rental-apartments/${r._id}`)}
        onEdit={openEdit}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Rental' : 'Add Rental'} size="xl">
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
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Property (optional)</label><select className={inputClass + " appearance-none cursor-pointer"} value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}>
              <option value="">None</option>
              {properties.map((p) => <option key={p._id} value={p._id}>{p.property_id} - {p.building_name || p.location}</option>)}
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
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Agreement Period (months)</label><input type="number" className={inputClass} value={form.agreement_period_months} onChange={(e) => setForm({ ...form, agreement_period_months: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Rent Due Day</label><input type="number" min={1} max={31} className={inputClass} value={form.rent_due_day} onChange={(e) => setForm({ ...form, rent_due_day: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notice Period (days)</label><input type="number" className={inputClass} value={form.notice_period_days} onChange={(e) => setForm({ ...form, notice_period_days: e.target.value })} /></div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {['AC', 'Geyser', 'Washing Machine', 'Refrigerator', 'Sofa', 'Bed', 'Dining Table', 'Wardrobe', 'Microwave', 'Water Purifier', 'TV', 'Internet'].map((a) => (
                <button key={a} type="button" onClick={() => handleAmenityToggle(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${(form.amenities || []).includes(a) ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}>{a}</button>
              ))}
            </div>
          </div>

          <div><label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Rental" message="Are you sure you want to delete this rental unit?" />
    </div>
  );
}