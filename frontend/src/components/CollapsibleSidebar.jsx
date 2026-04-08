import DoctorSidebar from './DoctorSidebar';

export default function CollapsibleSidebar({ currentPath, collapsed, onToggleCollapse }) {
  return (
    <div className="h-full">
      <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-[#005963]/30 scrollbar-track-transparent hover:scrollbar-thumb-[#005963]/50">
        <DoctorSidebar
          currentPath={currentPath}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
        />
      </div>
    </div>
  );
}
