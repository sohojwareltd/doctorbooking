import { Link } from '@inertiajs/react';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items = [] }) {
  return (
    <nav className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-white/50 backdrop-blur-sm border border-[#00acb1]/10">
      <Link href="/doctor/dashboard" className="flex items-center gap-1 text-sm font-semibold text-[#005963] hover:text-[#00acb1] transition">
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>

      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.href ? (
            <Link href={item.href} className="text-sm font-semibold text-[#005963] hover:text-[#00acb1] transition">
              {item.label}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-gray-600">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
