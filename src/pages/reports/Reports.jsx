import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import {
  HiOutlineChartBarSquare, HiOutlineUserGroup, HiOutlineCurrencyDollar,
  HiOutlineReceiptPercent, HiOutlineHome, HiOutlineBanknotes,
  HiOutlineArrowDownTray, HiOutlineDocumentArrowDown, HiOutlineClock,
  HiOutlineBuildingOffice2, HiOutlineWrenchScrewdriver, HiOutlineChartBar,
  HiOutlineUser, HiOutlineArchiveBox,
} from 'react-icons/hi2';

const reportTypes = [
  {
    key: 'leads',
    title: 'Lead Reports',
    description: 'Lead conversion rates, source analysis, and pipeline metrics',
    icon: HiOutlineUserGroup,
    endpoint: '/reports/leads',
    color: 'bg-blue-50 text-blue-700',
    filters: ['source', 'status'],
  },
  {
    key: 'employees',
    title: 'Employee Reports',
    description: 'Employee performance, attendance, and productivity stats',
    icon: HiOutlineChartBarSquare,
    endpoint: '/reports/employees',
    color: 'bg-amber-50 text-amber-700',
    filters: ['department', 'role'],
  },
  {
    key: 'sales',
    title: 'Sales Reports',
    description: 'Sales performance, deal stages, and closing rates',
    icon: HiOutlineCurrencyDollar,
    endpoint: '/reports/sales',
    color: 'bg-emerald-50 text-emerald-700',
    filters: ['status', 'agent'],
  },
  {
    key: 'revenue',
    title: 'Revenue Reports',
    description: 'Revenue breakdown, trends, and forecast analysis',
    icon: HiOutlineReceiptPercent,
    endpoint: '/reports/revenue',
    color: 'bg-indigo-50 text-indigo-700',
    filters: ['category', 'period'],
  },
  {
    key: 'properties',
    title: 'Property Reports',
    description: 'Inventory status, pricing trends, and listing analytics',
    icon: HiOutlineHome,
    endpoint: '/reports/properties',
    color: 'bg-rose-50 text-rose-700',
    filters: ['type', 'status', 'location'],
  },
  {
    key: 'commissions',
    title: 'Commission Reports',
    description: 'Commission payouts, pending amounts, and agent earnings',
    icon: HiOutlineBanknotes,
    endpoint: '/reports/commissions',
    color: 'bg-teal-50 text-teal-700',
    filters: ['status', 'agent'],
  },
  {
    key: 'attendance',
    title: 'Attendance Reports',
    description: 'Employee attendance records, working hours, and overtime',
    icon: HiOutlineClock,
    endpoint: '/reports/attendance',
    color: 'bg-violet-50 text-violet-700',
    filters: ['status', 'employee'],
  },
  {
    key: 'rent',
    title: 'Rent Reports',
    description: 'Rental properties, tenant info, and lease status',
    icon: HiOutlineBuildingOffice2,
    endpoint: '/reports/rent',
    color: 'bg-orange-50 text-orange-700',
    filters: ['status', 'furnishing'],
  },
  {
    key: 'interior-projects',
    title: 'Interior Project Reports',
    description: 'Interior project progress, budgets, and timelines',
    icon: HiOutlineWrenchScrewdriver,
    endpoint: '/reports/interior-projects',
    color: 'bg-cyan-50 text-cyan-700',
    filters: ['status', 'project_type'],
  },
  {
    key: 'lead-conversion',
    title: 'Lead Conversion Reports',
    description: 'Conversion rates, trends, and source effectiveness',
    icon: HiOutlineChartBar,
    endpoint: '/reports/lead-conversion',
    color: 'bg-pink-50 text-pink-700',
    filters: [],
  },
  {
    key: 'employee-performance',
    title: 'Employee Performance',
    description: 'Agent leads, conversions, commission earnings',
    icon: HiOutlineUser,
    endpoint: '/reports/employee-performance',
    color: 'bg-lime-50 text-lime-700',
    filters: ['department'],
  },
  {
    key: 'inventory',
    title: 'Inventory Reports',
    description: 'Material stock levels, orders, and reorder status',
    icon: HiOutlineArchiveBox,
    endpoint: '/reports/inventory',
    color: 'bg-slate-50 text-slate-700',
    filters: [],
  },
];

const formatExtensions = { Excel: 'xlsx', CSV: 'csv', PDF: 'pdf' };

export default function Reports() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({
    from: '',
    to: '',
    format: 'Excel',
    filters: {},
  });

  useEffect(() => {
    API.get('/reports/history')
      .then((res) => setHistory(res.data || []))
      .catch(() => {});
  }, []);

  const openGenerate = (report) => {
    setSelectedReport(report);
    setForm({ from: '', to: '', format: 'Excel', filters: {} });
    setModalOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!selectedReport) return;
    setGenerating(true);
    try {
      const params = new URLSearchParams();
      if (form.from) params.append('from', form.from);
      if (form.to) params.append('to', form.to);
      params.append('format', form.format);
      Object.entries(form.filters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });

      const response = await API.get(`${selectedReport.endpoint}?${params.toString()}`, {
        responseType: 'blob',
      });

      const ext = formatExtensions[form.format] || 'xlsx';
      const disposition = response.headers['content-disposition'];
      let filename = `${selectedReport.key}_report.${ext}`;
      if (disposition) {
        const match = disposition.match(/filename=(.+)/);
        if (match) filename = match[1].replace(/['"]/g, '');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setModalOpen(false);

      API.post('/reports/history', {
        report_type: selectedReport.key,
        format: form.format.toLowerCase(),
        filters: { ...form.filters, from: form.from, to: form.to },
        rows_generated: response.headers['x-rows-count'] || 0,
        file_size: filename,
      }).catch(() => {});

      API.get('/reports/history')
        .then((res) => setHistory(res.data || []))
        .catch(() => {});
    } catch (err) {
      console.error('Report generation failed', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Reports</h1>
        <p className="text-stone-500 mt-1">Generate and download business reports</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.key}
              className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6 hover:luxury-shadow-md transition-all duration-300 flex flex-col"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`p-3 rounded-xl ${report.color}`}>
                  <Icon size={24} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-stone-900">{report.title}</h3>
                  <p className="text-sm text-stone-500 mt-1 leading-relaxed">{report.description}</p>
                </div>
              </div>
              <div className="mt-auto pt-3">
                <button
                  onClick={() => openGenerate(report)}
                  className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
                >
                  <HiOutlineDocumentArrowDown size={16} />
                  Generate
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-6">
          <h3 className="text-base font-semibold text-stone-900 mb-5">Generation History</h3>
          <div className="space-y-2">
            {history.slice(0, 10).map((item, i) => (
              <div
                key={item._id || i}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors -mx-3"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-stone-50 text-stone-500">
                    <HiOutlineArrowDownTray size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800 capitalize">
                      {item.report_type || item.type || 'Report'}
                    </p>
                    <p className="text-xs text-stone-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}
                      {item.format ? ` - ${item.format.toUpperCase()}` : ''}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-stone-400">{item.file_size || ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Generate ${selectedReport?.title || 'Report'}`}
        size="md"
      >
        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">From Date</label>
              <input
                type="date"
                value={form.from}
                onChange={(e) => setForm({ ...form, from: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">To Date</label>
              <input
                type="date"
                value={form.to}
                onChange={(e) => setForm({ ...form, to: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
              />
            </div>
          </div>

          {selectedReport?.filters?.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-2">Filters</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedReport.filters.map((filter) => (
                  <div key={filter}>
                    <label className="block text-xs font-medium text-stone-500 mb-1 capitalize">{filter}</label>
                    <input
                      type="text"
                      value={form.filters[filter] || ''}
                      onChange={(e) =>
                        setForm({ ...form, filters: { ...form.filters, [filter]: e.target.value } })
                      }
                      placeholder={`Enter ${filter}`}
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-2">Export Format</label>
            <div className="flex gap-4">
              {['Excel', 'CSV', 'PDF'].map((fmt) => (
                <label
                  key={fmt}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border cursor-pointer transition-all text-sm font-medium ${
                    form.format === fmt
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="format"
                    value={fmt}
                    checked={form.format === fmt}
                    onChange={(e) => setForm({ ...form, format: e.target.value })}
                    className="hidden"
                  />
                  {fmt}
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Generating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HiOutlineArrowDownTray size={16} />
                  Download
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
