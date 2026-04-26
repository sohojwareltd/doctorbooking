import { Head, Link, useForm } from '@inertiajs/react';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../../components/GlassCard';
import ParticlesBackground from '../../components/ParticlesBackground';
import PrimaryButton from '../../components/PrimaryButton';
import DoctorLogo from '../../components/DoctorLogo';
import PublicLayout from '../../layouts/PublicLayout';
import { toastError } from '../../utils/toast';

const extractErrorMessages = (errorObject) => {
    const messages = [];

    const walk = (value) => {
        if (!value) {
            return;
        }

        if (typeof value === 'string') {
            messages.push(value);
            return;
        }

        if (Array.isArray(value)) {
            value.forEach(walk);
            return;
        }

        if (typeof value === 'object') {
            Object.values(value).forEach(walk);
        }
    };

    walk(errorObject);
    return [...new Set(messages)];
};

const getFieldError = (errorObject, field) => {
    const direct = errorObject?.[field];

    if (typeof direct === 'string') {
        return direct;
    }

    const nestedError = Object.values(errorObject || {}).find(
        (value) => value && typeof value === 'object' && typeof value[field] === 'string',
    );

    return nestedError?.[field] || null;
};

const getIdentifierErrorMessage = (message, identifierType) => {
    if (!message) {
        return null;
    }

    const normalized = String(message).toLowerCase();
    const isTakenMessage = normalized.includes('taken') || normalized.includes('already exists');

    if (isTakenMessage) {
        return identifierType === 'email'
            ? 'The email has already been taken.'
            : 'The phone number has already been taken.';
    }

    if (normalized.includes('username')) {
        return identifierType === 'email'
            ? message.replace(/username/gi, 'email')
            : message.replace(/username/gi, 'phone number');
    }

    return message;
};

export default function Register() {
    const [identifierType, setIdentifierType] = useState('email'); // 'email' | 'phone'

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/register');
    };

    const errorMessages = extractErrorMessages(errors);
    const errorKey = useMemo(() => errorMessages.join('|'), [errorMessages]);

    const nameError = getFieldError(errors, 'name');
    const emailError = getFieldError(errors, 'email');
    const phoneError = getFieldError(errors, 'phone');
    const usernameError = getFieldError(errors, 'username');
    const rawIdentifierError = identifierType === 'email'
        ? (emailError || usernameError)
        : (phoneError || usernameError);
    const identifierError = getIdentifierErrorMessage(rawIdentifierError, identifierType);
    const passwordError = getFieldError(errors, 'password');
    const passwordConfirmationError = getFieldError(errors, 'password_confirmation');

    useEffect(() => {
        if (errorMessages.length === 0) {
            return;
        }

        toastError(errorMessages[0]);
    }, [errorKey]);

    const inputClass = "w-full rounded-2xl border-2 border-[#00acb1]/30 bg-white px-4 py-3 pl-12 text-gray-900 shadow-sm focus:border-[#00acb1] focus:outline-none focus:ring-4 focus:ring-[#00acb1]/30";

    return (
        <>
            <Head title="Register" />
            <div className="relative min-h-[calc(100vh-64px)] bg-white">
                <div className="absolute inset-0">
                    <ParticlesBackground id="tsparticles-auth-register" variant="pulse" />
                </div>

                <div className="relative mx-auto flex max-w-7xl items-center justify-center px-4 py-14">
                    <GlassCard variant="solid" hover={false} className="w-full max-w-md p-8">
                        {/* Header */}
                        <div className="mb-6 flex flex-col items-center gap-3 text-center">
                            <div className="rounded-2xl bg-[#005963] p-2">
                                <DoctorLogo className="h-10 w-10" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-[#005963]">Create account</h1>
                                <p className="mt-1 text-sm text-gray-600">Join MediCare to book appointments</p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="name" className="mb-2 block text-sm font-semibold text-[#005963]">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        className={inputClass}
                                        autoComplete="name"
                                        placeholder="Your full name"
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                </div>
                                {nameError && <div className="mt-2 text-sm text-red-600">{nameError}</div>}
                            </div>

                            {/* Email / Phone toggle */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-[#005963]">
                                        {identifierType === 'email' ? 'Email Address' : 'Phone Number'}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIdentifierType((t) => t === 'email' ? 'phone' : 'email');
                                            setData('email', '');
                                            setData('phone', '');
                                        }}
                                        className="text-xs font-semibold text-[#005963] underline hover:text-[#00acb1] transition-colors"
                                    >
                                        Use {identifierType === 'email' ? 'phone' : 'email'} instead
                                    </button>
                                </div>

                                {identifierType === 'email' ? (
                                    <>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                            <input
                                                id="email"
                                                type="email"
                                                name="email"
                                                value={data.email}
                                                className={inputClass}
                                                autoComplete="email"
                                                placeholder="you@example.com"
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {identifierError && <div className="mt-2 text-sm text-red-600">{identifierError}</div>}
                                    </>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                            <input
                                                id="phone"
                                                type="tel"
                                                name="phone"
                                                value={data.phone}
                                                className={inputClass}
                                                autoComplete="tel"
                                                placeholder="+8801..."
                                                onChange={(e) => setData('phone', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {identifierError && <div className="mt-2 text-sm text-red-600">{identifierError}</div>}
                                    </>
                                )}

                                <p className="mt-1.5 text-xs text-gray-400">
                                    This will be used as your login identifier.
                                </p>
                            </div>

                            {/* Password */}
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
                                        className={inputClass}
                                        autoComplete="new-password"
                                        placeholder="Min. 8 characters"
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                    />
                                </div>
                                {passwordError && <div className="mt-2 text-sm text-red-600">{passwordError}</div>}
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="password_confirmation" className="mb-2 block text-sm font-semibold text-[#005963]">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#005963]" />
                                    <input
                                        id="password_confirmation"
                                        type="password"
                                        name="password_confirmation"
                                        value={data.password_confirmation}
                                        className={inputClass}
                                        autoComplete="new-password"
                                        placeholder="Repeat password"
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        required
                                    />
                                </div>
                                {passwordConfirmationError && <div className="mt-2 text-sm text-red-600">{passwordConfirmationError}</div>}
                            </div>

                            <PrimaryButton type="submit" className="w-full" disabled={processing}>
                                {processing ? 'Creating account…' : 'Create Account'}
                            </PrimaryButton>

                            <div className="text-center text-sm text-gray-600">
                                Already registered?{' '}
                                <Link href="/login" className="font-semibold text-[#005963] underline">
                                    Log in
                                </Link>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            </div>
        </>
    );
}

Register.layout = (page) => <PublicLayout>{page}</PublicLayout>;

