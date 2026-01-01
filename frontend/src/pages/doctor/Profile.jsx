import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Award,
    BadgeCheck,
    Calendar,
    Camera,
    GraduationCap,
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
import GlassCard from '../../components/GlassCard';
import { toastError, toastSuccess } from '../../utils/toast';

export default function DoctorProfile({ doctor = {} }) {
    const page = usePage();
    const flash = page?.props?.flash || {};
    const [showSuccess, setShowSuccess] = useState(false);
    const [photoPreview, setPhotoPreview] = useState(doctor.profile_picture || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [deletingPhoto, setDeletingPhoto] = useState(false);
    const [showPhotoModal, setShowPhotoModal] = useState(false);
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
        'w-full rounded-2xl border border-[#00acb1]/30 bg-white px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-4 focus:ring-[#00acb1]/20 transition';
    const labelClass = 'mb-2 block text-sm font-semibold text-[#005963]';
    const errorClass = 'mt-1 text-xs font-semibold text-rose-600';

    return (
        <DoctorLayout title="My Profile">
            <Head title="My Profile" />

            {/* Photo View Modal */}
            {showPhotoModal && photoPreview && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
                    onClick={() => setShowPhotoModal(false)}
                >
                    <div className="relative max-h-[90vh] max-w-[90vw]">
                        <button
                            onClick={() => setShowPhotoModal(false)}
                            className="absolute -right-3 -top-3 rounded-full bg-white p-2 shadow-lg transition hover:bg-gray-100"
                        >
                            <X className="h-5 w-5 text-gray-700" />
                        </button>
                        <img
                            src={photoPreview}
                            alt="Profile"
                            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}

            {/* Hero Header */}
            <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#005963] via-[#00acb1] to-[#005963] p-8 text-white shadow-2xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="rounded-2xl bg-white/20 p-4 backdrop-blur-sm">
                            <User className="h-10 w-10" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black">My Profile</h1>
                            <p className="mt-2 text-white/90">
                                Manage your professional information
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/doctor/dashboard"
                        className="rounded-2xl bg-white/20 px-6 py-3 font-semibold backdrop-blur-sm transition hover:bg-white/30"
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
                <div className="animate-in slide-in-from-top mb-6 duration-300">
                    <GlassCard
                        variant="solid"
                        className="border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-100/60 p-5"
                    >
                        <div className="flex items-center gap-3">
                            <BadgeCheck className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                            <div className="text-sm font-semibold text-emerald-900">
                                Profile updated successfully!
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* Profile Photo & Preview Section */}
            <GlassCard variant="solid" className="mb-8 overflow-hidden p-0 shadow-xl">
                <div className="flex flex-col lg:flex-row">
                    {/* Left Side - Photo Upload with Gradient Background */}
                    <div className="relative flex-1 bg-gradient-to-br from-[#005963]/5 via-white to-[#00acb1]/5 p-8">
                 
                        
                        <div className="relative z-10">
                            <div className="mb-6 flex items-center gap-3">
                                <div className="rounded-2xl bg-gradient-to-br from-[#005963] to-[#00acb1] p-3 shadow-lg">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[#005963]">Profile Photo</h2>
                                    <p className="text-sm text-gray-600">
                                        Upload your professional photo
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                {/* Photo Preview with fancy border */}
                                <div className="relative group">
                                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#005963] to-[#00acb1] opacity-50 blur group-hover:opacity-75 transition"></div>
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
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#005963] to-[#00acb1]">
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
                                        className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
                                    >
                                        <Upload className="h-5 w-5" />
                                        {photoPreview ? 'Change Photo' : 'Upload Photo'}
                                    </button>

                                    {photoPreview && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowPhotoModal(true)}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-[#005963]/30 bg-white px-4 py-2.5 text-sm font-semibold text-[#005963] transition hover:bg-[#005963]/5 hover:border-[#005963]/50"
                                            >
                                                <Camera className="h-4 w-4" />
                                                View
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleDeletePhoto}
                                                disabled={deletingPhoto}
                                                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 hover:border-rose-300 disabled:opacity-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    )}

                                    <p className="text-center text-xs text-gray-500">
                                        Max: 2MB • JPEG, PNG, GIF, WebP
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Prescription Header Preview */}
                    <div className="border-t-2 border-dashed border-[#005963]/10 bg-gradient-to-br from-[#005963]/5 to-[#00acb1]/10 p-8 lg:w-[340px] lg:border-l-2 lg:border-t-0">
                        <div className="mb-4 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-[#005963]/60" />
                            <span className="text-xs font-bold uppercase tracking-wider text-[#005963]/60">
                                Prescription Preview
                            </span>
                        </div>
                        
                        {/* Preview Card */}
                        <div className="rounded-2xl border border-[#005963]/20 bg-white p-5 shadow-lg">
                            <div className="flex items-start gap-4">
                                {photoPreview ? (
                                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-[#005963]/20 shadow-md">
                                        <img
                                            src={photoPreview}
                                            alt="Profile"
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#005963] to-[#00acb1] shadow-md">
                                        <Stethoscope className="h-8 w-8 text-white" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <div className="text-lg font-black text-[#005963]">
                                        {data.name || 'Doctor Name'}
                                    </div>
                                    {data.degree && (
                                        <div className="mt-0.5 text-sm font-semibold text-gray-700">
                                            {data.degree}
                                        </div>
                                    )}
                                    {data.specialization && (
                                        <div className="mt-0.5 text-sm font-medium text-[#00acb1]">
                                            {data.specialization}
                                        </div>
                                    )}
                                    {data.registration_no && (
                                        <div className="mt-2 inline-flex items-center rounded-full bg-[#005963]/10 px-2.5 py-1 text-xs font-semibold text-[#005963]">
                                            Reg: {data.registration_no}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <p className="mt-4 text-center text-xs text-gray-500">
                            This is how your info appears on prescriptions
                        </p>
                    </div>
                </div>
            </GlassCard>

            <form onSubmit={handleSubmit}>
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Personal Information */}
                    <GlassCard variant="solid" className="p-6 shadow-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-[#005963]/10 p-3">
                                <User className="h-6 w-6 text-[#005963]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#005963]">
                                    Personal Information
                                </h2>
                                <p className="text-sm text-gray-600">
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
                    </GlassCard>

                    {/* Professional Information */}
                    <GlassCard variant="solid" className="p-6 shadow-xl">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="rounded-xl bg-[#005963]/10 p-3">
                                <Stethoscope className="h-6 w-6 text-[#005963]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#005963]">
                                    Professional Information
                                </h2>
                                <p className="text-sm text-gray-600">
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
                                <p className="mt-1 text-xs text-gray-500">
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
                                <p className="mt-1 text-xs text-gray-500">
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
                                <p className="mt-1 text-xs text-gray-500">
                                    Your Bangladesh Medical & Dental Council registration number
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Submit Button */}
                <div className="mt-8 mb-8 flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-[#005963] to-[#00acb1] px-8 py-4 font-bold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Save className="h-5 w-5" />
                        {processing ? 'Saving...' : 'Save Profile'}
                    </button>
                </div>
            </form>
        </DoctorLayout>    );
}