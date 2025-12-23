import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
  const { data, setData, post, processing, errors } = useForm({
    password: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post('/user/confirm-password');
  };

  return (
    <>
      <Head title="Confirm Password" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6">
          <h1 className="mb-2 text-xl font-semibold">Confirm Password</h1>
          <p className="mb-4 text-sm text-gray-600">Please confirm your password before continuing.</p>

          <form onSubmit={submit}>
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded border px-3 py-2"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              required
              autoComplete="current-password"
            />
            {errors.password && <div className="mt-2 text-sm text-red-600">{errors.password}</div>}

            <button
              type="submit"
              className="mt-4 w-full rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={processing}
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
