<?php

use App\Http\Controllers\Admin\SiteContentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CompoundController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\PrescriptionController as ApiPrescriptionController;
use App\Http\Controllers\Api\PublicController;
use App\Http\Controllers\DoctorScheduleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth (Sanctum tokens � for web SPA and mobile apps)
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password-reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password-reset');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

/*
|--------------------------------------------------------------------------
| Public � no authentication required
|--------------------------------------------------------------------------
*/

Route::prefix('public')->group(function () {
    Route::get('/doctor', [PublicController::class, 'doctor']);
    Route::get('/chambers', [PublicController::class, 'chambers']);
    Route::get('/schedule', [PublicController::class, 'schedule']);
    Route::get('/unavailable-ranges', [PublicController::class, 'unavailableRanges']);
    Route::get('/slots/{date}', [PublicController::class, 'availableSlots']);
    Route::get('/booking-preview', [PublicController::class, 'bookingPreview']);
    Route::middleware('throttle:captcha')->get('/captcha', [PublicController::class, 'captcha']);
    Route::middleware('throttle:booking-submit')->post('/contact', [PublicController::class, 'contact']);
    Route::middleware('throttle:booking-submit')->post('/book-appointment', [PublicController::class, 'bookAppointment']);
    Route::get('/site-content/home', [App\Http\Controllers\Api\SiteContentApiController::class, 'home']);
});

/*
|--------------------------------------------------------------------------
| Patient � authenticated patient
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:patient'])
    ->prefix('patient')
    ->group(function () {
        Route::get('/dashboard-mobile', [PatientController::class, 'dashboardMobile']);
        Route::get('/appointments-mobile', [PatientController::class, 'appointmentsMobile']);
        Route::get('/profile', [PatientController::class, 'profile']);
        Route::put('/profile', [PatientController::class, 'updateProfile']);
        Route::get('/appointments', [PatientController::class, 'appointments']);
        Route::get('/appointments/{appointment}', [PatientController::class, 'appointmentShow']);
        Route::get('/prescriptions', [PatientController::class, 'prescriptions']);
        Route::get('/prescriptions/{prescription}', [PatientController::class, 'prescriptionShow']);
        Route::get('/prescriptions/{prescription}/reports', [PatientController::class, 'prescriptionReports']);
        Route::post('/prescriptions/{prescription}/reports', [PatientController::class, 'uploadPrescriptionReport']);
        Route::put('/prescriptions/{prescription}/reports/{report}', [PatientController::class, 'updatePrescriptionReport']);
        Route::post('/link-guest-appointments', [PatientController::class, 'linkGuestAppointments']);
    });

/*
|--------------------------------------------------------------------------
| Doctor � authenticated doctor
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:doctor,compounder'])
    ->prefix('doctor')
    ->group(function () {
        // Stats
        Route::get('/stats', [DoctorController::class, 'stats']);

        // Appointments
        Route::get('/appointments', [DoctorController::class, 'appointments']);
        Route::post('/appointments', [DoctorController::class, 'createWalkinAppointment']);
        Route::get('/appointments/{appointment}', [DoctorController::class, 'appointmentShow']);
        Route::put('/appointments/{appointment}/status', [DoctorController::class, 'updateAppointmentStatus']);

        // Patients
        Route::get('/patients', [DoctorController::class, 'patients']);
        Route::post('/patients', [DoctorController::class, 'createPatient']);
        Route::get('/patients/{user}', [DoctorController::class, 'patientShow']);
        Route::put('/patients/{user}', [DoctorController::class, 'updatePatient']);
        Route::put('/patients/{user}/password', [DoctorController::class, 'updatePatientPassword']);

        // Prescriptions
        Route::get('/prescriptions', [DoctorController::class, 'prescriptions']);
        Route::post('/prescriptions', [ApiPrescriptionController::class, 'store']);
        Route::get('/prescriptions/{prescription}', [DoctorController::class, 'prescriptionShow'])->whereNumber('prescription');
        Route::put('/prescriptions/{prescription}', [ApiPrescriptionController::class, 'update'])->whereNumber('prescription');
        Route::get('/prescriptions/{prescription}/reports', [ApiPrescriptionController::class, 'reports'])->whereNumber('prescription');
        Route::post('/prescriptions/{prescription}/reports', [ApiPrescriptionController::class, 'uploadReport'])->whereNumber('prescription');
        Route::put('/prescriptions/{prescription}/reports/{report}', [ApiPrescriptionController::class, 'updateReport'])
            ->whereNumber('prescription')
            ->whereNumber('report');

        // Schedule
        Route::get('/schedule', [DoctorController::class, 'schedule']);
        Route::post('/schedule', [DoctorScheduleController::class, 'update']);

        // Chambers
        Route::get('/chambers', [DoctorController::class, 'chambers']);

        // Medicines
        Route::get('/medicines', [DoctorController::class, 'medicines']);
        Route::post('/medicines', [DoctorController::class, 'storeMedicine'])->middleware('role:doctor');
        Route::put('/medicines/{medicine}', [DoctorController::class, 'updateMedicine'])->middleware('role:doctor');
        Route::delete('/medicines/{medicine}', [DoctorController::class, 'destroyMedicine'])->middleware('role:doctor');

        // Profile
        Route::get('/profile', [DoctorController::class, 'profile']);
        Route::put('/profile', [DoctorController::class, 'updateProfile']);
    });

/*
|--------------------------------------------------------------------------
| Compounder � clinic assistant / manager (replaces old "admin")
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'role:compounder'])
    ->prefix('compounder')
    ->group(function () {
        Route::get('/stats', [CompoundController::class, 'stats']);
        Route::get('/appointments', [CompoundController::class, 'appointments']);
        Route::put('/appointments/{appointment}/status', [CompoundController::class, 'updateAppointmentStatus']);
        Route::post('/appointments', [CompoundController::class, 'bookAppointment']);
        Route::get('/users', [CompoundController::class, 'users']);
        Route::get('/prescriptions', [CompoundController::class, 'prescriptions']);
        Route::get('/prescriptions/{prescription}', [CompoundController::class, 'prescriptionShow']);
        Route::get('/reports', [CompoundController::class, 'reports']);
        Route::put('/site-content/home', [SiteContentController::class, 'updateHome']);
        Route::post('/site-content/upload', [SiteContentController::class, 'uploadImage']);
    });
