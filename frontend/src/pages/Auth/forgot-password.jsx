import { Head, Link, useForm } from '@inertiajs/react';
import {
  ArrowRight,
  Bell,
  CalendarCheck2,
  KeyRound,
  Shield,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import PublicLayout from '../../layouts/PublicLayout';

export default function ForgotPassword({ status }) {
  const [smsState, setSmsState] = useState({
    sending: false,
    message: '',
    error: '',
  });

  const {
    data: emailData,
    setData: setEmailData,
    post,
    processing,
    errors,
  } = useForm({ email: '' });

  const [smsData, setSmsData] = useState({
    phone: '',
  });

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

  const normalizePhoneInput = (value) => {
    let digits = value.replace(/\D/g, '');

    if (digits.startsWith('88')) {
      digits = digits.slice(2);
    }

    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }

    return digits;
  };

  const submitEmail = (e) => {
    e.preventDefault();
    post('/forgot-password');
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setSmsState((prev) => ({ ...prev, sending: true, error: '', message: '' }));

    const normalizedPhone = normalizePhoneInput(smsData.phone);

    if (normalizedPhone.length !== 11) {
      setSmsState((prev) => ({
        ...prev,
        sending: false,
        error: 'Phone number must be 11 digits.',
      }));
      return;
    }

    try {
      const response = await fetch('/forgot-password/sms-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify({ phone: normalizedPhone }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSmsState((prev) => ({
          ...prev,
          sending: false,
          error: payload.message || 'OTP could not be sent. Please try again.',
        }));
        return;
      }

      setSmsData((prev) => ({ ...prev, phone: normalizedPhone }));
      setSmsState((prev) => ({
        ...prev,
        sending: false,
        message: payload.message || 'OTP sent successfully.',
      }));

      window.location.href = `/forgot-password/otp?phone=${encodeURIComponent(normalizedPhone)}`;
    } catch {
      setSmsState((prev) => ({
        ...prev,
        sending: false,
        error: 'Network error while sending OTP. Please try again.',
      }));
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#16a5a2] focus:outline-none focus:ring-3 focus:ring-[#16a5a2]/15';

  return (
    <>
      <Head title="Forgot Password" />

      <div className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-[linear-gradient(180deg,#f4f8fa_0%,#f8fbfd_100%)]">
        <div className="pointer-events-none absolute -left-44 top-16 h-[560px] w-[520px] rounded-[58%_42%_55%_45%/48%_52%_50%_50%] bg-[radial-gradient(ellipse_at_center,#e3f1f4_0%,#eaf5f7_55%,#f4f9fb_100%)]" />
        <div className="pointer-events-none absolute -left-24 top-40 h-[420px] w-[360px] rounded-[50%_50%_46%_54%/60%_40%_60%_40%] bg-white/45" />
        <div className="pointer-events-none absolute right-12 top-28 h-36 w-24 bg-[radial-gradient(circle,#cadde3_1.2px,transparent_1.2px)] [background-size:10px_10px] opacity-60" />
        <div className="pointer-events-none absolute right-10 top-[320px] hidden h-64 w-64 opacity-50 lg:block">
          <div className="absolute left-10 top-2 h-16 w-16 rotate-45 rounded-2xl border border-[#d7e7ea]" />
          <div className="absolute left-28 top-10 h-16 w-16 rotate-45 rounded-2xl border border-[#d7e7ea]" />
          <div className="absolute left-46 top-26 h-16 w-16 rotate-45 rounded-2xl border border-[#d7e7ea]" />
          <div className="absolute left-6 top-30 inline-flex h-20 w-20 items-center justify-center rounded-[28px] border border-[#d9eaec] bg-[#eff8f8] text-[#9bcfce] shadow-sm">
            <ShieldCheck className="h-10 w-10" />
          </div>
        </div>
        <div className="pointer-events-none absolute -right-14 bottom-[-34px] h-44 w-44 rounded-tl-[100%] bg-[#deeff1]" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="grid items-stretch gap-8 lg:grid-cols-[340px_minmax(0,500px)] lg:justify-center">
            <div className="order-2 flex h-full flex-col p-7 lg:order-1">
              <div className="mb-8">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1b9c9b] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                  <KeyRound className="h-8 w-8" />
                </div>
                <h2 className="mt-6 text-[25px] font-bold leading-[1.02] tracking-tight text-[#143a4a]">
                  Password recovery
                </h2>
                <p className="mt-4 max-w-[280px] text-[17px] leading-8 text-slate-600">
                  Reset with secure SMS OTP, or request an email link if you prefer.
                </p>
              </div>

              <div className="space-y-7">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                    <Smartphone className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#163b4b]">Quick OTP Reset</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-600">
                      Enter your phone, receive OTP, and set a new password in minutes.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                    <Shield className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#163b4b]">Secure Verification</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-600">
                      OTP is valid for 5 minutes with strict attempt controls.
                    </p>
                  </div>
                </div>

                <div className="mb-4 flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                    <Bell className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-[#163b4b]">Reliable Delivery</p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-600">
                      OTP is sent using your configured SMS provider credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <GlassCard
              variant="solid"
              hover={false}
              className="order-1 w-full overflow-hidden rounded-[30px] border border-[#dfe6ea] bg-white p-0 shadow-[0_30px_75px_rgba(15,23,42,0.08)] lg:order-2"
            >
              <div className="px-6 pb-8 pt-8 sm:px-9 sm:pt-9">
                <div className="mb-7 flex flex-col items-center text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[linear-gradient(180deg,#1ab8b4_0%,#0f9e9f_100%)] text-white shadow-[0_12px_24px_rgba(15,158,159,0.3)]">
                    <User className="h-8 w-8" />
                  </div>
                  <h1 className="mt-4 text-[25px] font-bold tracking-tight text-[#0f3748]">Reset your password</h1>
                  <p className="mt-2 text-base text-slate-500">Step 1: Enter your phone to receive OTP.</p>
                </div>

                {status ? (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {status}
                  </div>
                ) : null}

                {smsState.error ? (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                    {smsState.error}
                  </div>
                ) : null}

                {smsState.message ? (
                  <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {smsState.message}
                  </div>
                ) : null}

                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                      {/* <span className="pointer-events-none absolute left-10 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-600">+88</span> */}
                      <input
                        id="phone"
                        type="text"
                        value={smsData.phone}
                        onChange={(e) => setSmsData((prev) => ({ ...prev, phone: normalizePhoneInput(e.target.value) }))}
                        className={`${inputClass} pl-10`}
                        placeholder="01XXXXXXXXX"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={smsState.sending}
                    className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#0f9e9f_0%,#0c8b8f_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,158,159,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {smsState.sending ? 'Sending OTP...' : 'Send OTP'}
                    {!smsState.sending ? <ArrowRight className="h-4 w-4" /> : null}
                  </button>
                </form>
{/* 
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-[#153a4a]">Email reset link (optional)</p>
                  {(errors.email || errors.password) ? (
                    <div className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                      {errors.email || errors.password}
                    </div>
                  ) : null}

                  <form onSubmit={submitEmail} className="space-y-3">
                    <div className="relative">
                      <CalendarCheck2 className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                      <input
                        id="email"
                        type="email"
                        value={emailData.email}
                        onChange={(e) => setEmailData('email', e.target.value)}
                        className={inputClass}
                        placeholder="Enter your account email"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={processing}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#8fd0cf] bg-white px-6 py-3 text-sm font-semibold text-[#0f8f90] transition hover:bg-[#ecf8f8] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {processing ? 'Sending link...' : 'Send reset link by email'}
                    </button>
                  </form>
                </div> */}

                <div className="pt-4 text-center text-sm text-slate-600">
                  Remember your password?{' '}
                  <Link href="/login" className="font-semibold text-[#109a9b] underline underline-offset-2">
                    Back to login
                  </Link>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </>
  );
}

ForgotPassword.layout = (page) => <PublicLayout>{page}</PublicLayout>;
