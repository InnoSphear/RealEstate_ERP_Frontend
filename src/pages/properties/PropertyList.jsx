import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { HiOutlineSquares2X2, HiOutlineTableCells, HiOutlineEye, HiOutlineHeart, HiOutlineMapPin, HiOutlineHomeModern } from 'react-icons/hi2';

const propertyTypes = ['apartment', 'villa', 'plot', 'commercial', 'shop', 'office', 'warehouse', 'penthouse', 'other'];
const listingTypes = ['sale', 'rent', 'lease'];
const availabilityOptions = ['available', 'sold', 'rented', 'under_contract', 'off_market'];
const statusOptions = ['active', 'inactive', 'pending'];
const furnishingOptions = ['unfurnished', 'semi-furnished', 'fully-furnished'];
const possessionOptions = ['ready_to_move', 'under_construction', 'possession_after_6_months', 'possession_after_1_year', 'possession_after_2_years'];

const badge = (classes, label) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>{label}</span>
);

const availabilityBadge = (v) => {
  const map = { available: 'bg-green-50 text-green-700 ring-1 ring-green-200', sold: 'bg-red-50 text-red-700 ring-1 ring-red-200', rented: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', under_contract: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200', off_market: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' };
  return badge(map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', v?.replace(/_/g, ' '));
};

const statusBadge = (v) => {
  const map = { active: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', inactive: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', pending: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200' };
  return badge(map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', v);
};

const emptyForm = () => ({
  owner_name: '', owner_contact: '', owner_email: '',
  flat_number: '', building_name: '', society_name: '', location: '', city: '', state: '', pincode: '',
  property_type: 'apartment', carpet_area: '', built_up_area: '', plot_area: '', bedrooms: '', bathrooms: '', balconies: '', floors: '', total_floors: '',
  furnishing_status: 'unfurnished', possession_status: 'ready_to_move',
  listing_type: 'sale', price_sale: '', rent_amount: '', rent_deposit: '', maintenance_amount: '',
  parking: '', amenities: '', description: '', availability: 'available', status: 'active',
});

export default function PropertyList() {
  const { user } = useAuth();
  const isAdmin = user?.role_slug === 'admin';
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('table');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [images, setImages] = useState([]);
  const [filters, setFilters] = useState({ property_type: '', listing_type: '', availability: '', status: '', city: '', priceMin: '', priceMax: '' });
  const [search, setSearch] = useState('');

  const queryString = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    if (search) params.set('search', search);
    const qs = params.toString();
    return qs ? `/properties?${qs}` : '/properties';
  };

  const fetchData = async () => {
    setLoading(true);
    try { const { data: d } = await API.get(queryString()); setData(Array.isArray(d) ? d : d.properties || []); }
    catch (err) { toast('Failed to load properties', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filters, search]);

  const openCreate = () => { setSelected(null); setForm(emptyForm()); setImages([]); setModalOpen(true); };
  const openEdit = (row) => {
    setSelected(row);
    setForm({
      owner_name: row.owner_name || '', owner_contact: row.owner_contact || '', owner_email: row.owner_email || '',
      flat_number: row.flat_number || '', building_name: row.building_name || '', society_name: row.society_name || '', location: row.location || '', city: row.city || '', state: row.state || '', pincode: row.pincode || '',
      property_type: row.property_type || 'apartment', carpet_area: row.carpet_area || '', built_up_area: row.built_up_area || '', plot_area: row.plot_area || '', bedrooms: row.bedrooms || '', bathrooms: row.bathrooms || '', balconies: row.balconies || '', floors: row.floors || '', total_floors: row.total_floors || '',
      furnishing_status: row.furnishing_status || 'unfurnished', possession_status: row.possession_status || 'ready_to_move',
      listing_type: row.listing_type || 'sale', price_sale: row.price_sale || '', rent_amount: row.rent_amount || '', rent_deposit: row.rent_deposit || '', maintenance_amount: row.maintenance_amount || '',
      parking: row.parking || '', amenities: Array.isArray(row.amenities) ? row.amenities.join(', ') : (row.amenities || ''), description: row.description || '', availability: row.availability || 'available', status: row.status || 'active',
    });
    setImages([]);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== null) fd.append(k, v); });
      images.forEach((img) => fd.append('images', img));
      if (selected) { await API.put(`/properties/${selected._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast('Property updated'); }
      else { await API.post('/properties', fd, { headers: { 'Content-Type': 'multipart/form-data' } }); toast('Property created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error saving property', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/properties/${selected._id}`); toast('Property deleted'); fetchData(); }
    catch (err) { toast('Error deleting property', 'error'); }
  };

  const columns = [
    { header: 'Property ID', accessor: 'property_id' },
    { header: 'Owner', render: (r) => r.owner_name || '-' },
    { header: 'Location', render: (r) => [r.flat_number, r.building_name, r.location].filter(Boolean).join(', ') || '-' },
    { header: 'Type', render: (r) => r.property_type ? r.property_type.charAt(0).toUpperCase() + r.property_type.slice(1) : '-' },
    { header: 'Listing', render: (r) => r.listing_type?.charAt(0).toUpperCase() + r.listing_type?.slice(1) || '-' },
    { header: 'Price / Rent', render: (r) => {
      if (r.listing_type === 'rent' || r.listing_type === 'lease') return r.rent_amount ? `₹${Number(r.rent_amount).toLocaleString()}/mo` : '-';
      return r.price_sale ? `₹${Number(r.price_sale).toLocaleString()}` : '-';
    }},
    { header: 'Availability', render: (r) => availabilityBadge(r.availability) },
    { header: 'Status', render: (r) => statusBadge(r.status) },
  ];

  const navigateTo = (id) => { window.location.href = `/properties/${id}`; };

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-white">Properties</h1><p className="text-stone-500 mt-1 dark:text-stone-400">Manage all property listings</p></div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('table')} className={`p-2.5 transition-all ${viewMode === 'table' ? 'bg-stone-900 text-white dark:bg-stone-600' : 'text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-200'}`}><HiOutlineTableCells size={18} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-2.5 transition-all ${viewMode === 'grid' ? 'bg-stone-900 text-white dark:bg-stone-600' : 'text-stone-400 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-200'}`}><HiOutlineSquares2X2 size={18} /></button>
          </div>
          <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">+ Add Property</button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search by ID, owner, location..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors min-w-[220px] dark:text-white dark:placeholder-stone-400" />
        <select value={filters.property_type} onChange={(e) => setFilters({ ...filters, property_type: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white">
          <option value="">All Types</option>
          {propertyTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filters.listing_type} onChange={(e) => setFilters({ ...filters, listing_type: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white">
          <option value="">All Listings</option>
          {listingTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white">
          <option value="">All Availability</option>
          {availabilityOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
        </select>
        <input type="text" placeholder="City" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors w-28 dark:text-white dark:placeholder-stone-400" />
        <input type="number" placeholder="Min Price" value={filters.priceMin} onChange={(e) => setFilters({ ...filters, priceMin: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors w-28 dark:text-white dark:placeholder-stone-400" />
        <input type="number" placeholder="Max Price" value={filters.priceMax} onChange={(e) => setFilters({ ...filters, priceMax: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors w-28 dark:text-white dark:placeholder-stone-400" />
      </div>

      {viewMode === 'table' ? (
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          onEdit={openEdit}
          onDelete={isAdmin ? (r) => { setSelected(r); setConfirmOpen(true); } : undefined}
          onView={(r) => navigateTo(r._id)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex items-center justify-center py-20"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent dark:border-white" /></div>
          ) : data.length === 0 ? (
            <div className="col-span-full text-center py-20 text-stone-400 dark:text-stone-500">No properties found</div>
          ) : data.map((p) => (
            <div key={p._id} onClick={() => navigateTo(p._id)} className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 luxury-shadow overflow-hidden cursor-pointer hover:shadow-lg transition-all group">
              <div className="relative h-48 bg-stone-100 dark:bg-stone-700 overflow-hidden">
                {p.images?.length ? (
                  <img src={p.images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="flex items-center justify-center h-full text-stone-300 dark:text-stone-500"><HiOutlineHomeModern size={40} /></div>
                )}
                <div className="absolute top-3 left-3">{availabilityBadge(p.availability)}</div>
                <div className="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-lg px-2.5 py-1 text-sm font-semibold text-stone-900 dark:text-white">
                  {p.listing_type === 'rent' || p.listing_type === 'lease' ? `₹${Number(p.rent_amount || 0).toLocaleString()}/mo` : `₹${Number(p.price_sale || 0).toLocaleString()}`}
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-stone-900 dark:text-white mb-1 truncate">{p.property_id || 'Property'}</h3>
                <div className="flex items-center gap-1 text-stone-500 dark:text-stone-400 text-sm mb-2">
                  <HiOutlineMapPin size={14} />
                  <span className="truncate">{p.location || p.city || '-'}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-500 dark:text-stone-400">
                  <span>{p.property_type?.charAt(0).toUpperCase() + p.property_type?.slice(1) || '-'}</span>
                  {p.bedrooms && <span>{p.bedrooms} BHK</span>}
                  <span className="ml-auto">{statusBadge(p.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Property' : 'Create Property'} size="xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Owner Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Owner Name *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Owner Contact *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.owner_contact} onChange={(e) => setForm({ ...form, owner_contact: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Owner Email</label><input type="email" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Property Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Flat / Unit Number</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.flat_number} onChange={(e) => setForm({ ...form, flat_number: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Building Name</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.building_name} onChange={(e) => setForm({ ...form, building_name: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Society Name</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.society_name} onChange={(e) => setForm({ ...form, society_name: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Location *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">City *</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">State</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Pincode</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Property Type *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.property_type} onChange={(e) => setForm({ ...form, property_type: e.target.value })} required>{propertyTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Carpet Area (sqft)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.carpet_area} onChange={(e) => setForm({ ...form, carpet_area: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Built-up Area (sqft)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.built_up_area} onChange={(e) => setForm({ ...form, built_up_area: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Plot Area (sqft)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.plot_area} onChange={(e) => setForm({ ...form, plot_area: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Bedrooms</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.bedrooms} onChange={(e) => setForm({ ...form, bedrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Bathrooms</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.bathrooms} onChange={(e) => setForm({ ...form, bathrooms: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Balconies</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.balconies} onChange={(e) => setForm({ ...form, balconies: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Floor</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Total Floors</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.total_floors} onChange={(e) => setForm({ ...form, total_floors: e.target.value })} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Furnishing Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.furnishing_status} onChange={(e) => setForm({ ...form, furnishing_status: e.target.value })}>{furnishingOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Possession Status</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.possession_status} onChange={(e) => setForm({ ...form, possession_status: e.target.value })}>{possessionOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Parking</label><input className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" placeholder="e.g. 2 covered" value={form.parking} onChange={(e) => setForm({ ...form, parking: e.target.value })} /></div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Listing & Pricing</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Listing Type *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.listing_type} onChange={(e) => setForm({ ...form, listing_type: e.target.value })} required>{listingTypes.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Sale Price (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.price_sale} onChange={(e) => setForm({ ...form, price_sale: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Rent Amount (₹/mo)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.rent_amount} onChange={(e) => setForm({ ...form, rent_amount: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Rent Deposit (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.rent_deposit} onChange={(e) => setForm({ ...form, rent_deposit: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Maintenance Amount (₹)</label><input type="number" className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" value={form.maintenance_amount} onChange={(e) => setForm({ ...form, maintenance_amount: e.target.value })} /></div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">Additional</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Amenities</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={3} placeholder="Comma separated: pool, gym, garden..." value={form.amenities} onChange={(e) => setForm({ ...form, amenities: e.target.value })} /></div>
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Images</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setImages([...e.target.files])} className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-stone-100 dark:file:bg-stone-700 file:text-sm file:font-semibold text-stone-500 dark:text-stone-400 dark:file:text-stone-200" />
                {images.length > 0 && <p className="text-xs text-stone-500 mt-1">{images.length} file(s) selected</p>}
              </div>
            </div>
            <div className="mt-4"><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Description</label><textarea className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Availability *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} required>{availabilityOptions.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}</select></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Status *</label><select className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer dark:text-white" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} required>{statusOptions.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Property" message="Are you sure you want to delete this property? This action cannot be undone." />
    </div>
  );
}
