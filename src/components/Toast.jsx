import { createRoot } from 'react-dom/client';

export function toast(message, type = 'success', duration = 3000) {
  const container = document.createElement('div');
  container.className = 'fixed top-5 right-5 z-[100] animate-in';
  document.body.appendChild(container);

  const styles = {
    success: 'bg-white border-stone-200 text-stone-800',
    error: 'bg-white border-red-200 text-red-700',
    warning: 'bg-white border-amber-200 text-amber-700',
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '!',
  };

  const root = createRoot(container);
  root.render(
    <div className={`${styles[type]} border px-4 py-3.5 rounded-2xl luxury-shadow-lg text-sm font-medium flex items-center gap-3 min-w-[300px] max-w-md`}>
      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${type === 'success' ? 'bg-emerald-50 text-emerald-700' : type === 'error' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{icons[type]}</span>
      <span className="flex-1">{message}</span>
      <button
        onClick={() => { root.unmount(); container.remove(); }}
        className="text-stone-400 hover:text-stone-600 transition-colors"
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
