import { Head } from '@inertiajs/react';
import { Users as UsersIcon } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import GlassCard from '../../components/GlassCard';

export default function Users({ users = [] }) {
  return (
    <>
      <Head title="Users" />
      <div className="w-full px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-[#005963]/10 p-3">
            <UsersIcon className="h-6 w-6 text-[#005963]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#005963]">Users</h1>
            <p className="mt-1 text-sm text-gray-700">Manage registered accounts and roles.</p>
          </div>
        </div>

        <GlassCard variant="solid" hover={false} className="overflow-hidden">
          <div className="border-b bg-white px-4 py-4">
            <div className="text-sm text-gray-700">
              Total users: <span className="font-semibold text-[#005963]">{users.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y bg-white">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-semibold text-[#005963]">{u.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.email}</td>
                    <td className="px-4 py-3 text-sm capitalize text-gray-700">{u.role}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{u.created_at}</td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-gray-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

Users.layout = (page) => <AdminLayout>{page}</AdminLayout>;
