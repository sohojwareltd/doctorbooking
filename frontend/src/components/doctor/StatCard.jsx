import { motion } from 'framer-motion';

const VARIANTS = {
  blue: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#eef3ff]',
    border: 'border-[#dce5f6]',
    pill: 'bg-[#eef3ff] text-[#5068b5]',
    value: 'text-[#253560]',
    icon: 'bg-[#4663ba]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(49,79,158,0.9)]',
    bar: 'bg-[#768fda]',
  },
  emerald: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#edf8f0]',
    border: 'border-[#dceddf]',
    pill: 'bg-[#e8f6ed] text-[#498f61]',
    value: 'text-[#27493a]',
    icon: 'bg-[#45975d]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(47,125,79,0.9)]',
    bar: 'bg-[#58b173]',
  },
  violet: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#f2eeff]',
    border: 'border-[#e4def6]',
    pill: 'bg-[#f1ecff] text-[#6657b2]',
    value: 'text-[#35305f]',
    icon: 'bg-[#6c58b9]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(91,70,159,0.9)]',
    bar: 'bg-[#7f6acf]',
  },
  amber: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#feefe4]',
    border: 'border-[#f2dfd0]',
    pill: 'bg-[#fff1e5] text-[#c27a47]',
    value: 'text-[#6a4128]',
    icon: 'bg-[#d4894d]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(185,106,57,0.92)]',
    bar: 'bg-[#dfa170]',
  },
  rose: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#fdeef2]',
    border: 'border-[#f0dce3]',
    pill: 'bg-[#fdebf0] text-[#bc627b]',
    value: 'text-[#5e3240]',
    icon: 'bg-[#cf6d89]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(185,85,112,0.9)]',
    bar: 'bg-[#d88da0]',
  },
  cyan: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#ebf7ff]',
    border: 'border-[#d9ecf5]',
    pill: 'bg-[#e8f8fd] text-[#2c8fb8]',
    value: 'text-[#234d62]',
    icon: 'bg-[#22a6c9]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(20,144,177,0.9)]',
    bar: 'bg-[#78c3df]',
  },
  orange: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#fff0e5]',
    border: 'border-[#f3e0d2]',
    pill: 'bg-[#fff1e5] text-[#c27237]',
    value: 'text-[#674021]',
    icon: 'bg-[#da8140]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(199,109,47,0.9)]',
    bar: 'bg-[#e4a473]',
  },
  teal: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#e8f7f4]',
    border: 'border-[#d8ebe6]',
    pill: 'bg-[#e8f6f2] text-[#2f877a]',
    value: 'text-[#264a43]',
    icon: 'bg-[#389b8d]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(35,123,109,0.9)]',
    bar: 'bg-[#74c3b6]',
  },
  sky: {
    surface: 'bg-gradient-to-br from-[#ffffff] to-[#ebf5ff]',
    border: 'border-[#d9e8f5]',
    pill: 'bg-[#eaf4ff] text-[#3d84b7]',
    value: 'text-[#24475f]',
    icon: 'bg-[#3b97d5]',
    iconShadow: 'shadow-[0_14px_24px_-16px_rgba(42,121,183,0.9)]',
    bar: 'bg-[#7eb9e7]',
  },
};

export default function StatCard({ label, value, icon: Icon, variant = 'blue', subtitle }) {
  const v = VARIANTS[variant] || VARIANTS.blue;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`group relative min-h-[152px] overflow-hidden rounded-[28px] border px-6 pb-5 pt-5 shadow-[0_18px_40px_-32px_rgba(37,53,102,0.38)] transition-shadow duration-200 hover:shadow-[0_20px_42px_-28px_rgba(37,53,102,0.44)] ${v.surface} ${v.border}`}
    >
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-4">
          <span className={`inline-flex max-w-full rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] ${v.pill}`}>
            {label}
          </span>
          <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] text-white ring-1 ring-white/70 ${v.icon} ${v.iconShadow}`}>
            <Icon className="text-white" style={{ width: 20, height: 20 }} />
          </div>
        </div>

        <div className="mt-8 flex flex-1 flex-col justify-end">
          <div className="flex items-end gap-3">
            <p className={`text-[3rem] font-bold leading-none tracking-[-0.05em] ${v.value}`}>{value}</p>
            {subtitle && <p className="pb-1 text-xs font-medium text-slate-500">{subtitle}</p>}
          </div>
          <div className={`mt-5 h-[5px] w-24 rounded-full ${v.bar}`} />
        </div>
      </div>
    </motion.div>
  );
}
