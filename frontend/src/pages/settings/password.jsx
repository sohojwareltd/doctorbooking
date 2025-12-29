import { Head, useForm } from '@inertiajs/react';
import { toastError, toastSuccess } from '../../utils/toast';

export default function PasswordSettings() {
  const { data, setData, put, processing, errors } = useForm({
    current_password: '',
    password: '',
    password_confirmation: '',
  });

  const submit = (e) => {
    e.preventDefault();
    put('/settings/password', {
      onSuccess: () => toastSuccess('Password updated.'),
      onError: () => toastError('Failed to update password.'),
    });
  };

  return (
    <>
      <Head title="Password" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Password</h1>
        <form onSubmit={submit} className="rounded-xl border bg-white p-4">
          <label className="block text-sm font-medium" htmlFor="current_password">Current password</label>
          <input
            id="current_password"
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={data.current_password}
            onChange={(e) => setData('current_password', e.target.value)}
            required
          />
          {errors.current_password && <div className="mt-2 text-sm text-red-600">{errors.current_password}</div>}

          <label className="mt-4 block text-sm font-medium" htmlFor="password">New password</label>
          <input
            id="password"
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={data.password}
            onChange={(e) => setData('password', e.target.value)}
            required
          />
          {errors.password && <div className="mt-2 text-sm text-red-600">{errors.password}</div>}

          <label className="mt-4 block text-sm font-medium" htmlFor="password_confirmation">Confirm new password</label>
          <input
            id="password_confirmation"
            type="password"
            className="mt-1 w-full rounded border px-3 py-2"
            value={data.password_confirmation}
            onChange={(e) => setData('password_confirmation', e.target.value)}
            required
          />

          <button
            type="submit"
            className="mt-4 rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={processing}
          >
            Save
          </button>
        </form>
      </div>
    </>
  );
}
