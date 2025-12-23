import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
  const { data, setData, post, processing, errors } = useForm({
    token: token || '',
    email: email || '',
    password: '',
    password_confirmation: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post('/reset-password');
  };

  return (
    <>
      <Head title="Reset Password" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6">
          <h1 className="mb-4 text-xl font-semibold">Reset password</h1>
          <form onSubmit={submit}>
            <input type="hidden" value={data.token} readOnly />

            <label className="block text-sm font-medium text-gray-700" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded border px-3 py-2"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            {errors.email && <div className="mt-2 text-sm text-red-600">{errors.email}</div>}

            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded border px-3 py-2"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            {errors.password && <div className="mt-2 text-sm text-red-600">{errors.password}</div>}

            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="password_confirmation">Confirm password</label>
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
              className="mt-4 w-full rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={processing}
            >
              Reset password
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
