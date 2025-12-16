<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::get('/about', function () {
    return Inertia::render('public/About');
})->name('about');

Route::get('/contact', function () {
    return Inertia::render('public/Contact');
})->name('contact');

Route::post('/contact', function () {
    // Handle contact form submission
    return redirect()->back();
})->name('contact.submit');

/*
|--------------------------------------------------------------------------
| User Routes (Patient)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:user'])->prefix('user')->name('user.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    Route::get('/appointments', function () {
        return Inertia::render('user/Appointments');
    })->name('appointments');

    Route::get('/book-appointment', function () {
        return Inertia::render('user/BookAppointment');
    })->name('book-appointment');

    Route::get('/prescriptions', function () {
        return Inertia::render('user/Prescriptions');
    })->name('prescriptions');

    Route::get('/profile', function () {
        return Inertia::render('user/Profile');
    })->name('profile');
});

/*
|--------------------------------------------------------------------------
| Doctor Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:doctor'])->prefix('doctor')->name('doctor.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('doctor/Dashboard');
    })->name('dashboard');

    Route::get('/appointments', function () {
        return Inertia::render('doctor/Appointments');
    })->name('appointments');

    Route::get('/patients', function () {
        return Inertia::render('doctor/Patients');
    })->name('patients');

    Route::get('/prescriptions', function () {
        return Inertia::render('doctor/Prescriptions');
    })->name('prescriptions');

    Route::get('/schedule', function () {
        return Inertia::render('doctor/Schedule');
    })->name('schedule');

    Route::get('/profile', function () {
        return Inertia::render('doctor/Profile');
    })->name('profile');

    Route::get('/prescriptions/create', function () {
        return Inertia::render('doctor/CreatePrescription');
    })->name('prescriptions.create');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('admin/Dashboard');
    })->name('dashboard');

    Route::get('/users', function () {
        return Inertia::render('admin/Users');
    })->name('users');

    Route::get('/appointments', function () {
        return Inertia::render('admin/Appointments');
    })->name('appointments');

    Route::get('/doctor', function () {
        return Inertia::render('admin/Doctor');
    })->name('doctor');

    Route::get('/reports', function () {
        return Inertia::render('admin/Reports');
    })->name('reports');

    Route::get('/settings', function () {
        return Inertia::render('admin/Settings');
    })->name('settings');
});

require __DIR__.'/settings.php';
