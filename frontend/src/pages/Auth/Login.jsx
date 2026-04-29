import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowRight,
    Bell,
    CalendarCheck2,
    Eye,
    EyeOff,
    Lock,
    Mail,
    Shield,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useState } from 'react';
import GlassCard from '../../components/GlassCard';
import PrimaryButton from '../../components/PrimaryButton';
import PublicLayout from '../../layouts/PublicLayout';

export default function Login({ status, canResetPassword }) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = async (e) => {
        e.preventDefault();

        try {
            await fetch('/sanctum/csrf-cookie', {
                method: 'GET',
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
        } catch {
            // Continue with token from page if preflight fails.
        }

        post('/login', {
            onSuccess: async () => {
                try {
                    await fetch('/sanctum/csrf-cookie', {
                        method: 'GET',
                        credentials: 'same-origin',
                        headers: { Accept: 'application/json' },
                    });
                } catch {
                    // Ignore refresh failures; axios/fetch interceptors can recover on next 419.
                }

                window.location.reload();
            },
        });
    };

    const inputClass =
        'w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] focus:border-[#16a5a2] focus:outline-none focus:ring-3 focus:ring-[#16a5a2]/15';

    return (
        <>
            <Head title="Log in" />
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
                    <div className="grid items-stretch gap-8 lg:grid-cols-[340px_minmax(0,440px)] lg:justify-center">
                        <div className="order-2 flex h-full flex-col p-7 lg:order-1">
                            <div className="mb-8">
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-[#1b9c9b] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                    <ShieldCheck className="h-8 w-8" />
                                </div>
                                <h2 className="mt-6 text-[25px] font-bold leading-[1.02] tracking-tight text-[#143a4a]">
                                    Welcome back
                                </h2>
                                <p className="mt-4 max-w-[240px] text-[17px] leading-8 text-slate-600">
                                    Log in to continue your healthcare journey with us.
                                </p>
                            </div>

                            <div className="space-y-7">
                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <CalendarCheck2 className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-[15px] font-semibold text-[#163b4b]">Easy Appointments</p>
                                        <p className="mt-1 text-[13px] leading-6 text-slate-600">
                                            Book and manage your appointments in seconds.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <Shield className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-[15px] font-semibold text-[#163b4b]">Secure &amp; Private</p>
                                        <p className="mt-1 text-[13px] leading-6 text-slate-600">
                                            Your data is protected with industry-standard security.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 mb-4">
                                    <span className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#dff1f1] text-[#1f9e9b]">
                                        <Bell className="h-5 w-5" />
                                    </span>
                                    <div>
                                        <p className="text-[15px] font-semibold text-[#163b4b]">Timely Reminders</p>
                                        <p className="mt-1 text-[13px] leading-6 text-slate-600">
                                            Get reminders so you never miss an appointment.
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
                                    <h1 className="mt-4 text-[25px] font-bold tracking-tight text-[#0f3748]">Log in to your account</h1>
                                    <p className="mt-2 text-base text-slate-500">Welcome back! Please enter your details.</p>
                                </div>

                                {status && (
                                    <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                                        {status}
                                    </div>
                                )}

                                {(errors.email || errors.password) && (
                                    <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                                        {errors.email || errors.password}
                                    </div>
                                )}

                                <form onSubmit={submit} className="space-y-4.5">
                                    <div>
                                        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Email or Phone
                                        </label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="email"
                                                type="text"
                                                name="email"
                                                value={data.email}
                                                className={inputClass}
                                                autoComplete="username"
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="Enter your email or phone number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-[#153a4a]">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#1a9f9c]" />
                                            <input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                name="password"
                                                value={data.password}
                                                className={`${inputClass} pr-11`}
                                                autoComplete="current-password"
                                                onChange={(e) => setData('password', e.target.value)}
                                                placeholder="Enter your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                            >
                                                {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 pt-1">
                                        <label className="flex items-center gap-2 text-sm text-slate-600">
                                            <input
                                                type="checkbox"
                                                name="remember"
                                                checked={data.remember}
                                                onChange={(e) => setData('remember', e.target.checked)}
                                                className="h-4 w-4 rounded border-gray-300 text-[#119f9d] focus:ring-[#119f9d]"
                                            />
                                            Remember me
                                        </label>

                                        {canResetPassword && (
                                            <Link href="/forgot-password" className="text-sm font-medium text-[#109a9b] hover:underline">
                                                Forgot password?
                                            </Link>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,#0f9e9f_0%,#0c8b8f_100%)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(15,158,159,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {processing ? 'Signing in...' : 'Log in'}
                                        {!processing && <ArrowRight className="h-4 w-4" />}
                                    </button>

                                    {/* <div className="flex items-center gap-4 pt-1">
                                        <div className="h-px flex-1 bg-slate-200" />
                                        <span className="text-sm text-slate-400">or</span>
                                        <div className="h-px flex-1 bg-slate-200" />
                                    </div> */}

                                    {/* <button
                                        type="button"
                                        className="inline-flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm"
                                        title="Google login is not configured"
                                    >
                                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[conic-gradient(from_180deg_at_50%_50%,#ea4335_0deg_90deg,#fbbc05_90deg_180deg,#34a853_180deg_270deg,#4285f4_270deg_360deg)] text-transparent">G</span>
                                        Continue with Google
                                    </button> */}

                                    <div className="pt-1 text-center text-sm text-slate-600">
                                        Don&apos;t have an account?{' '}
                                        <Link href="/register" className="font-semibold text-[#109a9b] underline underline-offset-2">
                                            Create account
                                        </Link>
                                    </div>
                                </form>
                            </div>
                        </GlassCard>
                        
                    </div>
                </div>
            </div>
        </>
    );
}

Login.layout = (page) => <PublicLayout>{page}</PublicLayout>;
