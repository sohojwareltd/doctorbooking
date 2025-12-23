import { Head } from '@inertiajs/react';

export default function AppearanceSettings() {
  return (
    <>
      <Head title="Appearance" />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold">Appearance</h1>
        <p className="text-sm text-gray-600">Appearance settings page.</p>
      </div>
    </>
  );
}
