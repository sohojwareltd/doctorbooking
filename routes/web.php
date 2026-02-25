<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\DoctorScheduleController;
use App\Http\Controllers\DoctorProfileController;
use App\Http\Controllers\PrescriptionController;
use App\Http\Controllers\Admin\SiteContentController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Medicine;
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

    // Fetch doctor profile for hero section
    $doctor = null;
    if (Schema::hasTable('users')) {
        $doctor = User::where('role', 'doctor')->first();
    }

    return Inertia::render('Welcome', [
        'home' => $homeContent,
        'doctor' => $doctor,
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

// Public booking preview (serial number + estimated time)
Route::get(
    '/booking-preview',
    'App\\Http\\Controllers\\AppointmentController@previewSerial'
)->name('public.book-appointment.preview');

// Simple math captcha for public booking form (JSON only)
Route::get('/booking-captcha', function () {
    $a = random_int(1, 9);
    $b = random_int(1, 9);
    $answer = $a + $b;

    $token = Str::random(32);
    session(['booking_captcha_' . $token => $answer]);

    return response()->json([
        'token' => $token,
        'question' => "What is {$a} + {$b}?",
    ]);
})->name('public.booking.captcha');

// Allow GET /book-appointment to redirect or render the appropriate booking UI
Route::get('/book-appointment', function () {
    $user = Auth::user();

    if ($user?->role === 'admin') {
        return redirect()->route('admin.book-appointment');
    }

    if ($user?->role === 'user') {
        // Logged-in patient: use the multi-step user booking page
        return redirect()->route('user.book-appointment');
    }

    // Guests or other roles: dedicated public booking page (multi-step)
    return Inertia::render('public/BookAppointment');
})->name('public.book-appointment.view');

Route::get('/available-slots/{date}', 'App\\Http\\Controllers\\AppointmentController@getAvailableSlots')->name('available-slots');
Route::get('/doctor-unavailable-ranges', 'App\\Http\\Controllers\\AppointmentController@getDoctorUnavailableRanges')->name('doctor-unavailable-ranges');

// Public list of doctor's active chambers (for multi-step booking UI)
Route::get('/public-chambers', function () {
    $doctor = \App\Models\User::where('role', 'doctor')->first();
    if (!$doctor) {
        return response()->json(['chambers' => []]);
    }

    $chambers = \App\Models\Chamber::where('doctor_id', $doctor->id)
        ->where('is_active', true)
        ->orderBy('name')
        ->get(['id', 'name', 'location', 'phone', 'google_maps_url']);

    return response()->json(['chambers' => $chambers]);
})->name('public.chambers');

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
        
        // Get user's appointments + any guest appointments with same email
        $appointments = Appointment::where(function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->orWhere('email', $user->email);
        })
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('user/Appointments', [
            'appointments' => $appointments->through(fn ($a) => [
                'id' => $a->id,
                'is_guest' => $a->is_guest,
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
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('user/Prescriptions', [
            'prescriptions' => $prescriptions->through(fn ($p) => [
                'id' => $p->id,
                'diagnosis' => $p->diagnosis,
                'medications' => $p->medications,
                'instructions' => $p->instructions,
                'tests' => $p->tests,
                'next_visit_date' => $p->next_visit_date,
                'created_at' => $p->created_at,
            ]),
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
        
        // Today's appointments count
        $todayAppointments = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)->count();
        
        // Scheduled appointments count (new status)
        $scheduled = Appointment::where('doctor_id', $doctor->id)
            ->where('status', 'scheduled')
            ->whereDate('appointment_date', '>=', $today)
            ->count();
        
        // Get total unique patients
        $totalPatients = Appointment::where('doctor_id', $doctor->id)
            ->distinct('user_id')
            ->count('user_id');
        
        // Total prescriptions issued
        $totalPrescriptions = Prescription::where('doctor_id', $doctor->id)->count();
        
        // Prescribed appointments this month
        $prescribedThisMonth = Appointment::where('doctor_id', $doctor->id)
            ->where('status', 'prescribed')
            ->whereMonth('appointment_date', now()->month)
            ->count();
        
        // Get scheduled patients for today (ordered by name)
        $scheduledToday = Appointment::with(['user:id,name,email,phone,address'])
            ->where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $today)
            ->where('status', 'scheduled')
            ->join('users', 'appointments.user_id', '=', 'users.id')
            ->orderBy('users.name')
            ->orderBy('appointment_time')
            ->select('appointments.*')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'user' => $a->user ? [
                    'id' => $a->user->id,
                    'name' => $a->user->name,
                    'email' => $a->user->email,
                    'phone' => $a->user->phone,
                    'address' => $a->user->address,
                ] : null,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
            ]);
        
        // Get recent appointments (last 7 days)
        $recentAppointments = Appointment::with(['user:id,name,email,phone,address'])
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', '>=', now()->subDays(7))
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->limit(5)
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'user' => $a->user ? [
                    'id' => $a->user->id,
                    'name' => $a->user->name,
                    'email' => $a->user->email,
                    'phone' => $a->user->phone,
                    'address' => $a->user->address,
                ] : null,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'type' => $a->type,
                'is_video' => $a->is_video ?? false,
            ]);
        
        // Get next upcoming appointment
        $upcomingAppointment = Appointment::with(['user:id,name,email,phone,address'])
            ->where('doctor_id', $doctor->id)
            ->where('appointment_date', '>=', $today)
            ->where('status', '!=', 'cancelled')
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->first();
        
        $upcoming = $upcomingAppointment ? [
            'id' => $upcomingAppointment->id,
            'user_id' => $upcomingAppointment->user_id,
            'user' => $upcomingAppointment->user ? [
                'id' => $upcomingAppointment->user->id,
                'name' => $upcomingAppointment->user->name,
                'email' => $upcomingAppointment->user->email,
                'phone' => $upcomingAppointment->user->phone,
                'address' => $upcomingAppointment->user->address,
            ] : null,
            'appointment_date' => $upcomingAppointment->appointment_date?->toDateString(),
            'appointment_time' => substr((string) $upcomingAppointment->appointment_time, 0, 5),
            'status' => $upcomingAppointment->status,
            'type' => $upcomingAppointment->type,
            'is_video' => $upcomingAppointment->is_video ?? false,
        ] : null;

        return Inertia::render('doctor/Dashboard', [
            'stats' => [
                'todayAppointments' => $todayAppointments,
                'scheduled' => $scheduled,
                'totalPatients' => $totalPatients,
                'totalPrescriptions' => $totalPrescriptions,
                'prescribedThisMonth' => $prescribedThisMonth,
            ],
            'scheduledToday' => $scheduledToday,
            'recentAppointments' => $recentAppointments,
            'upcomingAppointment' => $upcoming,
        ]);
    })->name('dashboard');

    Route::get('/appointments', function (Request $request) {
        $doctor = Auth::user();
        $today = now()->toDateString();
        
        // Get filter parameters
        $dateFilter = $request->get('date_filter', 'today'); // today, week, month, all
        $statusFilter = $request->get('status_filter', 'all');
        $search = $request->get('search', '');
        
        $query = Appointment::with(['user:id,name,email,phone,address', 'prescription:id,appointment_id'])
            ->where('doctor_id', $doctor->id);
        
        // Apply date filter
        if ($dateFilter === 'today') {
            $query->whereDate('appointment_date', $today);
        } elseif ($dateFilter === 'week') {
            $query->where('appointment_date', '>=', now()->startOfWeek()->toDateString());
        } elseif ($dateFilter === 'month') {
            $query->whereMonth('appointment_date', now()->month)
                  ->whereYear('appointment_date', now()->year);
        }
        
        // Apply status filter
        if ($statusFilter !== 'all') {
            $query->where('status', $statusFilter);
        }
        
        // Apply search - support both registered users and (optionally) guest appointments
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%");
                });

                // Only search guest name column if it exists (on databases where guest fields were migrated)
                if (\Illuminate\Support\Facades\Schema::hasColumn('appointments', 'name')) {
                    $q->orWhere('name', 'like', "%{$search}%");
                }
            });
        }
        
        // Order by patient name (when available) then by date and time
        $appointmentsQuery = $query->leftJoin('users', 'appointments.user_id', '=', 'users.id');

        if (\Illuminate\Support\Facades\Schema::hasColumn('appointments', 'name')) {
            // Databases with guest name column: prefer user name, then guest name
            $appointmentsQuery->orderByRaw('COALESCE(users.name, appointments.name)');
        } else {
            // Older databases: order by user name only
            $appointmentsQuery->orderBy('users.name');
        }

        $appointments = $appointmentsQuery
            ->orderByDesc('appointment_date')
            ->orderBy('appointment_time')
            ->select('appointments.*')
            ->paginate(15)
            ->withQueryString();
        
        // Get statistics
        $totalAppointments = Appointment::where('doctor_id', $doctor->id)->count();
        $scheduledAppointments = Appointment::where('doctor_id', $doctor->id)->where('status', 'scheduled')->count();
        $arrivedAppointments = Appointment::where('doctor_id', $doctor->id)->where('status', 'arrived')->count();
        $prescribedAppointments = Appointment::where('doctor_id', $doctor->id)->where('status', 'prescribed')->count();

        return Inertia::render('doctor/Appointments', [
            'appointments' => $appointments->through(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'is_guest' => $a->is_guest,
                // Show user info if registered, otherwise show guest info
                'patient_name' => $a->user?->name ?? $a->name,
                'patient_phone' => $a->user?->phone ?? $a->phone,
                'patient_email' => $a->user?->email ?? $a->email,
                'patient_age' => $a->age,
                'patient_gender' => $a->gender,
                'user' => $a->user ? [
                    'id' => $a->user->id,
                    'name' => $a->user->name,
                    'email' => $a->user->email,
                    'phone' => $a->user->phone,
                    'address' => $a->user->address,
                ] : null,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
                'has_prescription' => $a->prescription !== null,
                'prescription_id' => $a->prescription?->id,
            ]),
            'filters' => [
                'date_filter' => $dateFilter,
                'status_filter' => $statusFilter,
                'search' => $search,
            ],
            'stats' => [
                'total' => $totalAppointments,
                'scheduled' => $scheduledAppointments,
                'arrived' => $arrivedAppointments,
                'prescribed' => $prescribedAppointments,
            ],
        ]);
    })->name('appointments');
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus')->name('appointments.status');
    
    Route::post('/appointments/create', function (Request $request) {
        $doctor = Auth::user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'age' => 'required|integer|min:1|max:150',
            'gender' => 'required|in:male,female,other',
        ]);
        
        // Calculate date_of_birth from age
        $dateOfBirth = now()->subYears($validated['age'])->toDateString();
        
        // Find or create user with the phone number
        $user = User::where('phone', $validated['phone'])->first();
        
        if (!$user) {
            // Create new user/patient
            $user = User::create([
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'email' => 'patient_' . time() . '@temp.com', // Temporary email
                'password' => Hash::make(Str::random(16)), // Random password
                'role' => 'user',
                'age' => $validated['age'],
                'gender' => $validated['gender'],
                'date_of_birth' => $dateOfBirth,
            ]);
        } else {
            // Update existing user information
            $user->update([
                'name' => $validated['name'],
                'age' => $validated['age'],
                'gender' => $validated['gender'],
                'date_of_birth' => $dateOfBirth,
            ]);
        }
        
        // Create appointment with current date and time
        $appointment = Appointment::create([
            'user_id' => $user->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => now()->format('H:i:s'),
            'status' => 'scheduled',
        ]);
        
        return response()->json([
            'message' => 'Appointment created successfully',
            'appointment' => $appointment,
        ], 201);
    })->name('appointments.create');

    Route::get('/patients', function () {
        $doctor = Auth::user();
        
        // Limit patients to those who have had appointments with this doctor
        $patientQuery = User::where('role', 'user')
            ->whereHas('appointments', function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->id);
            });

        $allPatients = (clone $patientQuery)->get();
        $hasPhone = $allPatients->filter(fn($p) => $p->phone)->count();
        $emailOnly = $allPatients->filter(fn($p) => $p->email && !$p->phone)->count();
        $noContact = $allPatients->filter(fn($p) => !$p->email && !$p->phone)->count();
        
        // Get patients with prescription details (paginated)
        $patients = (clone $patientQuery)
            ->with(['prescriptions' => function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->id)
                    ->select('id', 'user_id', 'diagnosis', 'created_at')
                    ->orderByDesc('created_at');
            }])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('doctor/Patients', [
            'patients' => $patients->through(function ($patient) {
                $prescriptions = $patient->prescriptions->map(function ($p) {
                    return [
                        'id' => $p->id,
                        'diagnosis' => $p->diagnosis,
                        'created_at' => $p->created_at,
                    ];
                });
                
                return [
                    'id' => $patient->id,
                    'name' => $patient->name,
                    'email' => $patient->email,
                    'phone' => $patient->phone,
                    'created_at' => $patient->created_at,
                    'has_prescription' => $prescriptions->isNotEmpty(),
                    'prescriptions_count' => $prescriptions->count(),
                    'prescriptions' => $prescriptions->toArray(),
                ];
            }),
            'stats' => [
                'hasPhone' => $hasPhone,
                'emailOnly' => $emailOnly,
                'noContact' => $noContact,
            ]
        ]);
    })->name('patients');

    Route::get('/patients/{patient}', function (User $patient) {
        $doctor = Auth::user();
        
        // Verify the patient has had an appointment with this doctor
        $hasAppointment = $patient->appointments()
            ->where('doctor_id', $doctor->id)
            ->exists();
        
        if (!$hasAppointment) {
            abort(403, 'Unauthorized access to patient');
        }

        // Get patient details with appointments and prescriptions
        $patientData = $patient->load([
            'appointments' => function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->id)
                    ->orderByDesc('created_at');
            },
            'prescriptions' => function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->id)
                    ->orderByDesc('created_at');
            }
        ]);

        return Inertia::render('doctor/PatientShow', [
            'patient' => [
                'id' => $patientData->id,
                'name' => $patientData->name,
                'email' => $patientData->email,
                'phone' => $patientData->phone,
                'address' => $patientData->address,
                'gender' => $patientData->gender,
                'age' => $patientData->age,
                'date_of_birth' => $patientData->date_of_birth,
                'weight' => $patientData->weight,
                'created_at' => $patientData->created_at,
            ],
            'appointments' => $patientData->appointments->map(function ($a) {
                return [
                    'id' => $a->id,
                    'appointment_date' => $a->appointment_date ? $a->appointment_date->toDateString() : null,
                    'appointment_time' => $a->appointment_time,
                    'status' => $a->status,
                    'symptoms' => $a->symptoms,
                    'notes' => $a->notes,
                    'created_at' => $a->created_at,
                ];
            }),
            'prescriptions' => $patientData->prescriptions->map(function ($p) {
                return [
                    'id' => $p->id,
                    'diagnosis' => $p->diagnosis,
                    'medications' => $p->medications,
                    'instructions' => $p->instructions,
                    'tests' => $p->tests,
                    'next_visit_date' => $p->next_visit_date,
                    'created_at' => $p->created_at,
                ];
            }),
        ]);
    })->whereNumber('patient')->name('patients.show');

    Route::get('/prescriptions', function () {
        $doctor = Auth::user();
        
        // Get paginated prescriptions with patient details
        $prescriptions = Prescription::with([
                'user:id,name,phone,age,gender,date_of_birth',
                'appointment:id,age,gender,phone',
            ])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('id')
            ->paginate(10)
            ->through(function ($p) {
                $calculatedAge = null;

                if (!is_null($p->user?->age)) {
                    $calculatedAge = $p->user->age;
                } elseif (!empty($p->user?->date_of_birth)) {
                    try {
                        $calculatedAge = \Carbon\Carbon::parse($p->user->date_of_birth)->age;
                    } catch (\Throwable $e) {
                        $calculatedAge = null;
                    }
                }

                return [
                    'id' => $p->id,
                    'user_id' => $p->user_id,
                    'user' => $p->user ? [
                        'id' => $p->user->id,
                        'name' => $p->user->name,
                        'phone' => $p->user->phone,
                        'age' => $calculatedAge,
                        'gender' => $p->user->gender,
                        'date_of_birth' => $p->user->date_of_birth?->toDateString(),
                    ] : null,
                    'patient_age' => $calculatedAge ?? $p->appointment?->age,
                    'patient_gender' => $p->user?->gender ?? $p->appointment?->gender,
                    'patient_contact' => $p->user?->phone ?? $p->appointment?->phone,
                    'diagnosis' => $p->diagnosis,
                    'medications' => $p->medications,
                    'instructions' => $p->instructions,
                    'tests' => $p->tests,
                    'next_visit_date' => $p->next_visit_date?->toDateString(),
                    'created_at' => $p->created_at,
                ];
            })
            ->withQueryString();
        
        // Get statistics from all prescriptions (not just current page)
        $allPrescriptions = Prescription::where('doctor_id', $doctor->id)->get();
        $withFollowUp = $allPrescriptions->filter(fn($p) => $p->next_visit_date)->count();
        $withoutFollowUp = $allPrescriptions->filter(fn($p) => !$p->next_visit_date)->count();
        $upcomingFollowUps = $allPrescriptions->filter(function($p) {
            if (!$p->next_visit_date) return false;
            return \Carbon\Carbon::parse($p->next_visit_date)->gte(now()->startOfDay());
        })->count();
        
        return Inertia::render('doctor/Prescriptions', [
            'prescriptions' => $prescriptions,
            'stats' => [
                'withFollowUp' => $withFollowUp,
                'withoutFollowUp' => $withoutFollowUp,
                'upcomingFollowUps' => $upcomingFollowUps,
            ]
        ]);
    })->name('prescriptions');

    Route::get('/prescriptions/{prescription}', function (Prescription $prescription) {
        $doctor = Auth::user();

        $prescription = Prescription::with([
            'user:id,name,email,phone,address,age,gender,weight,date_of_birth',
            'appointment:id,appointment_date,appointment_time,status',
        ])
            ->where('doctor_id', $doctor->id)
            ->where('id', $prescription->id)
            ->firstOrFail();

        // Get site content for contact info
        $homeContent = SiteContent::where('key', 'home')->first()?->value;
        $contactInfo = $homeContent['contact'] ?? null;

        return Inertia::render('doctor/PrescriptionShow', [
            'prescription' => [
                'id' => $prescription->id,
                'appointment_id' => $prescription->appointment_id,
                'created_at' => $prescription->created_at?->toDateTimeString(),
                'diagnosis' => $prescription->diagnosis,
                'medications' => $prescription->medications,
                'instructions' => $prescription->instructions,
                'tests' => $prescription->tests,
                'next_visit_date' => $prescription->next_visit_date?->toDateString(),
                'visit_type' => $prescription->visit_type,
                'patient_contact' => $prescription->user?->phone,
                'patient_age' => $prescription->user?->age,
                'patient_age_unit' => 'years',
                'patient_gender' => $prescription->user?->gender,
                'patient_weight' => $prescription->user?->weight,
                'user' => $prescription->user ? [
                    'id' => $prescription->user->id,
                    'name' => $prescription->user->name,
                    'email' => $prescription->user->email,
                    'phone' => $prescription->user->phone,
                    'address' => $prescription->user->address,
                    'age' => $prescription->user->age,
                    'gender' => $prescription->user->gender,
                    'weight' => $prescription->user->weight,
                    'date_of_birth' => $prescription->user->date_of_birth?->toDateString(),
                ] : null,
                'appointment' => $prescription->appointment ? [
                    'appointment_date' => (string) $prescription->appointment->appointment_date,
                    'appointment_time' => substr((string) $prescription->appointment->appointment_time, 0, 5),
                    'status' => $prescription->appointment->status,
                ] : null,
            ],
            'contactInfo' => $contactInfo,
        ]);
    })->whereNumber('prescription')->name('prescriptions.show');

    Route::put('/prescriptions/{prescription}', [PrescriptionController::class, 'update'])
        ->whereNumber('prescription')
        ->name('prescriptions.update');

    Route::get('/schedule', [DoctorScheduleController::class, 'show'])->name('schedule');
    Route::post('/schedule', [DoctorScheduleController::class, 'update'])->name('schedule.update');
    Route::get('/profile', [DoctorProfileController::class, 'show'])->name('profile');
    Route::put('/profile', [DoctorProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/photo', [DoctorProfileController::class, 'uploadPhoto'])->name('profile.photo.upload');
    Route::delete('/profile/photo', [DoctorProfileController::class, 'deletePhoto'])->name('profile.photo.delete');
    Route::get('/prescriptions/create', function () {
        $doctor = Auth::user();

        // Get site content for contact info
        $homeContent = SiteContent::where('key', 'home')->first()?->value;
        $contactInfo = $homeContent['contact'] ?? null;

        // Get appointment ID from query if provided
        $appointmentId = request()->query('appointment_id');
        $selectedPatient = null;

        if ($appointmentId) {
            $appointment = Appointment::with('user:id,name,phone,email,gender,age,date_of_birth,weight')
                ->where('doctor_id', $doctor->id)
                ->where('id', $appointmentId)
                ->first();
            
            if ($appointment && $appointment->user) {
                $user = $appointment->user;
                $selectedPatient = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'phone' => $user->phone,
                    'email' => $user->email,
                    'gender' => $user->gender,
                    'age' => $user->age,
                    'weight' => $user->weight,
                ];
            }
        }

        // Load medicines list for search/suggestions
        $medicines = Medicine::orderBy('name')
            ->get(['id', 'name', 'strength']);

        return Inertia::render('doctor/CreatePrescription', [
            'appointmentId' => $appointmentId ? (int) $appointmentId : null,
            'selectedPatient' => $selectedPatient,
            'contactInfo' => $contactInfo,
            'medicines' => $medicines,
        ]);
    })->name('prescriptions.create');

    Route::post('/prescriptions', [PrescriptionController::class, 'store'])->name('prescriptions.store');

    // Doctor Chambers management (add/edit simple chambers for public booking)
    Route::get('/chambers', function () {
        $doctor = Auth::user();

        $chambers = \App\Models\Chamber::where('doctor_id', $doctor->id)
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'location' => $c->location,
                'phone' => $c->phone,
                'google_maps_url' => $c->google_maps_url,
                'is_active' => (bool) $c->is_active,
            ]);

        return Inertia::render('doctor/Chambers', [
            'chambers' => $chambers,
        ]);
    })->name('chambers');

    Route::post('/chambers', function (Request $request) {
        $doctor = Auth::user();

        $validated = $request->validate([
            'id' => ['nullable', 'integer'],
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $data = [
            'doctor_id' => $doctor->id,
            'name' => $validated['name'],
            'location' => $validated['location'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'google_maps_url' => $validated['google_maps_url'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['id'])) {
            $chamber = \App\Models\Chamber::where('doctor_id', $doctor->id)
                ->where('id', $validated['id'])
                ->firstOrFail();
            $chamber->update($data);
        } else {
            \App\Models\Chamber::create($data);
        }

        return redirect()->back()->with('success', 'Chamber saved successfully.');
    })->name('chambers.save');
});

/*
|--------------------------------------------------------------------------
| Admin Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/dashboard', function () {
        $users = User::count();
        $patients = User::where('role', 'user')->count();
        $doctors = User::where('role', 'doctor')->count();
        $appointmentsToday = Appointment::whereDate('appointment_date', now()->toDateString())->count();
        $pending = Appointment::where('status','pending')->count();
        $totalAppointments = Appointment::count();
        $totalPrescriptions = Prescription::count();

        return Inertia::render('admin/Dashboard', [
            'stats' => [
                'users' => $users,
                'patients' => $patients,
                'doctors' => $doctors,
                'appointmentsToday' => $appointmentsToday,
                'pendingAppointments' => $pending,
                'totalAppointments' => $totalAppointments,
                'totalPrescriptions' => $totalPrescriptions,
            ],
        ]);
    })->name('dashboard');

    Route::get('/users', function () {
        $users = User::withCount(['prescriptions'])
            ->with(['prescriptions:id,user_id,created_at'])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Users', [
            'users' => $users->through(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'role' => $user->role,
                    'created_at' => $user->created_at,
                    'has_prescription' => $user->prescriptions_count > 0,
                    'prescriptions_count' => $user->prescriptions_count,
                    'prescriptions' => $user->prescriptions->map(fn($p) => [
                        'id' => $p->id,
                        'created_at' => $p->created_at,
                    ]),
                ];
            }),
        ]);
    })->name('users');

    Route::get('/appointments', function () {
        $appointments = Appointment::with(['user:id,name','doctor:id,name'])
            ->orderByDesc('id')
            ->paginate(10)
            ->withQueryString();

        $stats = [
            'total' => Appointment::count(),
            'pending' => Appointment::where('status','pending')->count(),
            'approved' => Appointment::where('status','approved')->count(),
            'completed' => Appointment::where('status','completed')->count(),
            'cancelled' => Appointment::where('status','cancelled')->count(),
        ];

        return Inertia::render('admin/Appointments', [
            'appointments' => $appointments->through(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'doctor_id' => $a->doctor_id,
                'is_guest' => $a->is_guest,
                // Show user info if registered, otherwise show guest info
                'patient_name' => $a->user?->name ?? $a->name,
                'patient_phone' => $a->user?->phone ?? $a->phone,
                'patient_email' => $a->user?->email ?? $a->email,
                'patient_age' => $a->age,
                'patient_gender' => $a->gender,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                'doctor' => $a->doctor ? ['id' => $a->doctor->id, 'name' => $a->doctor->name] : null,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
            ]),
            'stats' => $stats,
        ]);
    })->name('appointments');

    Route::get('/book-appointment', fn () => Inertia::render('admin/BookAppointment'))
        ->name('book-appointment');
    Route::post('/appointments/{appointment}/status', 'App\\Http\\Controllers\\AppointmentController@updateStatus')->name('appointments.status');

    Route::get('/doctor', fn () => Inertia::render('admin/Doctor'))->name('doctor');
    
    Route::get('/reports', function () {
        $stats = [
            'total_users' => User::count(),
            'total_appointments' => Appointment::count(),
            'total_prescriptions' => Prescription::count(),
            'pending_appointments' => Appointment::where('status', 'pending')->count(),
            'approved_appointments' => Appointment::where('status', 'approved')->count(),
            'completed_appointments' => Appointment::where('status', 'completed')->count(),
            'cancelled_appointments' => Appointment::where('status', 'cancelled')->count(),
            'total_patients' => User::where('role', 'user')->count(),
            'total_doctors' => User::where('role', 'doctor')->count(),
        ];
        
        $recent_appointments = Appointment::with(['user:id,name', 'doctor:id,name'])
            ->latest()
            ->take(10)
            ->get();
            
        return Inertia::render('admin/Reports', [
            'stats' => $stats,
            'recent_appointments' => $recent_appointments,
        ]);
    })->name('reports');
    
    Route::get('/prescriptions', function () {
        $prescriptions = Prescription::with(['user:id,name,email', 'doctor:id,name'])
            ->latest()
            ->paginate(10)
            ->withQueryString();
        return Inertia::render('admin/Prescriptions', [
            'prescriptions' => $prescriptions,
        ]);
    })->name('prescriptions');
    
    Route::get('/prescriptions/{prescription}', function (Prescription $prescription) {
        $prescription->load([
            'user:id,name,email,phone',
            'doctor:id,name,email,specialization'
        ]);

        $contactInfo = SiteContent::where('key', 'contact')->first();

        return Inertia::render('admin/PrescriptionShow', [
            'prescription' => $prescription,
            'contactInfo' => $contactInfo,
        ]);
    })->whereNumber('prescription')->name('prescriptions.show');
    
    Route::get('/settings', [SiteContentController::class, 'edit'])->name('settings');
    Route::put('/settings/site-content/home', [SiteContentController::class, 'updateHome'])->name('settings.site-content.home');
    Route::post('/settings/site-content/upload', [SiteContentController::class, 'uploadImage'])->name('settings.site-content.upload');
});

require __DIR__.'/settings.php';
