import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';
import { HiOutlineArrowLeft, HiOutlinePencilSquare, HiOutlineStar, HiOutlineMapPin, HiOutlineHomeModern, HiOutlinePhoto, HiOutlineDocumentText, HiOutlineKey, HiOutlineCalendarDays, HiOutlineCube, HiOutlineCurrencyDollar } from 'react-icons/hi2';

const badge = (classes, label) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes}`}>{label}</span>
);

const availabilityBadge = (v) => {
  const map = { available: 'bg-green-50 text-green-700 ring-1 ring-green-200', sold: 'bg-red-50 text-red-700 ring-1 ring-red-200', rented: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200', under_contract: 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200', off_market: 'bg-gray-50 text-gray-700 ring-1 ring-gray-200' };
  return badge(map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200', v?.replace(/_/g, ' '));
};

export default function PropertyDetail() {
  const id = window.location.pathname.split('/').pop();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    (async () => {
      try { const { data } = await API.get(`/properties/${id}`); setProperty(data); }
      catch (err) { toast('Failed to load property', 'error'); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const toggleFeatured = async () => {
    try { await API.patch(`/properties/${id}/featured`, { featured: !property.featured }); setProperty({ ...property, featured: !property.featured }); toast(property.featured ? 'Unfeatured' : 'Featured'); }
    catch (err) { toast('Error', 'error'); }
  };

  if (loading) return <div className="flex items-center justify-center py-32"><div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent dark:border-white" /></div>;
  if (!property) return <div className="text-center py-20 text-stone-400 dark:text-stone-500">Property not found</div>;

  const p = property;

  const DetailRow = ({ label, value }) => value ? (
    <div className="flex justify-between py-2.5 border-b border-stone-100 dark:border-stone-700">
      <span className="text-sm text-stone-500 dark:text-stone-400">{label}</span>
      <span className="text-sm font-medium text-stone-900 dark:text-white text-right">{value}</span>
    </div>
  ) : null;

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 luxury-shadow p-5">
      <h3 className="text-sm font-semibold text-stone-900 dark:text-white flex items-center gap-2 mb-4 pb-3 border-b border-stone-100 dark:border-stone-700">
        {Icon && <Icon size={16} className="text-stone-400" />}{title}
      </h3>
      {children}
    </div>
  );

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex items-center justify-between">
        <button onClick={() => window.history.back()} className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white transition-colors"><HiOutlineArrowLeft size={16} /> Back</button>
        <div className="flex items-center gap-2">
          <button onClick={toggleFeatured} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer ${p.featured ? 'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:ring-yellow-800' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600'}`}><HiOutlineStar size={15} />{p.featured ? 'Featured' : 'Set Featured'}</button>
          <button onClick={() => { window.location.href = `/properties/${id}/edit`; }} className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600"><HiOutlinePencilSquare size={15} /> Edit</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Section title="Image Gallery" icon={HiOutlinePhoto}>
            {p.images?.length ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {p.images.map((img, i) => (
                    <div key={i} onClick={() => setLightbox(img)} className="relative aspect-video rounded-xl overflow-hidden cursor-pointer bg-stone-100 dark:bg-stone-700 group">
                      <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
                {lightbox && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
                    <img src={lightbox} alt="" className="max-w-full max-h-full rounded-2xl" />
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-stone-300 dark:text-stone-500"><HiOutlinePhoto size={40} /><p className="text-sm mt-2">No images</p></div>
            )}
          </Section>

          <Section title="Property Details" icon={HiOutlineHomeModern}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <DetailRow label="Property ID" value={p.property_id} />
              <DetailRow label="Created By" value={p.created_by?.full_name || '-'} />
              <DetailRow label="Type" value={p.property_type && (p.property_type.charAt(0).toUpperCase() + p.property_type.slice(1))} />
              <DetailRow label="Flat/Unit" value={p.flat_number} />
              <DetailRow label="Building" value={p.building_name} />
              <DetailRow label="Society" value={p.society_name} />
              <DetailRow label="Location" value={p.location} />
              <DetailRow label="City" value={p.city} />
              <DetailRow label="State" value={p.state} />
              <DetailRow label="Pincode" value={p.pincode} />
              <DetailRow label="Carpet Area" value={p.carpet_area ? `${p.carpet_area} sqft` : null} />
              <DetailRow label="Built-up Area" value={p.built_up_area ? `${p.built_up_area} sqft` : null} />
              <DetailRow label="Plot Area" value={p.plot_area ? `${p.plot_area} sqft` : null} />
              <DetailRow label="Bedrooms" value={p.bedrooms} />
              <DetailRow label="Bathrooms" value={p.bathrooms} />
              <DetailRow label="Balconies" value={p.balconies} />
              <DetailRow label="Floor" value={p.floors ? `${p.floors} of ${p.total_floors || '?'}` : null} />
              <DetailRow label="Furnishing" value={p.furnishing_status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
              <DetailRow label="Possession" value={p.possession_status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} />
              <DetailRow label="Parking" value={p.parking} />
              <DetailRow label="Availability" value={<span>{availabilityBadge(p.availability)}</span>} />
            </div>
          </Section>

          <Section title="Description">
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{p.description || 'No description provided.'}</p>
          </Section>

          {p.amenities?.length ? (
            <Section title="Amenities">
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(p.amenities) ? p.amenities : p.amenities.split(',').map((s) => s.trim())).filter(Boolean).map((a, i) => (
                  <span key={i} className="px-3 py-1.5 bg-stone-50 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs font-medium ring-1 ring-stone-200 dark:ring-stone-600">{a}</span>
                ))}
              </div>
            </Section>
          ) : null}

          {p.materials?.length ? (
            <Section title="Materials / Interior" icon={HiOutlineCube}>
              <div className="space-y-2">
                {p.materials.map((m, i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-stone-100 dark:border-stone-700 last:border-0">
                    <span className="text-sm text-stone-700 dark:text-stone-200">{m.item_name}</span>
                    <span className="text-sm font-medium text-stone-900 dark:text-white">₹{Number(m.cost || 0).toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 font-semibold text-stone-900 dark:text-white">
                  <span>Total Cost</span>
                  <span>₹{p.materials.reduce((s, m) => s + (Number(m.cost) || 0), 0).toLocaleString()}</span>
                </div>
              </div>
            </Section>
          ) : null}
        </div>

        <div className="space-y-6">
          <Section title="Pricing" icon={HiOutlineStar}>
            <div className="mb-4 pb-4 border-b border-stone-100 dark:border-stone-700">
              {p.listing_type === 'rent' || p.listing_type === 'lease' ? (
                <>
                  <p className="text-2xl font-bold text-stone-900 dark:text-white">₹{Number(p.rent_amount || 0).toLocaleString()}<span className="text-sm font-normal text-stone-500">/mo</span></p>
                  {p.rent_deposit ? <p className="text-sm text-stone-500 mt-1">Deposit: ₹{Number(p.rent_deposit).toLocaleString()}</p> : null}
                </>
              ) : (
                <p className="text-2xl font-bold text-stone-900 dark:text-white">₹{Number(p.price_sale || 0).toLocaleString()}</p>
              )}
              {p.maintenance_amount ? <p className="text-sm text-stone-500 mt-1">Maintenance: ₹{Number(p.maintenance_amount).toLocaleString()}/mo</p> : null}
              <p className="text-xs text-stone-400 mt-1 capitalize">{p.listing_type}</p>
            </div>
            <DetailRow label="Owner" value={p.owner_name} />
            <DetailRow label="Contact" value={p.owner_contact} />
            <DetailRow label="Email" value={p.owner_email} />
          </Section>

          <Section title="Location" icon={HiOutlineMapPin}>
            {p.location && <p className="text-sm text-stone-700 dark:text-stone-200">{p.location}</p>}
            {p.city && <p className="text-sm text-stone-500 dark:text-stone-400">{[p.city, p.state, p.pincode].filter(Boolean).join(', ')}</p>}
          </Section>

          {p.documents?.length ? (
            <Section title="Documents" icon={HiOutlineDocumentText}>
              <div className="space-y-2">
                {p.documents.map((doc, i) => (
                  <a key={i} href={doc.url || doc} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700">
                    <HiOutlineDocumentText size={16} className="text-stone-400" />
                    <span className="flex-1 truncate">{doc.name || `Document ${i + 1}`}</span>
                    <span className="text-xs text-stone-400">Download</span>
                  </a>
                ))}
              </div>
            </Section>
          ) : null}

          {p.key_available || p.keys?.length ? (
            <Section title="Key Management" icon={HiOutlineKey}>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100 dark:border-stone-700">
                <span className="text-sm text-stone-600 dark:text-stone-300">Status</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${p.key_available ? 'bg-green-50 text-green-700 ring-1 ring-green-200' : 'bg-red-50 text-red-700 ring-1 ring-red-200'}`}>{p.key_available ? 'Available' : 'Not Available'}</span>
              </div>
              {p.keys?.length ? (
                <div className="space-y-3">
                  {p.keys.map((k, i) => (
                    <div key={i} className="p-3 rounded-xl bg-stone-50 dark:bg-stone-700 border border-stone-100 dark:border-stone-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{k.key_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${k.status === 'available' ? 'bg-green-50 text-green-700' : k.status === 'issued' ? 'bg-amber-50 text-amber-700' : 'bg-stone-50 text-stone-700'}`}>{k.status}</span>
                      </div>
                      {k.issued_to && (
                        <div className="text-xs text-stone-500 dark:text-stone-400 space-y-1">
                          <p>Holder: {k.issued_to?.full_name || k.key_holder?.full_name || '-'}</p>
                          {k.issue_date && <p>Issued: {new Date(k.issue_date).toLocaleDateString()}</p>}
                          {k.return_date && <p>Returned: {new Date(k.return_date).toLocaleDateString()}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                  <a href="/properties/keys" className="block text-center text-xs text-blue-600 hover:text-blue-700 underline mt-1">Manage All Keys →</a>
                </div>
              ) : (
                <p className="text-xs text-stone-400 dark:text-stone-500 text-center py-2">No key records added yet</p>
              )}
            </Section>
          ) : null}

          {p.site_visits?.length ? (
            <Section title="Site Visits" icon={HiOutlineCalendarDays}>
              <div className="space-y-2">
                {p.site_visits.map((sv, i) => (
                  <div key={i} className="text-sm p-2 rounded-lg bg-stone-50 dark:bg-stone-700">
                    <p className="font-medium text-stone-700 dark:text-stone-200">{sv.visitor_name || 'Visitor'}</p>
                    <p className="text-stone-500 text-xs">{sv.date ? new Date(sv.date).toLocaleDateString() : ''} {sv.status && `- ${sv.status}`}</p>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
