import { useState, useEffect } from 'react';
import API from '../../api/axios';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import { HiOutlineBanknotes, HiOutlineShoppingCart, HiOutlineCreditCard, HiOutlineCube } from 'react-icons/hi2';

const paymentStatusBadge = (v) => {
  const map = {
    paid: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    partial: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    credit: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[v] || 'bg-gray-50 text-gray-700 ring-1 ring-gray-200'}`}>{v ? v.charAt(0).toUpperCase() + v.slice(1) : '-'}</span>;
};

const emptyForm = () => ({
  name: '', contact_person: '', phone: '', email: '', address: '', gst: '', category: 'other',
});

export default function VendorList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState(false);
  const [paymentModal, setPaymentModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [purchaseForm, setPurchaseForm] = useState({ item_name: '', quantity: 1, rate: 0, amount: 0, purchase_date: new Date().toISOString().split('T')[0], notes: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference: '', notes: '' });
  const [filters, setFilters] = useState({ category: '', payment_status: '', search: '' });
  const [stats, setStats] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const qs = params.toString();
      const [dRes, sRes] = await Promise.all([
        API.get(qs ? `/vendors?${qs}` : '/vendors'),
        API.get('/vendors/stats'),
      ]);
      setData(Array.isArray(dRes.data) ? dRes.data : dRes.data.vendors || []);
      setStats(sRes.data);
    } catch (err) { toast('Failed to load vendors', 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, [filters]);

  const openCreate = () => { setSelected(null); setForm(emptyForm()); setModalOpen(true); };
  const openEdit = (row) => {
    setSelected(row);
    setForm({
      name: row.name || '', contact_person: row.contact_person || '', phone: row.phone || '',
      email: row.email || '', address: row.address || '', gst: row.gst || '', category: row.category || 'other',
    });
    setModalOpen(true);
  };
  const openDetail = (row) => { setSelected(row); setDetailModal(true); };
  const openPurchase = (row) => { setSelected(row); setPurchaseForm({ item_name: '', quantity: 1, rate: 0, amount: 0, purchase_date: new Date().toISOString().split('T')[0], notes: '' }); setPurchaseModal(true); };
  const openPayment = (row) => { setSelected(row); setPaymentForm({ amount: '', payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', reference: '', notes: '' }); setPaymentModal(true); };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (selected) { await API.put(`/vendors/${selected._id}`, form); toast('Vendor updated'); }
      else { await API.post('/vendors', form); toast('Vendor created'); }
      setModalOpen(false); fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error saving vendor', 'error'); }
  };

  const handlePurchase = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/vendors/${selected._id}/purchases`, purchaseForm);
      toast('Purchase added');
      setPurchaseModal(false);
      const { data: updated } = await API.get(`/vendors/${selected._id}`);
      setSelected(updated);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      await API.post(`/vendors/${selected._id}/payments`, paymentForm);
      toast('Payment recorded');
      setPaymentModal(false);
      const { data: updated } = await API.get(`/vendors/${selected._id}`);
      setSelected(updated);
      fetchData();
    } catch (err) { toast(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleDelete = async () => {
    try { await API.delete(`/vendors/${selected._id}`); toast('Vendor deleted'); fetchData(); }
    catch (err) { toast('Error', 'error'); }
  };

  const updatePurchaseItem = (field, value) => {
    const qty = field === 'quantity' ? parseFloat(value) || 1 : purchaseForm.quantity;
    const rate = field === 'rate' ? parseFloat(value) || 0 : purchaseForm.rate;
    const amount = qty * rate;
    setPurchaseForm({ ...purchaseForm, [field]: value, quantity: qty, rate, amount });
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors dark:text-white dark:placeholder-stone-400";

  const columns = [
    { header: 'Vendor Name', accessor: 'name' },
    { header: 'Contact', render: (r) => r.contact_person || r.phone || '-' },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Category', render: (r) => r.category ? r.category.charAt(0).toUpperCase() + r.category.slice(1) : '-' },
    {
      header: 'Total Purchased',
      render: (r) => `₹${(r.total_purchased || 0).toLocaleString()}`,
    },
    {
      header: 'Total Paid',
      render: (r) => `₹${(r.total_paid || 0).toLocaleString()}`,
    },
    {
      header: 'Total Due',
      render: (r) => `₹${(r.total_due || 0).toLocaleString()}`,
    },
    { header: 'Payment', render: (r) => paymentStatusBadge(r.payment_status) },
  ];

  return (
    <div className="space-y-6 dark:text-stone-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-900 tracking-tight dark:text-white">Vendors</h1><p className="text-stone-500 mt-1 dark:text-stone-400">Manage vendors, purchases and payments</p></div>
        <button onClick={openCreate} className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">+ Add Vendor</button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">Total Vendors</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-white mt-1">{stats.total_vendors || 0}</p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">Total Purchased</p>
            <p className="text-2xl font-bold text-stone-900 dark:text-white mt-1">₹{(stats.total_purchased || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(stats.total_paid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 p-4">
            <p className="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider font-semibold">Total Due</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">₹{(stats.total_due || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <input type="text" placeholder="Search by name, phone, GST..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors min-w-[220px] dark:text-white dark:placeholder-stone-400" />
        <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white appearance-none cursor-pointer">
          <option value="">All Categories</option>
          {['material', 'labor', 'service', 'transport', 'consultant', 'other'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
        <select value={filters.payment_status} onChange={(e) => setFilters({ ...filters, payment_status: e.target.value })} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-sm focus:outline-none transition-colors dark:text-white appearance-none cursor-pointer">
          <option value="">All Payment</option>
          {['paid', 'partial', 'credit'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        onEdit={openEdit}
        onDelete={(r) => { setSelected(r); setConfirmOpen(true); }}
        onView={(r) => openDetail(r)}
        actions={(r) => (
          <div className="flex items-center gap-1">
            <button onClick={(e) => { e.stopPropagation(); openPurchase(r); }} className="p-1.5 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all cursor-pointer" title="Add Purchase"><HiOutlineShoppingCart size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); openPayment(r); }} className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer" title="Add Payment"><HiOutlineBanknotes size={14} /></button>
          </div>
        )}
      />

      {/* Create / Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selected ? 'Edit Vendor' : 'Create Vendor'}>
        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Vendor Name *</label><input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Contact Person</label><input className={inputClass} value={form.contact_person} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Phone</label><input className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Email</label><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="sm:col-span-2"><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Address</label><textarea className={inputClass} rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">GST Number</label><input className={inputClass} value={form.gst} onChange={(e) => setForm({ ...form, gst: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Category</label>
              <select className={inputClass + " appearance-none cursor-pointer"} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {['material', 'labor', 'service', 'transport', 'consultant', 'other'].map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-stone-600 hover:bg-stone-50 border border-stone-200 dark:bg-stone-700 dark:text-stone-300 dark:border-stone-600 dark:hover:bg-stone-600">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10 dark:bg-stone-700 dark:hover:bg-stone-600">{selected ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Purchase Modal */}
      <Modal isOpen={purchaseModal} onClose={() => setPurchaseModal(false)} title={`Add Purchase - ${selected?.name || ''}`}>
        <form onSubmit={handlePurchase} className="space-y-5">
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Item Name *</label><input className={inputClass} value={purchaseForm.item_name} onChange={(e) => updatePurchaseItem('item_name', e.target.value)} required /></div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Quantity</label><input type="number" min="1" className={inputClass} value={purchaseForm.quantity} onChange={(e) => updatePurchaseItem('quantity', e.target.value)} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Rate (₹)</label><input type="number" min="0" className={inputClass} value={purchaseForm.rate} onChange={(e) => updatePurchaseItem('rate', e.target.value)} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Amount</label><input type="number" className={inputClass + " bg-stone-50"} value={purchaseForm.amount} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Purchase Date</label><input type="date" className={inputClass} value={purchaseForm.purchase_date} onChange={(e) => setPurchaseForm({ ...purchaseForm, purchase_date: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={purchaseForm.notes} onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPurchaseModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineShoppingCart size={15} /> Add Purchase</button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal isOpen={paymentModal} onClose={() => setPaymentModal(false)} title={`Record Payment - ${selected?.name || ''}`}>
        <form onSubmit={handlePayment} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Amount (₹) *</label><input type="number" min="1" className={inputClass} value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} required /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Payment Date</label><input type="date" className={inputClass} value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} /></div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Payment Mode</label>
              <select className={inputClass + " appearance-none cursor-pointer"} value={paymentForm.payment_mode} onChange={(e) => setPaymentForm({ ...paymentForm, payment_mode: e.target.value })}>
                {['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'other'].map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Reference</label><input className={inputClass} placeholder="Cheque/Transaction ID" value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} /></div>
          </div>
          <div><label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Notes</label><textarea className={inputClass} rows={2} value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setPaymentModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-white text-stone-600 hover:bg-stone-50 border border-stone-200">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-xl text-sm font-semibold border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"><HiOutlineBanknotes size={15} /> Record Payment</button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={detailModal} onClose={() => setDetailModal(false)} title={selected?.name || 'Vendor Details'} size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Contact Person</p><p className="text-sm font-medium text-stone-900 dark:text-white mt-1">{selected.contact_person || '-'}</p></div>
              <div><p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Phone</p><p className="text-sm font-medium text-stone-900 dark:text-white mt-1">{selected.phone || '-'}</p></div>
              <div><p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Email</p><p className="text-sm font-medium text-stone-900 dark:text-white mt-1">{selected.email || '-'}</p></div>
              <div><p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">GST</p><p className="text-sm font-medium text-stone-900 dark:text-white mt-1">{selected.gst || '-'}</p></div>
              <div className="sm:col-span-2"><p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Address</p><p className="text-sm font-medium text-stone-900 dark:text-white mt-1">{selected.address || '-'}</p></div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-stone-700 border border-stone-100 dark:border-stone-600">
              <div className="text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Purchased</p>
                <p className="text-lg font-bold text-stone-900 dark:text-white mt-1">₹{(selected.total_purchased || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Paid</p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{(selected.total_paid || 0).toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">Total Due</p>
                <p className="text-lg font-bold text-red-600 dark:text-red-400 mt-1">₹{(selected.total_due || 0).toLocaleString()}</p>
              </div>
            </div>

            {selected.purchases?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2"><HiOutlineShoppingCart size={16} /> Purchases</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.purchases.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 dark:bg-stone-700 border border-stone-100 dark:border-stone-600">
                      <div>
                        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">{p.item_name}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{p.quantity} x ₹{p.rate?.toLocaleString()} | {p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : ''}</p>
                      </div>
                      <span className="text-sm font-semibold text-stone-900 dark:text-white">₹{(p.amount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selected.payments?.length ? (
              <div>
                <h4 className="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3 flex items-center gap-2"><HiOutlineCreditCard size={16} /> Payments</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selected.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                      <div>
                        <p className="text-sm font-medium text-stone-700 dark:text-stone-200">₹{(p.amount || 0).toLocaleString()}</p>
                        <p className="text-xs text-stone-500 dark:text-stone-400">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : ''} - {p.payment_mode?.replace(/_/g, ' ')} {p.reference ? `| ${p.reference}` : ''}</p>
                      </div>
                      {p.notes && <span className="text-xs text-stone-500 dark:text-stone-400">{p.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => openPurchase(selected)} className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"><HiOutlineShoppingCart size={15} /> Add Purchase</button>
              <button type="button" onClick={() => openPayment(selected)} className="px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"><HiOutlineBanknotes size={15} /> Add Payment</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Vendor" message="Are you sure you want to delete this vendor?" />
    </div>
  );
}
