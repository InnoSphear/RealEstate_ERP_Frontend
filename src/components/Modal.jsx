import { useEffect, useRef } from 'react';
import { HiOutlineXMark } from 'react-icons/hi2';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const overlayRef = useRef();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 sm:pt-24 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`w-full ${sizes[size]} bg-white rounded-2xl luxury-shadow-xl border border-stone-200 animate-scaleIn`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h3 className="text-base font-semibold text-stone-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-50 transition-all">
            <HiOutlineXMark size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
