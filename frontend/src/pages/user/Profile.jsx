import { Link } from '@inertiajs/react';
import { useState } from 'react';
import {
  User, Mail, Phone, Calendar, Weight, MapPin,
  CheckCircle, Save, ArrowRight, Sparkles, KeyRound, Eye, EyeOff,
} from 'lucide-react';
import UserLayout from '../../layouts/UserLayout';

export default function Profile({ userData = {}, profile = null, isSetup = false }) {
  const [form, setForm] = useState({
    name:          userData.name          ?? '',
    phone:         userData.phone         ?? '',
    date_of_birth: profile?.date_of_birth ?? '',
    age:           profile?.age           ?? '',
    gender:        profile?.gender        ?? '',
    weight:        profile?.weight        ?? '',
    address:       profile?.address       ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current_password: false,
    password: false,
    password_confirmation: false,
  });

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setPassword = (key) => (e) => setPasswordForm((f) => ({ ...f, [key]: e.target.value }));
  const togglePasswordVisibility = (key) => {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Read the freshest CSRF token — prefer the XSRF-TOKEN cookie (always current,
  // even after Inertia client-side navigations) and fall back to the meta tag.
  const getCsrfToken = () => {
    const cookie = document.cookie
      .split('; ')
      .find((r) => r.startsWith('XSRF-TOKEN='))
      ?.split('=')[1];
    if (cookie) return decodeURIComponent(cookie);
    return document.querySelector('meta[name="csrf-token"]')?.content ?? '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setSaved(true);
        // After first-time setup, navigate to dashboard
        if (isSetup) {
          setTimeout(() => { window.location.href = '/patient/dashboard'; }, 1200);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to save. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSaving(true);
    setPasswordSaved(false);
    setPasswordError('');

    try {
      const res = await fetch('/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-XSRF-TOKEN': getCsrfToken(),
        },
        credentials: 'same-origin',
        body: JSON.stringify(passwordForm),
      });

      if (res.ok) {
        setPasswordSaved(true);
        setPasswordForm({
          current_password: '',
          password: '',
          password_confirmation: '',
        });
      } else {
        const data = await res.json().catch(() => ({}));
        const firstValidationError = data?.errors
          ? Object.values(data.errors)[0]?.[0]
          : null;
        setPasswordError(firstValidationError || data.message || 'Failed to change password. Please try again.');
      }
    } catch {
      setPasswordError('Network error. Please try again.');
    } finally {
      setPasswordSaving(false);
    }
  };

  const inputClass = `w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900
    placeholder-slate-400 focus:border-[#2D3A74] focus:outline-none focus:ring-2 focus:ring-[#2D3A74]/20 transition`;
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5';

  const isProfileNew =
    !profile?.gender && !profile?.date_of_birth && !profile?.age;

  return (
    <div className="max-w-[900px] mx-auto space-y-6">

      {/* HERO BANNER */}
      <section className="hero-panel rounded-[28px] p-6 md:p-8 text-white">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-white/80 mb-4">
              <User className="h-[11px] w-[11px]" />
              {isSetup || isProfileNew ? 'Profile Setup' : 'My Profile'}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight mb-2">
              {isSetup || isProfileNew
                ? `Welcome, ${form.name || 'there'}!`
                : `Hi, ${form.name || 'there'}`}
            </h1>
            <p className="text-sm text-white/80">
              {isSetup || isProfileNew
                ? 'Complete your patient profile so doctors can serve you better.'
                : 'Update your personal and health information below.'}
            </p>
          </div>
          <div className="glass-card rounded-2xl px-6 py-4 text-center min-w-[140px]">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-1">Username</p>
            <p className="text-sm font-bold break-all">{userData.username || '—'}</p>
          </div>
        </div>
      </section>

      {/* SETUP BANNER (only for new users) */}
      {(isSetup || isProfileNew) && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#4aa5ec]/30 bg-[#4aa5ec]/8 px-5 py-4">
          <Sparkles className="h-5 w-5 text-[#4aa5ec] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-[#2D3A74]">Complete your profile</p>
            <p className="text-xs text-slate-500 mt-0.5">
              Fill in your health details to help your doctor give better care. You can update these anytime.
            </p>
          </div>
        </div>
      )}

      {/* FORM CARD */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Account Section */}
        <div className="surface-card rounded-3xl p-6">
          <h2 className="text-base font-semibold text-[#2D3A74] mb-5 flex items-center gap-2">
            <User className="h-4 w-4 text-[#4055A8]" />
            Account Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Name */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your full name"
                  className={`${inputClass} pl-10`}
                  required
                />
              </div>
            </div>

            {/* Email (read-only) */}
            <div>
              <label className={labelClass}>Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={userData.email ?? ''}
                  readOnly
                  className={`${inputClass} pl-10 bg-slate-50 text-slate-500 cursor-not-allowed`}
                  placeholder="Not set"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="+8801..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Health Details Section */}
        <div className="surface-card rounded-3xl p-6">
          <h2 className="text-base font-semibold text-[#2D3A74] mb-5 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#4055A8]" />
            Health Details
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">

            {/* Date of Birth */}
            <div>
              <label className={labelClass}>Date of Birth</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={form.date_of_birth}
                  onChange={set('date_of_birth')}
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Age */}
            <div>
              <label className={labelClass}>Age (years)</label>
              <input
                type="number"
                min="0"
                max="150"
                value={form.age}
                onChange={set('age')}
                placeholder="e.g. 28"
                className={inputClass}
              />
            </div>

            {/* Gender */}
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={form.gender}
                onChange={set('gender')}
                className={inputClass}
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Weight */}
            <div>
              <label className={labelClass}>Weight (kg)</label>
              <div className="relative">
                <Weight className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  max="500"
                  step="0.1"
                  value={form.weight}
                  onChange={set('weight')}
                  placeholder="e.g. 65"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label className={labelClass}>Address</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <textarea
                  value={form.address}
                  onChange={set('address')}
                  rows={3}
                  placeholder="Your home address"
                  className={`${inputClass} pl-10 resize-none`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </div>
        )}

        {/* Success */}
        {saved && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            {isSetup ? 'Profile saved! Redirecting to your dashboard…' : 'Profile updated successfully.'}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-4">
          {!isSetup && !isProfileNew && (
            <Link
              href="/patient/dashboard"
              className="text-sm font-medium text-slate-500 hover:text-[#2D3A74] transition-colors"
            >
              ← Back to Dashboard
            </Link>
          )}
          <div className="flex items-center gap-3 ml-auto">
            {(isSetup || isProfileNew) && (
              <Link
                href="/patient/dashboard"
                className="text-sm font-medium text-slate-500 hover:text-[#2D3A74] transition-colors"
              >
                Skip for now
              </Link>
            )}
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1e2a5a] disabled:opacity-60 transition"
            >
              {saving ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Saving…
                </>
              ) : saved && (isSetup || isProfileNew) ? (
                <>
                  <ArrowRight className="h-3.5 w-3.5" />
                  Going to Dashboard…
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {isSetup || isProfileNew ? 'Save & Continue' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      <form onSubmit={handlePasswordSubmit} className="surface-card rounded-3xl p-6">
        <h2 className="text-base font-semibold text-[#2D3A74] mb-5 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-[#4055A8]" />
          Change Password
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Current Password</label>
            <div className="relative">
              <input
                type={showPasswords.current_password ? 'text' : 'password'}
                value={passwordForm.current_password}
                onChange={setPassword('current_password')}
                className={`${inputClass} pr-11`}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current_password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPasswords.current_password ? 'Hide current password' : 'Show current password'}
              >
                {showPasswords.current_password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>New Password</label>
            <div className="relative">
              <input
                type={showPasswords.password ? 'text' : 'password'}
                value={passwordForm.password}
                onChange={setPassword('password')}
                className={`${inputClass} pr-11`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPasswords.password ? 'Hide new password' : 'Show new password'}
              >
                {showPasswords.password ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className={labelClass}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showPasswords.password_confirmation ? 'text' : 'password'}
                value={passwordForm.password_confirmation}
                onChange={setPassword('password_confirmation')}
                className={`${inputClass} pr-11`}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('password_confirmation')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                aria-label={showPasswords.password_confirmation ? 'Hide password confirmation' : 'Show password confirmation'}
              >
                {showPasswords.password_confirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {passwordError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {passwordError}
          </div>
        )}

        {passwordSaved && (
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Password changed successfully.
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex items-center gap-2 rounded-xl bg-[#2D3A74] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#1e2a5a] disabled:opacity-60 transition"
          >
            {passwordSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>
    </div>
  );
}

Profile.layout = (page) => <UserLayout title="My Profile">{page}</UserLayout>;
