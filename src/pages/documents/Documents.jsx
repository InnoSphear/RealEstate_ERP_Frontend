import { useState, useEffect } from 'react';
import API from '../../api/axios';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';
import {
  HiOutlineDocumentText, HiOutlinePhoto, HiOutlineDocumentArrowDown,
  HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineCloudArrowUp,
  HiOutlineFolder, HiOutlineDocument, HiOutlineTableCells,
} from 'react-icons/hi2';

const moduleTabs = [
  { key: '', label: 'All', icon: HiOutlineFolder },
  { key: 'property', label: 'Properties', icon: HiOutlineDocumentText },
  { key: 'client', label: 'Clients', icon: HiOutlineFolder },
  { key: 'employee', label: 'Employees', icon: HiOutlineFolder },
  { key: 'project', label: 'Projects', icon: HiOutlineFolder },
];

const fileIconMap = {
  pdf: HiOutlineDocumentText,
  doc: HiOutlineDocumentText,
  docx: HiOutlineDocumentText,
  jpg: HiOutlinePhoto,
  jpeg: HiOutlinePhoto,
  png: HiOutlinePhoto,
  gif: HiOutlinePhoto,
  svg: HiOutlinePhoto,
  xls: HiOutlineTableCells,
  xlsx: HiOutlineTableCells,
  default: HiOutlineDocument,
};

const fileColors = {
  pdf: 'text-red-500 bg-red-50',
  doc: 'text-blue-500 bg-blue-50',
  docx: 'text-blue-500 bg-blue-50',
  jpg: 'text-emerald-500 bg-emerald-50',
  jpeg: 'text-emerald-500 bg-emerald-50',
  png: 'text-emerald-500 bg-emerald-50',
  gif: 'text-emerald-500 bg-emerald-50',
  svg: 'text-purple-500 bg-purple-50',
  xls: 'text-green-500 bg-green-50',
  xlsx: 'text-green-500 bg-green-50',
  default: 'text-stone-500 bg-stone-50',
};

function getFileExt(name) {
  const parts = name?.split('.');
  return parts?.length > 1 ? parts.pop().toLowerCase() : '';
}

function formatSize(bytes) {
  if (!bytes) return '-';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [moduleItems, setModuleItems] = useState([]);
  const [form, setForm] = useState({
    module: 'property',
    module_item_id: '',
    name: '',
    file: null,
  });

  const fetchDocuments = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab) params.append('module', activeTab);
    if (search) params.append('search', search);
    API.get(`/documents?${params.toString()}`)
      .then((res) => setDocuments(res.data || []))
      .catch(() => toast('Failed to load documents', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocuments(); }, [activeTab, search]);

  const openUpload = () => {
    setForm({ module: 'property', module_item_id: '', name: '', file: null });
    setModuleItems([]);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen || !form.module) return;
    const endpoints = {
      property: '/properties',
      client: '/clients',
      employee: '/users',
      project: '/interior-projects',
    };
    API.get(endpoints[form.module] || '/properties')
      .then((res) => setModuleItems(Array.isArray(res.data) ? res.data : []))
      .catch(() => setModuleItems([]));
  }, [form.module, modalOpen]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.file || !form.module_item_id) {
      toast('Please select a file and item', 'error');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', form.file);
      fd.append('module', form.module);
      fd.append('module_item_id', form.module_item_id);
      if (form.name) fd.append('name', form.name);
      await API.post('/documents', fd);
      toast('Document uploaded');
      setModalOpen(false);
      fetchDocuments();
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await API.delete(`/documents/${selectedDoc._id}`);
      toast('Document deleted');
      fetchDocuments();
    } catch (err) {
      toast('Error deleting document', 'error');
    }
  };

  const handleDownload = async (doc) => {
    try {
      const res = await API.get(`/documents/${doc._id}/download`, { responseType: 'blob' });
      const ext = getFileExt(doc.file_name || doc.name);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.file_name || `document.${ext}` || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast('Download failed', 'error');
    }
  };

  const filtered = documents.filter((doc) => {
    const name = (doc.name || doc.file_name || '').toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const getModuleLabel = (mod) => {
    const tabs = {
      property: 'Properties',
      client: 'Clients',
      employee: 'Employees',
      project: 'Projects',
    };
    return tabs[mod] || mod;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Documents</h1>
          <p className="text-stone-500 mt-1">Manage all documents across modules</p>
        </div>
        <button
          onClick={openUpload}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
        >
          <HiOutlineCloudArrowUp size={16} />
          Upload Document
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-1.5 bg-white rounded-2xl border border-stone-200 p-1">
          {moduleTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-50'
                }`}
              >
                <TabIcon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" size={17} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-stone-900 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-14 text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HiOutlineDocumentText className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-base font-semibold text-stone-700 mb-1">No documents found</h3>
          <p className="text-sm text-stone-400">Upload a document to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((doc) => {
            const ext = getFileExt(doc.file_name || doc.name || '');
            const Icon = fileIconMap[ext] || fileIconMap.default;
            const color = fileColors[ext] || fileColors.default;
            const previewUrl = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'pdf'].includes(ext)
              ? doc.file_url || doc.url
              : null;

            return (
              <div
                key={doc._id}
                className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-4 hover:luxury-shadow-md transition-all duration-300 group"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800 truncate">
                      {doc.name || doc.file_name || 'Untitled'}
                    </p>
                    <p className="text-xs text-stone-400 mt-0.5 capitalize">
                      {getModuleLabel(doc.module || doc.module_id)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-stone-400 mb-3">
                  <span>{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ''}</span>
                  <span>{formatSize(doc.file_size || doc.size)}</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 border border-stone-200 transition-colors text-center"
                    >
                      Preview
                    </a>
                  )}
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 border border-stone-200 transition-colors inline-flex items-center justify-center gap-1"
                  >
                    <HiOutlineDocumentArrowDown size={14} />
                    Download
                  </button>
                  <button
                    onClick={() => { setSelectedDoc(doc); setConfirmOpen(true); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 border border-red-200 transition-colors"
                  >
                    <HiOutlineTrash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Upload Document" size="md">
        <form onSubmit={handleUpload} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Module *</label>
            <select
              value={form.module}
              onChange={(e) => setForm({ ...form, module: e.target.value, module_item_id: '' })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="property">Property</option>
              <option value="client">Client</option>
              <option value="employee">Employee</option>
              <option value="project">Project</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Select Item *</label>
            <select
              value={form.module_item_id}
              onChange={(e) => setForm({ ...form, module_item_id: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="">Select {form.module}</option>
              {moduleItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.full_name || item.title || item.name || item.project_name || item._id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Document Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Agreement, Blueprint..."
              className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">File *</label>
            <div className="border-2 border-dashed border-stone-200 rounded-xl p-6 text-center hover:border-stone-400 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
                className="hidden"
                id="file-upload"
                required
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <HiOutlineCloudArrowUp size={28} className="mx-auto text-stone-400 mb-2" />
                <p className="text-sm text-stone-500">
                  {form.file ? form.file.name : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-stone-400 mt-1">PDF, DOC, JPG, PNG up to 10MB</p>
              </label>
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
              disabled={uploading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-0 bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/10"
            >
              {uploading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <HiOutlineCloudArrowUp size={16} />
                  Upload
                </span>
              )}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
      />
    </div>
  );
}
