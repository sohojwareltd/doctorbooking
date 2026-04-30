import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    Calendar,
    Camera,
    GraduationCap,
    FileText,
    Mail,
    MapPin,
    Phone,
    Save,
    Stethoscope,
    Trash2,
    Upload,
    User,
    KeyRound,
    Eye,
    EyeOff,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocCard } from '../../components/doctor/DocUI';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorProfile({ doctor = {} }) {
    const page = usePage();
    const flash = page?.props?.flash || {};
    const branding = page?.props?.branding || {};
    const [photoPreview, setPhotoPreview] = useState(doctor.profile_picture || null);
    const [heroPreview, setHeroPreview] = useState(doctor.hero_image || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingHero, setUploadingHero] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const [deletingHero, setDeletingHero] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [showHeroModal, setShowHeroModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);
    const heroInputRef = useRef(null);

    const { data, setData, put, processing, errors } = useForm({
        name: doctor.name || '',
        email: doctor.email || '',
        phone: doctor.phone || '',
        address: doctor.address || '',
        date_of_birth: doctor.date_of_birth || '',
        gender: doctor.gender || '',
        specialization: doctor.specialization || '',
        degree: doctor.degree || '',
        registration_no: doctor.registration_no || '',
        preferred_template_type: doctor.preferred_template_type || 'general',
        about_subtitle: doctor.about_subtitle || '',
        about_bio_details: doctor.about_bio_details || '',
        about_credentials_title: doctor.about_credentials_title || '',
        about_credentials_text: doctor.about_credentials_text || '',
        about_highlight_value: doctor.about_highlight_value || '',
        about_highlight_label: doctor.about_highlight_label || '',
        about_stats_patients_treated: doctor.about_stats_patients_treated || '',
        about_stats_years_experience: doctor.about_stats_years_experience || '',
        about_stats_patient_satisfaction: doctor.about_stats_patient_satisfaction || '',
        about_stats_medical_cases: doctor.about_stats_medical_cases || '',
    });
    const {
        data: passwordData,
        setData: setPasswordData,
        put: putPassword,
        processing: passwordProcessing,
        errors: passwordErrors,
        reset: resetPasswordForm,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordSaved, setPasswordSaved] = useState(false);
    const {
        data: brandingData,
        setData: setBrandingData,
        put: putBranding,
        processing: brandingProcessing,
        errors: brandingErrors,
    } = useForm({
        favicon_url: branding.favicon_url || '',
        brand_logo_url: branding.brand_logo_url || '',
        sidebar_logo_url: branding.sidebar_logo_url || '',
        chamber_icon_url: branding.chamber_icon_url || '',
    });
    const [uploadingBranding, setUploadingBranding] = useState({
        favicon_url: false,
        brand_logo_url: false,
        sidebar_logo_url: false,
        chamber_icon_url: false,
    });
    const [showPasswords, setShowPasswords] = useState({
        current_password: false,
        password: false,
        password_confirmation: false,
    });

    useEffect(() => {
        if (flash?.success) {
            toastSuccess(flash.success);
        }
        if (flash?.error) {
            toastError(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        setPhotoPreview(doctor.profile_picture || null);
    }, [doctor.profile_picture]);

    useEffect(() => {
        setHeroPreview(doctor.hero_image || null);
    }, [doctor.hero_image]);

    useEffect(() => {
        setBrandingData('favicon_url', branding.favicon_url || '');
        setBrandingData('brand_logo_url', branding.brand_logo_url || '');
        setBrandingData('sidebar_logo_url', branding.sidebar_logo_url || '');
        setBrandingData('chamber_icon_url', branding.chamber_icon_url || '');
    }, [branding, setBrandingData]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/doctor/profile', {
            preserveScroll: true,
            onError: () => {
                toastError('Failed to update profile. Please check the form.');
            },
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        setPasswordSaved(false);

        putPassword('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                resetPasswordForm();
                setPasswordSaved(true);
                toastSuccess('Password changed successfully.');
            },
            onError: () => {
                toastError('Failed to change password. Please check the form.');
            },
        });
    };

    const togglePasswordVisibility = (key) => {
        setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePhotoSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toastError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toastError('Image size must be less than 10MB');
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setPhotoPreview(e.target.result);
        };
        reader.readAsDataURL(file);

        // Upload the file
        setUploadingPhoto(true);
        const formData = new FormData();
        formData.append('photo', file);

        router.post('/doctor/profile/photo', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setUploadingPhoto(false);
            },
            onError: (errors) => {
                setUploadingPhoto(false);
                setPhotoPreview(doctor.profile_picture || null);
                toastError(errors?.photo || 'Failed to upload photo');
            },
        });
    };

    const handleDeletePhoto = () => {
        if (!confirm('Are you sure you want to delete your profile photo?')) return;

        setDeletingPhoto(true);
        router.delete('/doctor/profile/photo', {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingPhoto(false);
                setPhotoPreview(null);
            },
            onError: () => {
                setDeletingPhoto(false);
                toastError('Failed to delete photo');
            },
        });
    };

    const handleHeroSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toastError('Please select a valid hero image file (JPEG, PNG, GIF, or WebP)');
            return;
        }

        if (file.size > 4 * 1024 * 1024) {
            toastError('Hero image size must be less than 4MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            setHeroPreview(event.target.result);
        };
        reader.readAsDataURL(file);

        setUploadingHero(true);
        const formData = new FormData();
        formData.append('hero_image', file);

        router.post('/doctor/profile/hero-image', formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setUploadingHero(false);
            },
            onError: (uploadErrors) => {
                setUploadingHero(false);
                setHeroPreview(doctor.hero_image || null);
                toastError(uploadErrors?.hero_image || 'Failed to upload hero image');
            },
        });
    };

    const handleDeleteHero = () => {
        if (!confirm('Are you sure you want to delete your hero image?')) return;

        setDeletingHero(true);
        router.delete('/doctor/profile/hero-image', {
            preserveScroll: true,
            onSuccess: () => {
                setDeletingHero(false);
                setHeroPreview(null);
            },
            onError: () => {
                setDeletingHero(false);
                toastError('Failed to delete hero image');
            },
        });
    };

    const uploadBrandingFile = async (field, file) => {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/doctor/profile/branding/upload', {
            method: 'POST',
            headers: token ? { 'X-CSRF-TOKEN': token, Accept: 'application/json' } : { Accept: 'application/json' },
            body: formData,
            credentials: 'same-origin',
        });

        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.url) {
            throw new Error(payload?.message || 'Upload failed');
        }

        const nextBranding = {
            ...brandingData,
            [field]: payload.url,
        };

        setBrandingData(field, payload.url);

        await new Promise((resolve, reject) => {
            router.put('/doctor/profile/branding', nextBranding, {
                preserveScroll: true,
                onSuccess: () => {
                    toastSuccess('Icon uploaded and saved successfully.');
                    resolve();
                },
                onError: () => {
                    reject(new Error('Icon uploaded but save failed. Please click Save Icons.'));
                },
            });
        });
    };

    const handleBrandingSubmit = (e) => {
        e.preventDefault();
        putBranding('/doctor/profile/branding', {
            preserveScroll: true,
            onSuccess: () => toastSuccess('Branding icons saved successfully.'),
            onError: () => toastError('Failed to save branding icons.'),
        });
    };

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900  transition';
    const labelClass = 'mb-2 block text-sm font-semibold text-slate-700';
    const errorClass = 'mt-1 text-xs font-semibold text-rose-600';
    const isFilled = (value) => String(value ?? '').trim() !== '';
    const doctorName = data.name || doctor.name || 'Doctor Name';
    const profileReadyCount = [
        data.name,
        data.email,
        data.phone,
        data.address,
        data.date_of_birth,
        data.gender,
        data.specialization,
        data.degree,
        data.registration_no,
    ].filter(isFilled).length;
    const aboutReadyCount = [
        data.about_subtitle,
        data.about_bio_details,
        data.about_credentials_title,
        data.about_credentials_text,
        data.about_highlight_value,
        data.about_highlight_label,
        data.about_stats_patients_treated,
        data.about_stats_years_experience,
        data.about_stats_patient_satisfaction,
        data.about_stats_medical_cases,
    ].filter(isFilled).length;
    const bannerTabs = [
        {
            key: 'profile',
            label: 'Profile Setup',
            compactLabel: 'Profile',
            title: data.specialization || 'Personal and professional details',
            summary: photoPreview ? 'Photo ready' : 'Photo pending',
            secondary: data.registration_no ? `BMDC ${data.registration_no}` : 'BMDC pending',
            count: `${profileReadyCount}/9`,
            icon: User,
            accent: 'from-[#d6e1fa]/26 to-[#c7d6f7]/16',
        },
        {
            key: 'about',
            label: 'About Content',
            compactLabel: 'About',
            title: data.about_subtitle || 'Homepage story and stats',
            summary: data.about_highlight_value && data.about_highlight_label
                ? `${data.about_highlight_value} ${data.about_highlight_label}`
                : 'Highlight pending',
            secondary: data.about_credentials_title || 'Credentials pending',
            count: `${aboutReadyCount}/10`,
            icon: FileText,
            accent: 'from-[#f0bf97]/28 to-[#e5b894]/18',
        },
    ];

    return (
        <DoctorLayout title="My Profile">
      <Head title="My Profile" />
      <div className="mx-auto max-w-[1400px] space-y-6">

            {/* Photo View Modal */}
            {showPhotoModal && photoPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <button
                            onClick={() => setShowPhotoModal(false)}
                            className="absolute -right-3 -top-3 rounded-full bg-white p-2 shadow-lg transition hover:bg-slate-100"
                        >
                            <X className="h-5 w-5 text-slate-700" />
                        </button>
                        <img
                            src={photoPreview}
                            alt="Profile"
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
            {showHeroModal && heroPreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowHeroModal(false)}
                >
                    <div className="relative max-h-[90vh] max-w-[92vw]">
                        <button
                            onClick={() => setShowHeroModal(false)}
                            className="absolute -right-3 -top-3 rounded-full bg-white p-2 shadow-lg transition hover:bg-slate-100"
                        >
                            <X className="h-5 w-5 text-slate-700" />
                        </button>
                        <img
                            src={heroPreview}
                            alt="Hero"
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
            {activeTab === 'profile' && (
                <div className="space-y-6">
                    <div className="surface-card overflow-hidden rounded-3xl">
                        <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-8">
                            <div className="relative z-10">
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-[#253566] p-3 shadow-lg">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Profile Photo</h2>
                                        <p className="text-sm text-slate-500">Upload the professional photo shown across your doctor profile.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                                        {photoPreview ? 'Photo ready' : 'No photo uploaded'}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                                        {data.degree || 'Degree pending'}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                <div className="relative group">
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#253566] to-[#c57945] opacity-50 blur transition group-hover:opacity-75"></div>
                                    <div
                                        onClick={() => photoPreview && setShowPhotoModal(true)}
                                        className={`relative h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-white shadow-2xl ${photoPreview ? 'cursor-pointer' : ''}`}
                                    >
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Profile"
                                                className="h-full w-full object-cover transition group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#253566] to-[#c57945]">
                                                <User className="h-16 w-16 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    {(uploadingPhoto || deletingPhoto) && (
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                                        </div>
                                    )}
                                    <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-3 border-white bg-emerald-500 shadow-lg"></div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                        onChange={handlePhotoSelect}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploadingPhoto}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-[#3556a6] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a488f] hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        <Upload className="h-5 w-5" />
                                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>

                                    {photoPreview && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPhotoModal(true)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
                                            >
                                                <Camera className="h-4 w-4" />
                                                View
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDeletePhoto}
                                                disabled={deletingPhoto}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-center text-xs text-slate-400">Max: 10MB • JPEG, PNG, GIF, WebP</p>
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end md:absolute md:bottom-4 md:right-4 md:mt-0">
                                <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white/95 p-1 shadow-sm">
                                    {bannerTabs.map((item) => {
                                        const Icon = item.icon;
                                        const active = activeTab === item.key;
                                        return (
                                            <button
                                                key={`photo-tab-${item.key}`}
                                                type="button"
                                                onClick={() => setActiveTab(item.key)}
                                                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                                    active
                                                        ? 'bg-[#3556a6] text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {item.compactLabel}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>

                    <div className="surface-card overflow-hidden rounded-3xl">
                        <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-100/70 p-8">
                            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-[#0f766e] p-3 shadow-lg">
                                        <Camera className="h-6 w-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Hero Image</h2>
                                        <p className="text-sm text-slate-500">Upload the wide banner image shown in the homepage hero section.</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                                        {heroPreview ? 'Hero ready' : 'No hero image uploaded'}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
                                        Recommended: 1600×900+
                                    </span>
                                </div>
                            </div>

                            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_280px] lg:items-start">
                                <div>
                                    <div
                                        onClick={() => heroPreview && setShowHeroModal(true)}
                                        className={`relative aspect-[16/9] overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-xl ${heroPreview ? 'cursor-pointer' : ''}`}
                                    >
                                        {heroPreview ? (
                                            <img
                                                src={heroPreview}
                                                alt="Hero preview"
                                                className="h-full w-full object-cover transition hover:scale-[1.02]"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#d9f2ef_0%,#eff6ff_48%,#f8fafc_100%)] text-slate-500">
                                                <div className="text-center">
                                                    <Camera className="mx-auto h-12 w-12 text-slate-400" />
                                                    <p className="mt-3 text-sm font-semibold">No hero image yet</p>
                                                    <p className="mt-1 text-xs text-slate-400">This image appears behind the homepage headline.</p>
                                                </div>
                                            </div>
                                        )}
                                        {(uploadingHero || deletingHero) && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <input
                                        ref={heroInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                                        onChange={handleHeroSelect}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => heroInputRef.current?.click()}
                                        disabled={uploadingHero}
                                        className="flex items-center justify-center gap-2 rounded-xl bg-[#0f766e] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b5f59] hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        <Upload className="h-5 w-5" />
                                        {heroPreview ? 'Change Hero Image' : 'Upload Hero Image'}
                                    </button>

                                    {heroPreview && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowHeroModal(true)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                            >
                                                <Camera className="h-4 w-4" />
                                                View
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleDeleteHero}
                                                disabled={deletingHero}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:border-rose-300 hover:bg-rose-50 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}

                                    <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-600 shadow-sm">
                                        <p className="font-semibold text-slate-800">Where this image appears</p>
                                        <p className="mt-3 text-xs text-slate-400">Max: 4MB • JPEG, PNG, GIF, WebP</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleBrandingSubmit} className="surface-card overflow-hidden rounded-3xl border border-slate-200 p-7 shadow-sm">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Branding Icons</h2>
                                <p className="text-sm text-slate-500">Set favicon, brand logo, sidebar icon and chamber icon from doctor profile.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={brandingProcessing}
                                className="flex items-center gap-2 rounded-xl bg-[#3556a6] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a488f] disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
                                {brandingProcessing ? 'Saving...' : 'Save Icons'}
                            </button>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">
                            {[
                                { field: 'favicon_url', label: 'Favicon Icon', helper: 'Browser tab icon.' },
                                { field: 'brand_logo_url', label: 'Brand Logo', helper: 'Public header/brand logo.' },
                                { field: 'sidebar_logo_url', label: 'Dashboard Sidebar Icon', helper: 'Doctor/Admin/User sidebar logo.' },
                                { field: 'chamber_icon_url', label: 'Chamber Icon', helper: 'Chamber card and menu icon.' },
                            ].map((item) => (
                                <div key={item.field} className="rounded-2xl border border-slate-200 p-4">
                                    <label className={labelClass}>{item.label}</label>
                                    {brandingErrors[item.field] && <p className={errorClass}>{brandingErrors[item.field]}</p>}
                                    <p className="mt-1 text-xs text-slate-400">{item.helper}</p>

                                    <div className="mt-3 flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp,.svg,image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                setUploadingBranding((prev) => ({ ...prev, [item.field]: true }));
                                                try {
                                                    await uploadBrandingFile(item.field, file);
                                                } catch (uploadError) {
                                                    toastError(uploadError.message || 'Upload failed');
                                                } finally {
                                                    setUploadingBranding((prev) => ({ ...prev, [item.field]: false }));
                                                    e.target.value = '';
                                                }
                                            }}
                                            className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                        />
                                        {uploadingBranding[item.field] ? <span className="text-xs text-slate-500">Uploading...</span> : null}
                                    </div>

                                    {brandingData[item.field] ? (
                                        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                                            <img src={brandingData[item.field]} alt={item.label} className="h-16 w-full object-contain" />
                                        </div>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                    </form>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {activeTab === 'profile' && (
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Personal Information */}
                    <div className="surface-card rounded-3xl border border-slate-200 p-7 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-[#edf1fb] p-3">
                                <User className="h-6 w-6 text-[#3556a6]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Personal Information
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Your basic personal details
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className={labelClass}>
                                    <User className="mr-2 inline h-4 w-4" />
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Dr. John Doe"
                                />
                                {errors.name && <p className={errorClass}>{errors.name}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Mail className="mr-2 inline h-4 w-4" />
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    className={inputClass}
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="doctor@example.com"
                                />
                                {errors.email && <p className={errorClass}>{errors.email}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Phone className="mr-2 inline h-4 w-4" />
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="01XXXXXXXXX"
                                />
                                {errors.phone && <p className={errorClass}>{errors.phone}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <MapPin className="mr-2 inline h-4 w-4" />
                                    Address / Chamber
                                </label>
                                <textarea
                                    className={`${inputClass} min-h-[100px] resize-none`}
                                    value={data.address}
                                    onChange={(e) => setData('address', e.target.value)}
                                    placeholder="Your clinic/chamber address"
                                />
                                {errors.address && <p className={errorClass}>{errors.address}</p>}
                            </div>

                            {/* <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className={labelClass}>
                                        <Calendar className="mr-2 inline h-4 w-4" />
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        className={inputClass}
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                    />
                                    {errors.date_of_birth && (
                                        <p className={errorClass}>{errors.date_of_birth}</p>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>Gender</label>
                                    <select
                                        className={inputClass}
                                        value={data.gender}
                                        onChange={(e) => setData('gender', e.target.value)}
                                    >
                                        <option value="">Select Gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.gender && <p className={errorClass}>{errors.gender}</p>}
                                </div>
                            </div> */}
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="surface-card rounded-3xl border border-slate-200 p-7 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-[#edf1fb] p-3">
                                <Stethoscope className="h-6 w-6 text-[#3556a6]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">
                                    Professional Information
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Your medical credentials
                                </p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className={labelClass}>
                                    <Stethoscope className="mr-2 inline h-4 w-4" />
                                    Specialization
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.specialization}
                                    onChange={(e) => setData('specialization', e.target.value)}
                                    placeholder="e.g., Medicine, Cardiology, Pediatrics"
                                />
                                {errors.specialization && (
                                    <p className={errorClass}>{errors.specialization}</p>
                                )}
                                <p className="mt-1 text-xs text-slate-400">
                                    Your area of medical expertise
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <GraduationCap className="mr-2 inline h-4 w-4" />
                                    Degrees & Qualifications
                                </label>
                                <textarea
                                    className={`${inputClass} min-h-[120px] resize-none`}
                                    value={data.degree}
                                    onChange={(e) => setData('degree', e.target.value)}
                                    placeholder="e.g., MBBS, FCPS (Medicine), MD"
                                />
                                {errors.degree && <p className={errorClass}>{errors.degree}</p>}
                                <p className="mt-1 text-xs text-slate-400">
                                    List all your medical degrees and qualifications
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Award className="mr-2 inline h-4 w-4" />
                                    BMDC Registration Number
                                </label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.registration_no}
                                    onChange={(e) => setData('registration_no', e.target.value)}
                                    placeholder="e.g., A-12345"
                                />
                                {errors.registration_no && (
                                    <p className={errorClass}>{errors.registration_no}</p>
                                )}
                                <p className="mt-1 text-xs text-slate-400">
                                    Your Bangladesh Medical & Dental Council registration number
                                </p>
                            </div>

                            <div>
                                <label className={labelClass}>
                                    <Stethoscope className="mr-2 inline h-4 w-4" />
                                    Prescription Template Preference
                                </label>
                                <select
                                    className={inputClass}
                                    value={data.preferred_template_type}
                                    onChange={(e) => setData('preferred_template_type', e.target.value)}
                                >
                                    <option value="general">General</option>
                                    <option value="eye">Eye</option>
                                </select>
                                {errors.preferred_template_type && (
                                    <p className={errorClass}>{errors.preferred_template_type}</p>
                                )}
                                <p className="mt-1 text-xs text-slate-400">
                                    This controls which prescription layout opens by default.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'about' && (
                    <div className="surface-card rounded-3xl border border-slate-200 p-7 shadow-sm">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-[#edf1fb] p-3">
                                <FileText className="h-6 w-6 text-[#3556a6]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">About Section Content</h2>
                                <p className="text-sm text-slate-500">Homepage About section data manage করুন</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                            {bannerTabs.map((item) => {
                                const Icon = item.icon;
                                const active = activeTab === item.key;
                                return (
                                    <button
                                        key={`about-tab-${item.key}`}
                                        type="button"
                                        onClick={() => setActiveTab(item.key)}
                                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                                            active
                                                ? 'bg-[#3556a6] text-white'
                                                : 'text-slate-600 hover:bg-white hover:text-slate-800'
                                        }`}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {item.compactLabel}
                                    </button>
                                );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-5 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <label className={labelClass}>About Subtitle</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_subtitle}
                                    onChange={(e) => setData('about_subtitle', e.target.value)}
                                    placeholder="Excellence in dermatological care..."
                                />
                                {errors.about_subtitle && <p className={errorClass}>{errors.about_subtitle}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className={labelClass}>Bio in Details</label>
                                <textarea
                                    className={`${inputClass} min-h-[220px] resize-none`}
                                    value={data.about_bio_details}
                                    onChange={(e) => setData('about_bio_details', e.target.value)}
                                    placeholder="Write detailed bio here. Use blank lines to separate multiple paragraphs if needed."
                                />
                                {errors.about_bio_details && <p className={errorClass}>{errors.about_bio_details}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Highlight Value</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_highlight_value}
                                    onChange={(e) => setData('about_highlight_value', e.target.value)}
                                    placeholder="20+"
                                />
                                {errors.about_highlight_value && <p className={errorClass}>{errors.about_highlight_value}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Highlight Label</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_highlight_label}
                                    onChange={(e) => setData('about_highlight_label', e.target.value)}
                                    placeholder="Years Experience"
                                />
                                {errors.about_highlight_label && <p className={errorClass}>{errors.about_highlight_label}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Credentials Title</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_credentials_title}
                                    onChange={(e) => setData('about_credentials_title', e.target.value)}
                                    placeholder="Credentials & Certifications"
                                />
                                {errors.about_credentials_title && <p className={errorClass}>{errors.about_credentials_title}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className={labelClass}>Credentials (one per line)</label>
                                <textarea
                                    className={`${inputClass} min-h-[120px] resize-none`}
                                    value={data.about_credentials_text}
                                    onChange={(e) => setData('about_credentials_text', e.target.value)}
                                    placeholder={"MD, Harvard Medical School\nBoard Certified, American Academy..."}
                                />
                                {errors.about_credentials_text && <p className={errorClass}>{errors.about_credentials_text}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Stat: Patients Treated</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_stats_patients_treated}
                                    onChange={(e) => setData('about_stats_patients_treated', e.target.value)}
                                    placeholder="15,000+"
                                />
                                {errors.about_stats_patients_treated && <p className={errorClass}>{errors.about_stats_patients_treated}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Stat: Years Experience</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_stats_years_experience}
                                    onChange={(e) => setData('about_stats_years_experience', e.target.value)}
                                    placeholder="20+"
                                />
                                {errors.about_stats_years_experience && <p className={errorClass}>{errors.about_stats_years_experience}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Stat: Patient Satisfaction</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_stats_patient_satisfaction}
                                    onChange={(e) => setData('about_stats_patient_satisfaction', e.target.value)}
                                    placeholder="98%"
                                />
                                {errors.about_stats_patient_satisfaction && <p className={errorClass}>{errors.about_stats_patient_satisfaction}</p>}
                            </div>

                            <div>
                                <label className={labelClass}>Stat: Medical Cases</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={data.about_stats_medical_cases}
                                    onChange={(e) => setData('about_stats_medical_cases', e.target.value)}
                                    placeholder="100+"
                                />
                                {errors.about_stats_medical_cases && <p className={errorClass}>{errors.about_stats_medical_cases}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="mt-5 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-3 rounded-xl bg-[#3556a6] px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-5 w-5" />
                        {processing ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>

            <form onSubmit={handlePasswordSubmit} className="surface-card rounded-3xl border border-slate-200 p-7 shadow-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="rounded-xl bg-[#edf1fb] p-3">
                        <KeyRound className="h-6 w-6 text-[#3556a6]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Change Password</h2>
                        <p className="text-sm text-slate-500">Update your account password securely.</p>
                    </div>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    <div>
                        <label className={labelClass}>Current Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.current_password ? 'text' : 'password'}
                                className={`${inputClass} pr-11`}
                                value={passwordData.current_password}
                                onChange={(e) => setPasswordData('current_password', e.target.value)}
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
                        {passwordErrors.current_password && <p className={errorClass}>{passwordErrors.current_password}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>New Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.password ? 'text' : 'password'}
                                className={`${inputClass} pr-11`}
                                value={passwordData.password}
                                onChange={(e) => setPasswordData('password', e.target.value)}
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
                        {passwordErrors.password && <p className={errorClass}>{passwordErrors.password}</p>}
                    </div>

                    <div>
                        <label className={labelClass}>Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showPasswords.password_confirmation ? 'text' : 'password'}
                                className={`${inputClass} pr-11`}
                                value={passwordData.password_confirmation}
                                onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
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

                {passwordSaved && (
                    <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                        Password changed successfully.
                    </div>
                )}

                <div className="mt-5 flex justify-end">
                    <button
                        type="submit"
                        disabled={passwordProcessing}
                        className="flex items-center gap-3 rounded-xl bg-[#3556a6] px-8 py-3.5 font-semibold text-white shadow-sm transition hover:bg-[#2a488f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <KeyRound className="h-5 w-5" />
                        {passwordProcessing ? 'Changing...' : 'Change Password'}
                    </button>
                </div>
            </form>
      </div>
        </DoctorLayout>    );
}