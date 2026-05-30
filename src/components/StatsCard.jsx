export default function StatsCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colors = {
    primary: 'bg-stone-50 text-stone-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 luxury-shadow p-5 flex items-start gap-4 hover:luxury-shadow-md transition-all duration-300">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-widest">{title}</p>
        <p className="text-2xl font-bold text-stone-900 mt-1 truncate">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
