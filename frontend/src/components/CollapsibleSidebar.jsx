import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import DoctorSidebar from './DoctorSidebar';

export default function CollapsibleSidebar({ currentPath }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="relative h-full flex items-center">
      {/* Sidebar */}
      <div
        className={`h-full transition-all duration-300 overflow-hidden flex-shrink-0 ${
          isCollapsed ? 'w-0' : 'w-full lg:w-auto'
        }`}
      >
        <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#005963]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#005963]/50">
          <DoctorSidebar currentPath={currentPath} />
        </div>
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex-shrink-0 bg-[#005963] text-white rounded-full p-1.5 shadow-lg hover:bg-[#00acb1] transition -ml-3 z-40"
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </div>
  );
}
