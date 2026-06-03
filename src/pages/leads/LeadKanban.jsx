import { useState, useEffect } from 'react';
import API from '../../api/axios';
import { toast } from '../../components/Toast';

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  contacted: { label: 'Contacted', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  hot: { label: 'Hot', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  warm: { label: 'Warm', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  cold: { label: 'Cold', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
  follow_up: { label: 'Follow Up', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  site_visit: { label: 'Site Visit', color: 'bg-pink-500', textColor: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  negotiation: { label: 'Negotiation', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  won: { label: 'Won', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  lost: { label: 'Lost', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
};

const statusOrder = ['new', 'contacted', 'hot', 'warm', 'cold', 'follow_up', 'site_visit', 'negotiation', 'won', 'lost'];

function getScoreColor(score) {
  if (!score && score !== 0) return 'bg-gray-300';
  if (score <= 30) return 'bg-red-500';
  if (score <= 60) return 'bg-yellow-500';
  return 'bg-green-500';
}

export default function LeadKanban() {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [draggedLead, setDraggedLead] = useState(null);

  const fetchData = () => {
    setLoading(true);
    API.get('/leads')
      .then((res) => {
        const grouped = {};
        statusOrder.forEach((s) => { grouped[s] = []; });
        res.data.forEach((lead) => {
          const status = lead.status || 'new';
          if (grouped[status]) grouped[status].push(lead);
          else grouped[status] = [lead];
        });
        setGroups(grouped);
      })
      .catch(() => toast('Failed to load leads', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDragStart = (lead, e) => {
    setDraggedLead(lead);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', lead._id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (statusKey, e) => {
    e.preventDefault();
    if (!draggedLead || draggedLead.status === statusKey) {
      setDraggedLead(null);
      return;
    }

    const prevStatus = draggedLead.status;
    const prevGroups = { ...groups };
    const updated = { ...draggedLead, status: statusKey };
    const newGroups = { ...groups };
    newGroups[prevStatus] = newGroups[prevStatus].filter((l) => l._id !== updated._id);
    newGroups[statusKey] = [...newGroups[statusKey], updated];
    setGroups(newGroups);

    try {
      await API.put(`/leads/${updated._id}`, { status: statusKey });
      toast(`Lead moved to ${statusConfig[statusKey]?.label || statusKey}`);
    } catch (err) {
      setGroups(prevGroups);
      toast('Failed to update status', 'error');
    }
    setDraggedLead(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Lead Kanban</h1>
        <p className="text-stone-500 mt-1">Drag and drop leads between stages</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[70vh]">
        {statusOrder.map((key) => {
          const cfg = statusConfig[key];
          const leads = groups[key] || [];
          return (
            <div
              key={key}
              className="flex-shrink-0 w-72 bg-stone-50 rounded-2xl border border-stone-200 flex flex-col"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(key, e)}
            >
              <div className={`px-4 py-3 rounded-t-2xl ${cfg.bgColor} border-b ${cfg.borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.color}`} />
                  <h3 className={`text-sm font-semibold ${cfg.textColor}`}>{cfg.label}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bgColor} ${cfg.textColor}`}>{leads.length}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-[calc(100vh-280px)]">
                {leads.length === 0 && (
                  <div className="text-center py-6 text-stone-400 text-xs">No leads</div>
                )}
                {leads.map((lead) => (
                  <div
                    key={lead._id}
                    draggable
                    onDragStart={(e) => handleDragStart(lead, e)}
                    className={`bg-white rounded-xl border border-stone-200 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${draggedLead?._id === lead._id ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-stone-900">{lead.full_name}</h4>
                      <span className="text-xs text-stone-400">{lead.lead_id || '-'}</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-stone-500">
                      <p>{lead.mobile || '-'}</p>
                      <p className="capitalize">Source: {lead.source?.replace(/_/g, ' ') || '-'}</p>
                      <p>Assigned: {lead.assigned_to?.name || lead.assigned_to?.full_name || 'Unassigned'}</p>
                      <p>Created: {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</p>
                    </div>
                    {lead.lead_score !== undefined && (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${getScoreColor(lead.lead_score)}`} style={{ width: `${Math.min(lead.lead_score || 0, 100)}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-stone-500">{lead.lead_score || 0}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
