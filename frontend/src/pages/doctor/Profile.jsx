import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    BadgeCheck,
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
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { DocCard } from '../../components/doctor/DocUI';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorProfile({ doctor = {} }) {
    const page = usePage();
    const flash = page?.props?.flash || {};
    const [showSuccess, setShowSuccess] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(doctor.profile_picture || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const fileInputRef = useRef(null);

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

    useEffect(() => {
        if (flash?.success) {
            toastSuccess(flash.success);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        }
        if (flash?.error) {
            toastError(flash.error);
        }
    }, [flash]);

    useEffect(() => {
        setPhotoPreview(doctor.profile_picture || null);
    }, [doctor.profile_picture]);

    const handleSubmit = (e) => {
        e.preventDefault();
        put('/doctor/profile', {
            preserveScroll: true,
            onError: () => {
                toastError('Failed to update profile. Please check the form.');
            },
        });
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

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toastError('Image size must be less than 2MB');
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

    const inputClass =
        'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 doc-input-focus transition';
    const labelClass = 'mb-2 block text-sm font-semibold text-slate-700';
    const errorClass = 'mt-1 text-xs font-semibold text-rose-600';
    const profileMetrics = [
        {
            label: 'Doctor',
            value: (data.name || doctor.name || 'Doctor').split(' ')[0],
            tone: 'border-[#d6e1fa]/30 bg-[#d6e1fa]/14 text-[#f2f6ff]',
        },
        {
            label: 'Specialty',
            value: data.specialization || 'Pending',
            tone: 'border-[#f0bf97]/35 bg-[#f0bf97]/16 text-[#ffe6d3]',
        },
        {
            label: 'BMDC',
            value: data.registration_no || 'Pending',
            tone: 'border-[#c7d6f7]/30 bg-[#c7d6f7]/16 text-[#eaf0ff]',
        },
        {
            label: 'Editing',
            value: activeTab === 'profile' ? 'Profile' : 'About',
            tone: 'border-[#e5b894]/36 bg-[#e5b894]/18 text-[#ffe3cf]',
        },
    ];

    return (
        <DoctorLayout title="My Profile">
      <Head title="My Profile" />
      <div className="mx-auto max-w-6xl space-y-6">

            <DocCard padding={false} className="doc-banner-root relative overflow-hidden border-[#30416f]/20 bg-gradient-to-r from-[#273664] via-[#3d466b] to-[#be7a4b] text-white shadow-[0_20px_40px_-28px_rgba(33,45,80,0.85)] md:h-[260px]">
                <div className="pointer-events-none absolute -top-20 left-[-50px] h-48 w-48 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-16 right-[-26px] h-52 w-52 rounded-full bg-[#efba92]/15" />

                <div className="absolute inset-0 z-20 flex flex-col justify-end px-5 py-4 md:px-6 md:py-5">
                    <div className="grid w-full gap-3 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/85">
                                <User className="h-3.5 w-3.5" />
                                Profile Studio
                            </div>
                            <p className="text-xs font-medium uppercase tracking-wider text-white/70">Doctor Identity</p>
                            <h1 className="text-[1.8rem] font-black leading-tight tracking-tight text-white md:text-[2.05rem]">Profile Workspace</h1>
                            <p className="max-w-xl text-[13px] text-white/80">Manage profile identity, medical credentials, prescription preview, and homepage about content in one place.</p>
                            <div className="flex flex-wrap items-center gap-2 pt-0.5">
                                <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Tab</div>
                                    <div className="mt-0.5 text-xs font-bold text-white">{activeTab === 'profile' ? 'Profile' : 'About'}</div>
                                </div>
                                <div className="rounded-lg border border-white/20 bg-black/10 px-2.5 py-1">
                                    <div className="text-[9px] font-semibold uppercase tracking-[0.1em] text-white/60">Photo</div>
                                    <div className="mt-0.5 text-xs font-bold text-white">{photoPreview ? 'Uploaded' : 'Pending'}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {profileMetrics.map((item) => (
                                <div key={item.label} className={`rounded-lg border px-2.5 py-2 ${item.tone}`}>
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.11em]">{item.label}</div>
                                    <div className="mt-1 text-lg font-black leading-none">{item.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </DocCard>

            {/* Photo View Modal */}
            {showPhotoModal && photoPreview && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
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

                        {/* Success Message */}
            {showSuccess && (
                <div className="animate-in slide-in-from-top mb-6 duration-300">
                    <div className="rounded-2xl border border-[#efc7a9] bg-gradient-to-r from-[#fff6ee] to-[#f8eadc] p-5">
                        <div className="flex items-center gap-3">
                            <BadgeCheck className="h-6 w-6 flex-shrink-0 text-[#c57945]" />
                            <div className="text-sm font-semibold text-[#7a4b2a]">
                                Profile updated successfully!
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Profile Photo & Preview Section */}
            <div className="overflow-hidden rounded-xl bg-white border border-slate-200 shadow-sm">
                <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Photo Upload with Gradient Background */}
                    <div className="relative flex-1 bg-gradient-to-br from-[#eef2ff] via-white to-[#fff3ea]/70 p-8">
                 
                        
                        <div className="relative z-10">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-xl bg-[#253566] p-3 shadow-lg">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Profile Photo</h2>
                                    <p className="text-sm text-slate-500">
                                        Upload your professional photo
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                {/* Photo Preview with fancy border */}
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
                                    {/* Online indicator */}
                                    <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border-3 border-white bg-emerald-500 shadow-lg"></div>
                                </div>

                                {/* Photo Actions - Styled buttons */}
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

                                    <p className="text-center text-xs text-slate-400">
                                        Max: 2MB • JPEG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Prescription Header Preview */}
                    <div className="border-t border-dashed border-slate-200 bg-gradient-to-br from-slate-50 to-[#fff3ea]/60 p-8 lg:w-[340px] lg:border-l lg:border-t-0">
                        <div className="mb-4 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-slate-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                Prescription Preview
                            </span>
                        </div>
                        
                        {/* Preview Card */}
                        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start gap-4">
                                {photoPreview ? (
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                                        <img
                                            src={photoPreview}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#253566] to-[#c57945] shadow-sm">
                                        <Stethoscope className="h-8 w-8 text-white" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="text-lg font-bold text-slate-800">
                                        {data.name || 'Doctor Name'}
                                    </div>
                                    {data.degree && (
                                        <div className="mt-0.5 text-sm font-semibold text-slate-600">
                                            {data.degree}
                                        </div>
                                    )}
                                    {data.specialization && (
                                        <div className="mt-0.5 text-sm font-medium text-[#3556a6]">
                                            {data.specialization}
                                        </div>
                                    )}
                                    {data.registration_no && (
                                        <div className="mt-2 inline-flex items-center rounded-full border border-[#d7dfec] bg-[#edf1fb] px-2.5 py-1 text-xs font-medium text-[#3556a6]">
                                            Reg: {data.registration_no}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-4 text-center text-xs text-slate-400">
                            This is how your info appears on prescriptions
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            activeTab === 'profile'
                                ? 'bg-[#253566] text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        Profile
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('about')}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                            activeTab === 'about'
                                ? 'bg-[#253566] text-white'
                                : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        About
                    </button>
                </div>

                {activeTab === 'profile' && (
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Personal Information */}
                    <div className="rounded-xl bg-white border border-slate-200 p-7 shadow-sm">
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

                            <div className="grid gap-4 sm:grid-cols-2">
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
                            </div>
                        </div>
                    </div>

                    {/* Professional Information */}
                    <div className="rounded-xl bg-white border border-slate-200 p-7 shadow-sm">
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
                        </div>
                    </div>
                </div>
                )}

                {activeTab === 'about' && (
                    <div className="rounded-xl bg-white border border-slate-200 p-7 shadow-sm">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-[#edf1fb] p-3">
                                <FileText className="h-6 w-6 text-[#3556a6]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-slate-800">About Section Content</h2>
                                <p className="text-sm text-slate-500">Homepage About section data manage করুন</p>
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
      </div>
        </DoctorLayout>    );
}