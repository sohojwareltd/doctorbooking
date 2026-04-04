const AVATAR_COLORS = [
  'bg-violet-100 text-violet-700',
  'bg-sky-100 text-sky-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

function getColorClass(name) {
  return AVATAR_COLORS[(name || '').charCodeAt(0) % AVATAR_COLORS.length] || AVATAR_COLORS[0];
}

export default function PatientAvatar({ name, size = 'md', className = '' }) {
  const initial = (name || 'P')[0].toUpperCase();
  const color = getColorClass(name);
  const sizeClasses = {
    xs: 'h-7 w-7 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-14 w-14 text-xl',
  };

  return (
    <div className={`rounded-lg flex items-center justify-center font-bold flex-shrink-0 ${sizeClasses[size] || sizeClasses.md} ${color} ${className}`}>
      {initial}
    </div>
  );
}

export { getColorClass };
