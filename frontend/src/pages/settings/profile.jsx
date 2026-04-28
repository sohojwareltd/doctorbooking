import { Head, useForm } from '@inertiajs/react';
import { toastError, toastSuccess } from '../../utils/toast';

export default function ProfileSettings({ mustVerifyEmail, status }) {
  const { data, setData, patch, processing, errors } = useForm({
    name: '',
    email: '',
  });

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    if (cookie) return decodeURIComponent(cookie);

    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  };

  const submit = async (e) => {
    e.preventDefault();

    try {
      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
    } catch {
      // Continue with available token and let backend validation decide.
    }

    const csrfToken = getCsrfToken();

    patch('/settings/profile', {
      headers: {
        'X-CSRF-TOKEN': csrfToken,
        'X-XSRF-TOKEN': csrfToken,
      },
      onSuccess: () => toastSuccess('Profile updated.'),
      onError: () => toastError('Failed to update profile.'),
    });
  };

  return (
    <>
      <Head title="Profile" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold">Profile</h1>

        {status && <div className="mb-4 rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">{status}</div>}

        <form onSubmit={submit} className="rounded-xl border bg-white p-4">
          <label className="block text-sm font-medium" htmlFor="name">Name</label>
          <input
            id="name"
            className="mt-1 w-full rounded border px-3 py-2"
            value={data.name}
            onChange={(e) => setData('name', e.target.value)}
            required
          />
          {errors.name && <div className="mt-2 text-sm text-red-600">{errors.name}</div>}

          <label className="mt-4 block text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="mt-1 w-full rounded border px-3 py-2"
            value={data.email}
            onChange={(e) => setData('email', e.target.value)}
            required
          />
          {errors.email && <div className="mt-2 text-sm text-red-600">{errors.email}</div>}

          {mustVerifyEmail && (
            <p className="mt-4 text-sm text-gray-600">Your email must be verified to access all features.</p>
          )}

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
