import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, Briefcase, Eye, EyeOff, Lock, Mail, Phone, Save, User } from 'lucide-react';
import DoctorLayout from '../../layouts/DoctorLayout';

export default function EditCompounder({ compounder }) {
  const page = usePage();
  const flash = page?.props?.flash || {};

  const [form, setForm] = useState({
    name: compounder?.name || '',
    email: compounder?.email || '',
    phone: compounder?.phone || '',
    password: '',
    designation: compounder?.designation || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    router.put(`/doctor/compounder/${compounder.id}`, form, {
      onError: (errs) => {
        setErrors(errs);
        setSubmitting(false);
      },
      onFinish: () => setSubmitting(false),
    });
  };

  return (
    <DoctorLayout title="Edit Compounder">
      <Head title="Edit Compounder" />

      <div className="mx-auto max-w-2xl px-4 py-8">
        <a
          href="/doctor/compounders"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Compounders
        </a>

        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2D3A74]">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Edit Compounder Account</h1>
            <p className="text-sm text-slate-500">Update contact details, designation, or password.</p>
          </div>
        </div>

        {flash.success && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {flash.success}
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <p className="text-sm font-semibold text-slate-700">Account Details</p>
            <p className="mt-1 text-xs text-slate-400">Username: {compounder?.username || 'N/A'}</p>
          </div>

          <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
            <div className="grid grid-cols-3 items-start gap-4 px-6 py-4">
              <label className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="col-span-2">
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-1 focus:ring-[#2D3A74]/20 ${errors.name ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="e.g. Md. Rahim Uddin"
                />
                {errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 items-start gap-4 px-6 py-4">
              <label className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-600">
                <Mail className="h-4 w-4 text-slate-400" />
                Email
              </label>
              <div className="col-span-2">
                <input
                  type="email"
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-1 focus:ring-[#2D3A74]/20 ${errors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="compounder@clinic.com"
                />
                {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
                <p className="mt-1 text-xs text-slate-400">Email or phone is required.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 items-start gap-4 px-6 py-4">
              <label className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-600">
                <Phone className="h-4 w-4 text-slate-400" />
                Phone
              </label>
              <div className="col-span-2">
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-1 focus:ring-[#2D3A74]/20 ${errors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                />
                {errors.phone && <p className="mt-1 text-xs text-rose-500">{errors.phone}</p>}
                <p className="mt-1 text-xs text-slate-400">Email or phone is required.</p>
              </div>
            </div>

            <div className="grid grid-cols-3 items-start gap-4 px-6 py-4">
              <label className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-600">
                <Briefcase className="h-4 w-4 text-slate-400" />
                Designation
              </label>
              <div className="col-span-2">
                <input
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-1 focus:ring-[#2D3A74]/20 ${errors.designation ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
                  value={form.designation}
                  onChange={(e) => set('designation', e.target.value)}
                  placeholder="e.g. Clinic Assistant"
                />
                {errors.designation && <p className="mt-1 text-xs text-rose-500">{errors.designation}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 items-start gap-4 px-6 py-4">
              <label className="flex items-center gap-2 pt-2 text-sm font-medium text-slate-600">
                <Lock className="h-4 w-4 text-slate-400" />
                New Password
              </label>
              <div className="col-span-2">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-lg border px-3 py-2 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-1 focus:ring-[#2D3A74]/20 ${errors.password ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'}`}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
                <p className="mt-1 text-xs text-slate-400">Set a new password only if you want to change it.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4">
              <a
                href="/doctor/compounders"
                className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2D3A74] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1e2a5e] disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DoctorLayout>
  );
}