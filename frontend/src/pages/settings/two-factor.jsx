import { Head } from '@inertiajs/react';

export default function TwoFactorSettings({ twoFactorEnabled, requiresConfirmation }) {
  return (
    <>
      <Head title="Two Factor" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold">Two-factor authentication</h1>
        <div className="rounded-xl border bg-white p-4 text-sm">
          <div>Enabled: {twoFactorEnabled ? 'Yes' : 'No'}</div>
          <div>Requires confirmation: {requiresConfirmation ? 'Yes' : 'No'}</div>
        </div>
      </div>
    </>
  );
}
