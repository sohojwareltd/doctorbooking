import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Lock, Shield, ShieldCheck, Smartphone, User } from 'lucide-react';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import PublicLayout from '../../layouts/PublicLayout';

export default function ForgotPasswordOtp({ phone = '' }) {
  const [form, setForm] = useState({
    phone: (phone || '').replace(/\D/g, '').slice(0, 11),
    otp: '',
    password: '',
    password_confirmation: '',
  });
  const [state, setState] = useState({
    resetting: false,
    message: '',
    error: '',
  });

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#16a5a2] focus:outline-none focus:ring-3 focus:ring-[#16a5a2]/15';

  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((r) => r.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];

    if (cookie) {
      return decodeURIComponent(cookie);
    }

    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setState((prev) => ({ ...prev, resetting: true, error: '', message: '' }));

    if (!/^\d{11}$/.test(form.phone)) {
      setState((prev) => ({ ...prev, resetting: false, error: 'Phone number must be 11 digits.' }));
      return;
    }

    if (!/^\d{6}$/.test(form.otp)) {
      setState((prev) => ({ ...prev, resetting: false, error: 'OTP must be exactly 6 digits.' }));
      return;
    }

    if (form.password.length < 8) {
      setState((prev) => ({ ...prev, resetting: false, error: 'Password must be at least 8 characters.' }));
      return;
    }

    if (form.password !== form.password_confirmation) {
      setState((prev) => ({ ...prev, resetting: false, error: 'Password confirmation does not match.' }));
      return;
    }

    try {
      const response = await fetch('/forgot-password/sms-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setState((prev) => ({
          ...prev,
          resetting: false,
          error: payload.message || 'Password reset failed. Please try again.',
        }));
        return;
      }

      setState((prev) => ({
        ...prev,
        resetting: false,
        message: payload.message || 'Password reset successful. You can log in now.',
      }));

      setTimeout(() => {
        window.location.href = '/login';
      }, 1200);
    } catch {
      setState((prev) => ({
        ...prev,
        resetting: false,
        error: 'Network error while resetting password. Please try again.',
      }));
    }
  };

  return (
    <>
      <Head title="Enter OTP" />

      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[linear-gradient(180deg,#f4f8fa_0%,#f8fbfd_100%)] px-4 py-10">
        <div className="pointer-events-none absolute -left-44 top-16 h-[560px] w-[520px] rounded-[58%_42%_55%_45%/48%_52%_50%_50%] bg-[radial-gradient(ellipse_at_center,#e3f1f4_0%,#eaf5f7_55%,#f4f9fb_100%)]" />
        <div className="pointer-events-none absolute -right-14 bottom-[-34px] h-44 w-44 rounded-tl-[100%] bg-[#deeff1]" />

        <div className="relative mx-auto max-w-xl">
          <GlassCard
            variant="solid"
            hover={false}
            className="w-full overflow-hidden rounded-[30px] border border-[#dfe6ea] bg-white p-0 shadow-[0_30px_75px_rgba(15,23,42,0.08)]"
          >
            <div className="px-6 pb-8 pt-8 sm:px-9 sm:pt-9">
              <div className="mb-7 flex flex-col items-center text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#1ab8b4_0%,#0f9e9f_100%)] text-white shadow-[0_12px_24px_rgba(15,158,159,0.3)]">
                  <User className="h-8 w-8" />
                </div>
                <h1 className="mt-4 text-[25px] font-bold tracking-tight text-[#0f3748]">Enter OTP Code</h1>
                <p className="mt-2 text-base text-slate-500">Verify OTP and create your new password.</p>
              </div>

              {state.error ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {state.error}
                </div>
              ) : null}

              {state.message ? (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                  {state.message}
                </div>
              ) : null}

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-600">+88</span>
                    <input
                      id="phone"
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '').slice(0, 11) }))}
                      className={`${inputClass} pl-19`}
                      placeholder="01XXXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="otp" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                    OTP Code
                  </label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="otp"
                      type="text"
                      value={form.otp}
                      onChange={(e) => setForm((prev) => ({ ...prev, otp: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className={inputClass}
                      placeholder="6-digit OTP"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                      className={inputClass}
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="password_confirmation"
                      type="password"
                      value={form.password_confirmation}
                      onChange={(e) => setForm((prev) => ({ ...prev, password_confirmation: e.target.value }))}
                      className={inputClass}
                      placeholder="Type password again"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={state.resetting}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#0f9e9f_0%,#0c8b8f_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,158,159,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {state.resetting ? 'Resetting...' : 'Reset Password'}
                  {!state.resetting ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="mb-2 flex items-center gap-2 font-semibold text-[#153a4a]">
                  <Shield className="h-4 w-4 text-[#1a9f9c]" />
                  Security note
                </div>
                OTP is valid for 5 minutes and expires automatically.
              </div>

              <div className="pt-4 text-center text-sm text-slate-600">
                <Link href="/forgot-password" className="font-semibold text-[#109a9b] underline underline-offset-2">
                  Change phone number
                </Link>
                <span className="mx-2">·</span>
                <Link href="/login" className="font-semibold text-[#109a9b] underline underline-offset-2">
                  Back to login
                </Link>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </>
  );
}

ForgotPasswordOtp.layout = (page) => <PublicLayout>{page}</PublicLayout>;
