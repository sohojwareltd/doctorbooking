export function DocButton({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-[var(--doc-primary)] text-white hover:bg-[var(--doc-primary-hover)] shadow-sm',
    secondary: 'bg-white text-[var(--doc-text)] border border-[var(--doc-border)] hover:bg-[var(--doc-primary-light)]/30 shadow-sm',
    danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
    ghost:     'text-[var(--doc-text-muted)] hover:bg-[var(--doc-primary-light)]/45',
    success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
    accent:    'bg-[var(--doc-accent)] text-white hover:bg-[var(--doc-accent-hover)] shadow-sm',
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
    primary:   'bg-[var(--doc-primary)] text-white hover:bg-[var(--doc-primary-hover)] shadow-sm',
    secondary: 'bg-white text-[var(--doc-text)] border border-[var(--doc-border)] hover:bg-[var(--doc-primary-light)]/30 shadow-sm',
    ghost:     'text-[var(--doc-text-muted)] hover:bg-[var(--doc-primary-light)]/45',
    accent:    'bg-[var(--doc-accent)] text-white hover:bg-[var(--doc-accent-hover)] shadow-sm',
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
      {label && <label className="mb-1.5 block text-sm font-medium text-[var(--doc-text)]">{label}</label>}
      <input
        className={`doc-input-focus w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[var(--doc-text)] placeholder-[var(--doc-text-light)] transition ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-[var(--doc-border)]'}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function DocSelect({ label, error, className = '', children, ...props }) {
  return (
    <div className={className}>
      {label && <label className="mb-1.5 block text-sm font-medium text-[var(--doc-text)]">{label}</label>}
      <select
        className={`doc-input-focus w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-[var(--doc-text)] transition ${error ? 'border-red-300' : 'border-[var(--doc-border)]'}`}
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

export function DocCard({ children, className = '', padding = true, style }) {
  const isBannerCard = className.includes('doc-banner-root');

  return (
    <div
      className={`${isBannerCard ? '' : 'doc-card-hover doc-card-reactive'} doc-panel rounded-3xl border shadow-sm ${padding ? 'p-5' : ''} ${className}`}
      style={isBannerCard ? style : { '--mx': '50%', '--my': '50%', ...style }}
      onMouseMove={isBannerCard ? undefined : handleDocCardPointerMove}
      onMouseLeave={isBannerCard ? undefined : handleDocCardPointerLeave}
    >
      {children}
    </div>
  );
}

export function DocCardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        {Icon && <Icon className="h-4.5 w-4.5 text-[var(--doc-text-light)]" style={{ width: 18, height: 18 }} />}
        <div>
          <h3 className="text-sm font-semibold text-[var(--doc-text)]">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[var(--doc-text-light)]">{subtitle}</p>}
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
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--doc-primary-light)]">
          <Icon className="h-6 w-6 text-[var(--doc-primary)]" />
        </div>
      )}
      <p className="text-sm font-medium text-[var(--doc-text-muted)]">{title}</p>
      {description && <p className="mt-1 text-xs text-[var(--doc-text-light)]">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
