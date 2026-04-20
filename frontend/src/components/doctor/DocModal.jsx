import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function DocModal({
  open,
  onClose,
  title,
  icon: Icon,
  children,
  size = 'md',
  footer,
  overlayClassName = '',
  panelClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
      document.addEventListener('keydown', handleEsc);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleEsc);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size] || 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 sm:items-center sm:pt-4" onClick={onClose}>
      <div className={`absolute inset-0 bg-[rgba(24,34,63,0.58)] backdrop-blur-[2px] ${overlayClassName}`} />
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl border border-[var(--doc-border)] bg-white shadow-2xl ${widthClass} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className={`flex items-center justify-between border-b border-[var(--doc-border-light)] bg-[var(--doc-primary-light)]/35 px-6 py-4 ${headerClassName}`}>
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="rounded-lg bg-white/90 p-2">
                  <Icon className="h-4 w-4 text-[var(--doc-primary)]" />
                </div>
              )}
              <h3 className="text-base font-semibold text-[var(--doc-text)]">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--doc-text-light)] transition hover:bg-white hover:text-[var(--doc-text)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={`flex-1 overflow-y-auto h-full px-6 py-5 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className={`flex items-center justify-end gap-2 border-t border-[var(--doc-border-light)] bg-[var(--doc-primary-light)]/25 px-6 py-4 ${footerClassName}`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
