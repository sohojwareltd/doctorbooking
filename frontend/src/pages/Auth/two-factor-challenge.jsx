import { Head, useForm } from '@inertiajs/react';

export default function TwoFactorChallenge() {
  const { data, setData, post, processing, errors } = useForm({
    code: '',
    recovery_code: '',
  });

  const submit = (e) => {
    e.preventDefault();
    post('/two-factor-challenge');
  };

  return (
    <>
      <Head title="Two Factor Challenge" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6">
          <h1 className="mb-2 text-xl font-semibold">Two-Factor Authentication</h1>
          <p className="mb-4 text-sm text-gray-600">Enter your authentication code or a recovery code.</p>

          <form onSubmit={submit}>
            <label className="block text-sm font-medium text-gray-700" htmlFor="code">Authentication code</label>
            <input
              id="code"
              className="mt-1 w-full rounded border px-3 py-2"
              value={data.code}
              onChange={(e) => setData('code', e.target.value)}
              autoComplete="one-time-code"
            />
            {errors.code && <div className="mt-2 text-sm text-red-600">{errors.code}</div>}

            <div className="my-4 text-center text-xs text-gray-500">OR</div>

            <label className="block text-sm font-medium text-gray-700" htmlFor="recovery_code">Recovery code</label>
            <input
              id="recovery_code"
              className="mt-1 w-full rounded border px-3 py-2"
              value={data.recovery_code}
              onChange={(e) => setData('recovery_code', e.target.value)}
              autoComplete="one-time-code"
            />
            {errors.recovery_code && <div className="mt-2 text-sm text-red-600">{errors.recovery_code}</div>}

            <button
              type="submit"
              className="mt-4 w-full rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              disabled={processing}
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
