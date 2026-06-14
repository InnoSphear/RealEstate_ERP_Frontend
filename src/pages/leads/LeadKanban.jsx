import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';
import { toast } from '../../components/Toast';

const stageConfig = [
  { key: 'new', label: 'New', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  { key: 'hot', label: 'Hot', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
  { key: 'warm', label: 'Warm', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  { key: 'cold', label: 'Cold', color: 'bg-stone-500', textColor: 'text-stone-700', bgColor: 'bg-stone-50', borderColor: 'border-stone-200' },
  { key: 'follow_up', label: 'Follow Up', color: 'bg-purple-500', textColor: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
  { key: 'site_visit', label: 'Site Visit', color: 'bg-pink-500', textColor: 'text-pink-700', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', borderColor: 'border-amber-200' },
  { key: 'won', label: 'Won', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
];

export default function LeadStages() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState('all');

  useEffect(() => {
    setLoading(true);
    API.get('/leads')
      .then((res) => {
        const grouped = {};
        stageConfig.forEach((s) => { grouped[s.key] = []; });
        res.data.forEach((lead) => {
          const status = lead.status || 'new';
          if (grouped[status]) grouped[status].push(lead);
          else grouped[status] = [lead];
        });
        setGroups(grouped);
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 403) toast('Access denied: Your role does not have permission to view leads', 'error');
        else toast('Failed to load leads', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-stone-900 border-t-transparent" />
      </div>
    );
  }

  const stages = activeStage === 'all'
    ? stageConfig
    : stageConfig.filter((s) => s.key === activeStage);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Lead Stages</h1>
        <p className="text-stone-500 mt-1">View leads grouped by their current stage</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveStage('all')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeStage === 'all' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          All Stages
        </button>
        {stageConfig.map((s) => {
          const count = (groups[s.key] || []).length;
          return (
            <button
              key={s.key}
              onClick={() => setActiveStage(s.key)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                activeStage === s.key ? `${s.bgColor} ${s.textColor}` : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${s.color}`} />
              {s.label}
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeStage === s.key ? 'bg-white/30' : 'bg-stone-200 text-stone-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="space-y-5">
        {stages.map((stage) => {
          const leads = groups[stage.key] || [];
          if (leads.length === 0) return null;
          return (
            <div key={stage.key} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className={`px-5 py-3 ${stage.bgColor} border-b ${stage.borderColor} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.color}`} />
                  <h3 className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stage.bgColor} ${stage.textColor}`}>
                  {leads.length} lead{leads.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-stone-600 text-xs">Name</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-stone-600 text-xs">Mobile</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-stone-600 text-xs">Source</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-stone-600 text-xs">Assigned To</th>
                      <th className="text-right px-4 py-2.5 font-semibold text-stone-600 text-xs">Score</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-stone-600 text-xs">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead) => (
                      <tr
                        key={lead._id}
                        onClick={() => navigate(`/leads/${lead._id}`)}
                        className="border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-stone-900">{lead.full_name}</span>
                          <span className="text-stone-400 ml-2 text-xs">{lead.lead_id}</span>
                        </td>
                        <td className="px-4 py-3 text-stone-600">{lead.mobile}</td>
                        <td className="px-4 py-3 text-stone-600 capitalize">{lead.source?.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-stone-600">{lead.assigned_to?.full_name || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={`text-xs font-semibold ${
                            lead.lead_score > 60 ? 'text-emerald-600' : lead.lead_score > 30 ? 'text-amber-600' : 'text-stone-500'
                          }`}>{lead.lead_score || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-stone-500 text-xs">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
