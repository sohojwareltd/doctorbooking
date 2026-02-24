import { Head, Link, usePage } from "@inertiajs/react";
import UserSidebar from "../components/UserSidebar";
import { Bell, Menu, Settings, User, X } from "lucide-react";
import { useState } from "react";

export default function UserLayout({ children, title = "" }) {
  const page = usePage();
  const auth = page.props?.auth;
  const currentUrl = page.url;
  const user = auth?.user;
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Head title={title ? `${title} - Patient Dashboard` : "Patient Dashboard"} />
      <div className="min-h-screen bg-gray-50 flex">
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/30 z-30" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`fixed top-0 left-0 h-screen w-56 bg-white border-r border-gray-200 z-40 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
          <UserSidebar currentPath={currentUrl} />
        </aside>
        <div className="flex-1 lg:ml-56 flex flex-col min-h-screen">
          <header className="sticky top-0 z-20 bg-white border-b border-gray-200 h-12 flex items-center px-5 gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-1 rounded-md hover:bg-gray-100 transition">
              {sidebarOpen ? <X className="h-4 w-4 text-gray-500" /> : <Menu className="h-4 w-4 text-gray-500" />}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <button className="relative p-1.5 rounded-md hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>
              <button className="p-1.5 rounded-md hover:bg-gray-100 transition text-gray-400 hover:text-gray-600">
                <Settings className="h-4 w-4" />
              </button>
              <div className="w-px h-5 bg-gray-200 mx-1" />
              <Link href="/user/profile" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-full overflow-hidden bg-gradient-to-br from-[#005963] to-[#00acb1] flex items-center justify-center shrink-0">
                  {user?.profile_picture ? (
                    <img src={user.profile_picture.startsWith("http") ? user.profile_picture : `/storage/${user.profile_picture}`} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-white" />
                  )}
                </div>
              </Link>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </>
  );
}
