import { motion } from 'framer-motion';

const VARIANTS = {
  blue:    { bg: 'bg-blue-50',    icon: 'bg-blue-500',    text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', icon: 'bg-emerald-500', text: 'text-emerald-600' },
  violet:  { bg: 'bg-violet-50',  icon: 'bg-violet-500',  text: 'text-violet-600' },
  amber:   { bg: 'bg-amber-50',   icon: 'bg-amber-500',   text: 'text-amber-600' },
  rose:    { bg: 'bg-rose-50',    icon: 'bg-rose-500',    text: 'text-rose-600' },
  cyan:    { bg: 'bg-cyan-50',    icon: 'bg-cyan-500',    text: 'text-cyan-600' },
  orange:  { bg: 'bg-orange-50',  icon: 'bg-orange-500',  text: 'text-orange-600' },
  teal:    { bg: 'bg-teal-50',    icon: 'bg-teal-500',    text: 'text-teal-600' },
  sky:     { bg: 'bg-sky-50',     icon: 'bg-sky-500',     text: 'text-sky-600' },
};

export default function StatCard({ label, value, icon: Icon, variant = 'blue', subtitle }) {
  const v = VARIANTS[variant] || VARIANTS.blue;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl bg-white border border-slate-200/60 p-5 overflow-hidden group doc-card-hover"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 leading-none">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>
        <div className={`flex-shrink-0 rounded-lg p-2.5 ${v.icon} shadow-sm`}>
          <Icon className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </motion.div>
  );
}
