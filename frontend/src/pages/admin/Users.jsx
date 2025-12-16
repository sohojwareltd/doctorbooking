import { Head } from '@inertiajs/react';
import AdminLayout from '../../layouts/AdminLayout';

export default function Users({ users = [] }) {
  return (
    <>
      <Head title="Users" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="mb-6 text-3xl font-bold text-[#005963]">Users</h1>
        <div className="overflow-hidden rounded-2xl border">
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
                <tr key={u.id}>
                  <td className="px-4 py-3 text-sm">{u.name}</td>
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3 text-sm capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-sm">{u.created_at}</td>
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
      </div>
    </>
  );
}

Users.layout = (page) => <AdminLayout>{page}</AdminLayout>;
