<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminApiController;
use App\Http\Controllers\Api\DoctorApiController;
use App\Http\Controllers\Api\SiteContentApiController;
use App\Http\Controllers\Api\UserApiController;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\PrescriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Token auth: Laravel Sanctum (Bearer token)
| Base URL: /api/...
*/

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Public APIs (no auth)
Route::prefix('public')->group(function () {
    Route::get('/available-slots/{date}', 'App\\Http\\Controllers\\AppointmentController@getAvailableSlots');
    Route::post('/book-appointment', 'App\\Http\\Controllers\\AppointmentController@storePublic');
    Route::get('/doctor-unavailable-ranges', 'App\\Http\\Controllers\\AppointmentController@getDoctorUnavailableRanges');

    // Public site content (Flutter/mobile)
    Route::get('/site-content/home', [SiteContentApiController::class, 'home']);
});

// User APIs
Route::middleware(['auth:sanctum', 'role:user'])->prefix('user')->group(function () {
    Route::get('/appointments', [UserApiController::class, 'appointments']);
    Route::get('/prescriptions', [UserApiController::class, 'prescriptions']);
});

// Doctor APIs
Route::middleware(['auth:sanctum', 'role:doctor'])->prefix('doctor')->group(function () {
    Route::get('/appointments', [DoctorApiController::class, 'appointments']);
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus');

    Route::get('/schedule', [DoctorApiController::class, 'schedule']);
    Route::post('/schedule', [DoctorScheduleController::class, 'update']);

    Route::get('/prescriptions', [DoctorApiController::class, 'prescriptions']);
    Route::get('/prescriptions/{prescription}', [DoctorApiController::class, 'prescriptionShow'])->whereNumber('prescription');
    Route::post('/prescriptions', [PrescriptionController::class, 'store']);
});

// Admin APIs
Route::middleware(['auth:sanctum', 'role:admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminApiController::class, 'users']);
    Route::get('/appointments', [AdminApiController::class, 'appointments']);
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus');

    // Admin site content management (optional)
    Route::put('/site-content/home', [SiteContentApiController::class, 'updateHome']);
    Route::post('/site-content/upload', [SiteContentApiController::class, 'uploadImage']);
});
