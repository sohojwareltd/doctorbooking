import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';
import GlassCard from '../../components/GlassCard';
import ParticlesBackground from '../../components/ParticlesBackground';
import PrimaryButton from '../../components/PrimaryButton';
import DoctorLogo from '../../components/DoctorLogo';
import PublicLayout from '../../layouts/PublicLayout';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <>
            <Head title="Log in" />
            <div className="relative min-h-[calc(100vh-64px)] bg-white">
                <div className="absolute inset-0">
                    <ParticlesBackground id="tsparticles-auth" variant="pulse" />
                </div>

                <div className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-14">
                    <GlassCard variant="solid" hover={false} className="w-full max-w-md p-8">
                        <div className="mb-6 flex flex-col items-center gap-3 text-center">
                            <div className="rounded-2xl bg-[#005963] p-2">
                                <DoctorLogo className="h-10 w-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[#005963]">Welcome back</h1>
                                <p className="mt-1 text-sm text-gray-600">Log in to your account</p>
                            </div>
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

                        <form onSubmit={submit} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-[#005963]">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        className="w-full rounded-2xl border-2 border-[#00acb1]/30 bg-white px-4 py-3 pl-12 text-gray-900 shadow-sm focus:border-[#00acb1] focus:outline-none focus:ring-4 focus:ring-[#00acb1]/30"
                                        autoComplete="username"
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-[#005963]">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        id="password"
                                        type="password"
                                        name="password"
                                        value={data.password}
                                        className="w-full rounded-2xl border-2 border-[#00acb1]/30 bg-white px-4 py-3 pl-12 text-gray-900 shadow-sm focus:border-[#00acb1] focus:outline-none focus:ring-4 focus:ring-[#00acb1]/30"
                                        autoComplete="current-password"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-600">
                                <input
                                    type="checkbox"
                                    name="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-[#00acb1] focus:ring-[#00acb1]"
                                />
                                Remember me
                            </label>

                            <div className="flex flex-col gap-3">
                                <PrimaryButton type="submit" className="w-full" disabled={processing}>
                                    {processing ? 'Signing in…' : 'Log in'}
                                </PrimaryButton>

                                {canResetPassword && (
                                    <Link href="/forgot-password" className="text-center text-sm font-medium text-[#005963] underline">
                                        Forgot your password?
                                    </Link>
                                )}
                            </div>

                            <div className="text-center text-sm text-gray-600">
                                Don&apos;t have an account?{' '}
                                <Link href="/register" className="font-semibold text-[#005963] underline">
                                    Register
                                </Link>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </>
    );
}

Login.layout = (page) => <PublicLayout>{page}</PublicLayout>;
