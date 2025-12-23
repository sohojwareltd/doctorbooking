import { Head, useForm, Link } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
  const { data, setData, post, processing, errors } = useForm({ email: '' });

  const submit = (e) => {
    e.preventDefault();
    post('/forgot-password');
  };

  return (
    <>
      <Head title="Forgot Password" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6">
          <h1 className="mb-2 text-xl font-semibold">Forgot password</h1>
          {status && <div className="mb-4 text-sm text-green-700">{status}</div>}

          <form onSubmit={submit}>
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

            <button
              type="submit"
              className="mt-4 w-full rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={processing}
            >
              Email password reset link
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-gray-600 underline">Back to login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
