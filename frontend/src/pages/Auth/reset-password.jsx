import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowRight, Lock, ShieldCheck, User } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import PublicLayout from '../../layouts/PublicLayout';

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

  const inputClass =
    'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#16a5a2] focus:outline-none focus:ring-3 focus:ring-[#16a5a2]/15';

  return (
    <>
      <Head title="Reset Password" />
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
                <h1 className="mt-4 text-[25px] font-bold tracking-tight text-[#0f3748]">Set new password</h1>
                <p className="mt-2 text-base text-slate-500">Create a strong password for your account.</p>
              </div>

              {(errors.email || errors.password || errors.token) ? (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {errors.email || errors.password || errors.token}
                </div>
              ) : null}

              <form onSubmit={submit} className="space-y-4">
                <input type="hidden" value={data.token} readOnly />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#153a4a]" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="email"
                      type="email"
                      className={inputClass}
                      value={data.email}
                      onChange={(e) => setData('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#153a4a]" htmlFor="password">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="password"
                      type="password"
                      className={inputClass}
                      value={data.password}
                      onChange={(e) => setData('password', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#153a4a]" htmlFor="password_confirmation">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                    <input
                      id="password_confirmation"
                      type="password"
                      className={inputClass}
                      value={data.password_confirmation}
                      onChange={(e) => setData('password_confirmation', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#0f9e9f_0%,#0c8b8f_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,158,159,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? 'Resetting...' : 'Reset password'}
                  {!processing ? <ArrowRight className="h-4 w-4" /> : null}
                </button>
              </form>

              <div className="pt-4 text-center text-sm text-slate-600">
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


ResetPassword.layout = (page) => <PublicLayout>{page}</PublicLayout>;
