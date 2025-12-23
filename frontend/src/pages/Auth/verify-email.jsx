import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
  const { post, processing } = useForm({});

  return (
    <>
      <Head title="Verify Email" />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6">
          <h1 className="mb-2 text-xl font-semibold">Verify your email</h1>
          <p className="mb-4 text-sm text-gray-600">Please verify your email address by clicking the link we just emailed to you.</p>

          {status && <div className="mb-4 text-sm text-green-700">{status}</div>}

          <button
            type="button"
            className="w-full rounded bg-[#005963] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            disabled={processing}
            onClick={() => post('/email/verification-notification')}
          >
            Resend verification email
          </button>

          <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-gray-600 underline">Go home</Link>
          </div>
        </div>
      </div>
    </>
  );
}
