import { createRoot } from 'react-dom/client';

export function toast(message, type = 'success', duration = 3000) {
  const container = document.createElement('div');
  container.className = 'fixed top-4 right-4 z-[100] animate-in';
  document.body.appendChild(container);

  const bg = type === 'error' ? 'bg-red-50 border-red-200 text-red-700'
    : type === 'warning' ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
    : 'bg-green-50 border-green-200 text-green-700';

  const root = createRoot(container);
  root.render(
    <div className={`${bg} border px-4 py-3 rounded-lg shadow-lg text-sm font-medium flex items-center gap-2 min-w-[280px]`}>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => { root.unmount(); container.remove(); }}
        className="text-current opacity-60 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );

  setTimeout(() => {
    root.unmount();
    container.remove();
  }, duration);
}
