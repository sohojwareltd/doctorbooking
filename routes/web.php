<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Http\Controllers\Web\PublicController;
use App\Http\Controllers\Web\DashboardController;
use App\Http\Controllers\Web\AppointmentController as WebAppointmentController;
use App\Http\Controllers\Web\PrescriptionController as WebPrescriptionController;
use App\Http\Controllers\Web\PatientController;
use App\Http\Controllers\Web\ReportsController;
use App\Http\Controllers\Web\ProfileController;
use App\Http\Controllers\Web\ChamberController;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\Admin\SiteContentController;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', [PublicController::class, 'home'])->name('home');
Route::get('/about', [PublicController::class, 'about'])->name('about');
Route::get('/contact', [PublicController::class, 'contact'])->name('contact');
Route::post('/contact', fn () => redirect()->back())->name('contact.submit');

// Public booking page (Inertia render only — data fetched via /api/public/*)
Route::get('/book-appointment', [PublicController::class, 'bookAppointment'])->name('public.book-appointment.view');

// Booking profile pre-fill (session auth — for logged-in users on the public booking page)
Route::middleware('auth')->get('/user/booking-profile', [\App\Http\Controllers\Api\AuthController::class, 'bookingProfile'])->name('user.booking-profile');

// Captcha + booking submission (must be web routes so session works)
Route::get('/api/public/captcha', [\App\Http\Controllers\Api\PublicController::class, 'captcha']);
Route::post('/api/public/book-appointment', [\App\Http\Controllers\Api\PublicController::class, 'bookAppointment']);

/*
|--------------------------------------------------------------------------
| Shared Dashboard Redirect
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

/*
|--------------------------------------------------------------------------
| Patient Routes (role: patient)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:patient'])
    ->prefix('patient')
    ->name('patient.')
    ->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'patient'])->name('dashboard');
    Route::get('/appointments', [WebAppointmentController::class, 'patientIndex'])->name('appointments');
    Route::get('/book-appointment', [WebAppointmentController::class, 'patientBookView'])->name('book-appointment');
    Route::get('/prescriptions', [WebPrescriptionController::class, 'patientIndex'])->name('prescriptions');
    Route::get('/profile', [ProfileController::class, 'patientShow'])->name('profile');
});

/*
|--------------------------------------------------------------------------
| Doctor Routes (role: doctor)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:doctor'])
    ->prefix('doctor')
    ->name('doctor.')
    ->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'doctor'])->name('dashboard');

    // Appointments
    Route::get('/appointments', [WebAppointmentController::class, 'doctorIndex'])->name('appointments');

    // Patients
    Route::get('/patients', [PatientController::class, 'index'])->name('patients');
    Route::get('/patients/{patient}', [PatientController::class, 'show'])->whereNumber('patient')->name('patients.show');

    // Prescriptions
    Route::get('/prescriptions', [WebPrescriptionController::class, 'doctorIndex'])->name('prescriptions');
    Route::get('/prescriptions/create', [WebPrescriptionController::class, 'doctorCreate'])->name('prescriptions.create');
    Route::post('/prescriptions', [WebPrescriptionController::class, 'doctorStore'])->name('prescriptions.store');
    Route::get('/prescriptions/{prescription}', [WebPrescriptionController::class, 'doctorShow'])->whereNumber('prescription')->name('prescriptions.show');
    Route::put('/prescriptions/{prescription}', [WebPrescriptionController::class, 'doctorUpdate'])->whereNumber('prescription')->name('prescriptions.update');

    // Schedule
    Route::get('/schedule', [DoctorScheduleController::class, 'show'])->name('schedule');
    Route::post('/schedule', [DoctorScheduleController::class, 'update'])->name('schedule.update');

    // Profile
    Route::get('/profile', [ProfileController::class, 'doctorShow'])->name('profile');
    Route::put('/profile', [ProfileController::class, 'doctorUpdate'])->name('profile.update');
    Route::post('/profile/photo', [ProfileController::class, 'doctorPhotoUpload'])->name('profile.photo.upload');
    Route::delete('/profile/photo', [ProfileController::class, 'doctorPhotoDelete'])->name('profile.photo.delete');

    // Chambers
    Route::get('/chambers', [ChamberController::class, 'index'])->name('chambers');
    Route::post('/chambers', [ChamberController::class, 'save'])->name('chambers.save');
    Route::delete('/chambers/{chamber}', [ChamberController::class, 'destroy'])->name('chambers.delete');
});

/*
|--------------------------------------------------------------------------
| Compounder Routes (role: compounder) � replaces old "admin"
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:compounder'])
    ->prefix('compounder')
    ->name('compounder.')
    ->group(function () {

    Route::get('/dashboard', [DashboardController::class, 'compounder'])->name('dashboard');

    // Appointments
    Route::get('/appointments', [WebAppointmentController::class, 'compoundIndex'])->name('appointments');
    Route::get('/book-appointment', [WebAppointmentController::class, 'compoundBookView'])->name('book-appointment');

    // Users / Patients
    Route::get('/users', [PatientController::class, 'compoundUsers'])->name('users');

    // Prescriptions
    Route::get('/prescriptions', [WebPrescriptionController::class, 'compoundIndex'])->name('prescriptions');
    Route::get('/prescriptions/{prescription}', [WebPrescriptionController::class, 'compoundShow'])->whereNumber('prescription')->name('prescriptions.show');

    // Reports
    Route::get('/reports', [ReportsController::class, 'index'])->name('reports');

    // Settings (site content)
    Route::get('/settings', [SiteContentController::class, 'edit'])->name('settings');
    Route::put('/settings/site-content/home', [SiteContentController::class, 'updateHome'])->name('settings.site-content.home');
    Route::post('/settings/site-content/upload', [SiteContentController::class, 'uploadImage'])->name('settings.site-content.upload');

    // Doctor management view
    Route::get('/doctor', fn () => \Inertia\Inertia::render('admin/Doctor'))->name('doctor');
});

/*
|--------------------------------------------------------------------------
| Legacy admin.* aliases ? compounder.* redirects
| Keeps any existing bookmarked URLs / frontend links working.
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:compounder'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

    Route::get('/dashboard', fn () => redirect()->route('compounder.dashboard'))->name('dashboard');
    Route::get('/appointments', fn () => redirect()->route('compounder.appointments'))->name('appointments');
    Route::get('/users', fn () => redirect()->route('compounder.users'))->name('users');
    Route::get('/prescriptions', fn () => redirect()->route('compounder.prescriptions'))->name('prescriptions');
    Route::get('/reports', fn () => redirect()->route('compounder.reports'))->name('reports');
    Route::get('/settings', fn () => redirect()->route('compounder.settings'))->name('settings');
    Route::get('/book-appointment', fn () => redirect()->route('compounder.book-appointment'))->name('book-appointment');

    // Keep old status update routes working (for any in-flight AJAX calls)
    Route::post('/appointments/{appointment}/status', [WebAppointmentController::class, 'updateStatus'])->name('appointments.status');
});

/*
|--------------------------------------------------------------------------
| Legacy user.* aliases ? patient.* redirects
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:patient'])
    ->prefix('user')
    ->name('user.')
    ->group(function () {

    Route::get('/dashboard', fn () => redirect()->route('patient.dashboard'))->name('dashboard');
    Route::get('/appointments', fn () => redirect()->route('patient.appointments'))->name('appointments');
    Route::get('/book-appointment', fn () => redirect()->route('patient.book-appointment'))->name('book-appointment');
    Route::get('/prescriptions', fn () => redirect()->route('patient.prescriptions'))->name('prescriptions');
    Route::get('/profile', fn () => redirect()->route('patient.profile'))->name('profile');
});

require __DIR__.'/settings.php';
