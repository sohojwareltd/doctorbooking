export function DocButton({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:     'text-slate-600 hover:bg-slate-100',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    accent:    'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function DocLinkButton({ children, variant = 'primary', size = 'md', className = '', href, ...props }) {
  const { Link } = require('@inertiajs/react');
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.97]';

  const variants = {
    primary:   'bg-sky-600 text-white hover:bg-sky-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 shadow-sm',
    ghost:     'text-slate-600 hover:bg-slate-100',
    accent:    'bg-teal-600 text-white hover:bg-teal-700 shadow-sm',
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-base',
  };

  return (
    <Link href={href} className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`} {...props}>
      {children}
    </Link>
  );
}

export function DocInput({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <input
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition doc-input-focus ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-slate-200'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function DocSelect({ label, error, className = '', children, ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>}
      <select
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 transition doc-input-focus ${error ? 'border-red-300' : 'border-slate-200'}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function handleDocCardPointerMove(e) {
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  e.currentTarget.style.setProperty('--mx', `${x}px`);
  e.currentTarget.style.setProperty('--my', `${y}px`);
}

function handleDocCardPointerLeave(e) {
  e.currentTarget.style.setProperty('--mx', '50%');
  e.currentTarget.style.setProperty('--my', '50%');
}

export function DocCard({ children, className = '', padding = true }) {
  return (
    <div
      className={`doc-card-hover doc-card-reactive rounded-xl bg-white border border-slate-200/60 shadow-sm ${padding ? 'p-5' : ''} ${className}`}
      style={{ '--mx': '50%', '--my': '50%' }}
      onMouseMove={handleDocCardPointerMove}
      onMouseLeave={handleDocCardPointerLeave}
    >
      {children}
    </div>
  );
}

export function DocCardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4.5 w-4.5 text-slate-400" style={{ width: 18, height: 18 }} />}
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function DocEmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="py-12 text-center">
      {Icon && (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100">
          <Icon className="h-6 w-6 text-slate-300" />
        </div>
      )}
      <p className="text-sm font-medium text-slate-400">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-300">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
