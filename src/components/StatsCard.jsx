export default function StatsCard({ title, value, icon: Icon, color = 'primary', subtitle }) {
  const colors = {
    primary: 'bg-blue-50 text-blue-600',
    success: 'bg-green-50 text-green-600',
    warning: 'bg-yellow-50 text-yellow-600',
    danger: 'bg-red-50 text-red-600',
    info: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-surface rounded-xl border border-border shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-text mt-1">{value ?? '-'}</p>
        {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
