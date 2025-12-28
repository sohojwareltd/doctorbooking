<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\Admin\SiteContentController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Schema;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\SiteContent;
use App\Models\User;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    $homeContent = null;

    if (Schema::hasTable('site_contents')) {
        $homeContent = SiteContent::where('key', 'home')->first()?->value;
    }

    $homeContent = SiteContent::normalizeValue($homeContent);

    return Inertia::render('Welcome', [
        'home' => $homeContent,
    ]);
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

// Public booking endpoint
Route::post('/book-appointment', 'App\\Http\\Controllers\\AppointmentController@storePublic')->name('public.book-appointment');
Route::get('/available-slots/{date}', 'App\\Http\\Controllers\\AppointmentController@getAvailableSlots')->name('available-slots');
Route::get('/doctor-unavailable-ranges', [AppointmentController::class, 'getDoctorUnavailableRanges'])->name('doctor-unavailable-ranges');

/*
|--------------------------------------------------------------------------
| Dashboard (Fortify default)
|--------------------------------------------------------------------------
|
| Fortify's default auth scaffolding expects a named "dashboard" route.
| We keep it as a small role-based redirect.
|
*/

Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    $user = Auth::user();

    if ($user && $user->role === 'admin') {
        return redirect()->route('admin.dashboard');
    }

    if ($user && $user->role === 'doctor') {
        return redirect()->route('doctor.dashboard');
    }

    if ($user && $user->role === 'user') {
        return redirect()->route('user.dashboard');
    }

    return Inertia::render('Dashboard');
})->name('dashboard');

/*
|--------------------------------------------------------------------------
| User Routes (Patient)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:user'])->prefix('user')->name('user.')->group(function () {
    Route::get('/dashboard', function () {
        $user = Auth::user();
        $upcomingCount = Appointment::where('user_id', $user->id)
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->count();
        $prescriptionsCount = Prescription::where('user_id', $user->id)->count();

        return Inertia::render('Dashboard', [
            'stats' => [
                'upcomingAppointments' => $upcomingCount,
                'prescriptions' => $prescriptionsCount,
            ],
        ]);
    })->name('dashboard');

    Route::get('/appointments', function () {
        $user = Auth::user();
        $appointments = Appointment::where('user_id', $user->id)
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id','appointment_date','appointment_time','status','symptoms']);

        return Inertia::render('user/Appointments', [
            'appointments' => $appointments->map(fn ($a) => [
                'id' => $a->id,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
            ]),
        ]);
    })->name('appointments');

    Route::get('/book-appointment', function () {
        return Inertia::render('user/BookAppointment');
    })->name('book-appointment');

    Route::get('/prescriptions', function () {
        $user = Auth::user();
        $prescriptions = Prescription::where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->get(['id','diagnosis','medications','instructions','tests','next_visit_date','created_at']);

        return Inertia::render('user/Prescriptions', [
            'prescriptions' => $prescriptions,
        ]);
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
        $doctor = Auth::user();
        $today = now()->toDateString();
        $todayAppointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)->count();
        $pending = Appointment::where('doctor_id', $doctor->id)->where('status','pending')->count();

        return Inertia::render('doctor/Dashboard', [
            'stats' => [
                'todayAppointments' => $todayAppointments,
                'pending' => $pending,
            ],
        ]);
    })->name('dashboard');

    Route::get('/appointments', function () {
        $doctor = Auth::user();
        $appointments = Appointment::with(['user:id,name', 'prescription:id,appointment_id'])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id','user_id','appointment_date','appointment_time','status','symptoms']);

        return Inertia::render('doctor/Appointments', [
            'appointments' => $appointments->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
                'has_prescription' => $a->prescription !== null,
            ]),
        ]);
    })->name('appointments');
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus')->name('appointments.status');

    Route::get('/patients', function () {
        $doctor = Auth::user();
        $patientIds = Appointment::where('doctor_id', $doctor->id)
            ->distinct()->pluck('user_id');
        $patients = User::whereIn('id', $patientIds)->get(['id','name','email','phone']);
        return Inertia::render('doctor/Patients', [ 'patients' => $patients ]);
    })->name('patients');

    Route::get('/prescriptions', function () {
        $doctor = Auth::user();
        $prescriptions = Prescription::with('user:id,name')
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('created_at')
            ->get(['id','user_id','diagnosis','medications','next_visit_date','created_at']);
        return Inertia::render('doctor/Prescriptions', [ 'prescriptions' => $prescriptions ]);
    })->name('prescriptions');

    Route::get('/schedule', [DoctorScheduleController::class, 'show'])->name('schedule');
    Route::post('/schedule', [DoctorScheduleController::class, 'update'])->name('schedule.update');
    Route::get('/profile', fn () => Inertia::render('doctor/Profile'))->name('profile');
    Route::get('/prescriptions/create', function () {
        $doctor = Auth::user();

        $appointments = Appointment::with('user:id,name')
            ->where('doctor_id', $doctor->id)
            ->whereIn('status', ['approved', 'completed'])
            ->whereDoesntHave('prescription')
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id', 'user_id', 'appointment_date', 'appointment_time', 'status']);

        return Inertia::render('doctor/CreatePrescription', [
            'appointments' => $appointments->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                'appointment_date' => (string) $a->appointment_date,
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
            ]),
        ]);
    })->name('prescriptions.create');

    Route::post('/prescriptions', [PrescriptionController::class, 'store'])->name('prescriptions.store');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        $users = User::count();
        $appointmentsToday = Appointment::whereDate('appointment_date', now()->toDateString())->count();
        $pending = Appointment::where('status','pending')->count();

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users' => $users,
                'appointmentsToday' => $appointmentsToday,
                'pendingAppointments' => $pending,
            ],
        ]);
    })->name('dashboard');

    Route::get('/users', function () {
        $users = User::orderByDesc('created_at')->get(['id','name','email','role','created_at']);
        return Inertia::render('admin/Users', ['users' => $users]);
    })->name('users');

    Route::get('/appointments', function () {
        $appointments = Appointment::with(['user:id,name','doctor:id,name'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id','user_id','doctor_id','appointment_date','appointment_time','status']);
        return Inertia::render('admin/Appointments', ['appointments' => $appointments]);
    })->name('appointments');
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus')->name('appointments.status');

    Route::get('/doctor', fn () => Inertia::render('admin/Doctor'))->name('doctor');
    Route::get('/reports', fn () => Inertia::render('admin/Reports'))->name('reports');
    Route::get('/settings', [SiteContentController::class, 'edit'])->name('settings');
    Route::put('/settings/site-content/home', [SiteContentController::class, 'updateHome'])->name('settings.site-content.home');
    Route::post('/settings/site-content/upload', [SiteContentController::class, 'uploadImage'])->name('settings.site-content.upload');
});

require __DIR__.'/settings.php';
