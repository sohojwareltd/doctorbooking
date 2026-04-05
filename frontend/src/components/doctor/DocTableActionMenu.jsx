import { useEffect, useMemo, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function DocTableActionMenu({ items = [] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const visibleItems = useMemo(() => items.filter((item) => item && !item.hidden), [items]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutsideClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const hasItems = visibleItems.length > 0;

  const getToneClassName = (tone) => {
    switch (tone) {
      case 'danger':
        return 'border-[#f3d8e0] bg-[#fff4f7] text-rose-600 hover:border-[#e9b9c8] hover:bg-[#ffecef]';
      case 'emerald':
        return 'border-[#d7efe3] bg-[#eefaf3] text-emerald-600 hover:border-[#bfe5d3] hover:bg-[#e6f7ee]';
      case 'amber':
        return 'border-[#f3e3ce] bg-[#fff5ea] text-[#bd7b43] hover:border-[#ead0ad] hover:bg-[#fff0df]';
      case 'violet':
        return 'border-[#e4def6] bg-[#f6f3ff] text-violet-600 hover:border-[#d4c9f2] hover:bg-[#efe9ff]';
      case 'slate':
        return 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100';
      case 'accent':
      default:
        return 'border-[#d8e5fb] bg-[#eff5ff] text-[#3556a6] hover:border-[#c5d8f7] hover:bg-[#e6f0ff]';
    }
  };

  return (
    <div ref={rootRef} className="relative inline-flex min-h-[40px] min-w-[156px] items-center justify-end">
      <button
        type="button"
        disabled={!hasItems}
        onClick={() => setOpen((prev) => !prev)}
        className={`relative z-10 inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm transition ${hasItems ? `${open ? 'border-[#c8d7f2] bg-[#eef4ff] text-[#3556a6]' : 'border-slate-200 bg-white text-slate-500'} hover:border-sky-200 hover:text-sky-600 hover:shadow-[0_10px_20px_-16px_rgba(37,53,102,0.45)]` : 'cursor-not-allowed border-slate-100 bg-white text-slate-300 opacity-70'}`}
        aria-label="Open row actions"
        title={hasItems ? 'Show row actions' : 'No actions available'}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && hasItems && (
        <div className="absolute right-11 top-1/2 z-20 flex -translate-y-1/2 items-center gap-1.5 rounded-full border border-[#dce4f3] bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(241,245,255,0.96))] px-2 py-1.5 shadow-[0_18px_34px_-20px_rgba(37,53,102,0.45)]">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key || item.label}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${getToneClassName(item.tone)}`}
                aria-label={item.label}
                title={item.label}
              >
                {Icon ? <Icon className="h-4 w-4 flex-shrink-0" /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}