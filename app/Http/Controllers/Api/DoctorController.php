<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Doctor-facing API endpoints.
 * Role: doctor
 */
class DoctorController extends Controller
{
    // ── Dashboard stats ──────────────────────────────────────────────────────

    /** GET /api/doctor/stats */
    public function stats(Request $request): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();
        $today    = now()->toDateString();

        $scope = fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId) : $q;

        return response()->json([
            'today_appointments'   => $scope(Appointment::query())->whereDate('appointment_date', $today)->count(),
            'scheduled'            => $scope(Appointment::query())->where('status', 'scheduled')->whereDate('appointment_date', '>=', $today)->count(),
            'waiting_patients'     => $scope(Appointment::query())->whereDate('appointment_date', $today)->whereIn('status', ['scheduled', 'arrived'])->count(),
            'total_patients'       => $scope(Appointment::query())->distinct('user_id')->count('user_id'),
            'total_prescriptions'  => $doctorId ? Prescription::where('doctor_id', $doctorId)->count() : Prescription::count(),
            'prescribed_this_month'=> $scope(Appointment::query())->where('status', 'prescribed')->whereMonth('appointment_date', now()->month)->count(),
            'in_consultation'      => $scope(Appointment::query())->where('status', 'in_consultation')->whereDate('appointment_date', $today)->count(),
        ]);
    }

    // ── Appointments ─────────────────────────────────────────────────────────

    /** GET /api/doctor/appointments */
    public function appointments(Request $request): JsonResponse
    {
        $doctor     = $request->user();
        $doctorId   = $doctor->doctorId();
        $today      = now()->toDateString();
        $dateFilter = $request->get('date_filter', 'all');
        $dateFrom   = $request->get('date_from');
        $dateTo     = $request->get('date_to');
        $status     = $request->get('status_filter', 'all');
        $search     = $request->get('search', '');
        $gender     = $request->get('gender', 'all');
        $ageMin     = $request->integer('age_min');
        $ageMax     = $request->integer('age_max');
        $chamberId  = $request->get('chamber_id');

        $query = Appointment::with(['user:id,name,email,phone', 'prescription:id,appointment_id', 'chamber:id,name']);
        if ($doctorId) {
            $query->where('doctor_id', $doctorId);
        }

        if ($dateFilter === 'today') {
            $query->whereDate('appointment_date', $today);
        } elseif ($dateFilter === 'week') {
            $query->where('appointment_date', '>=', now()->startOfWeek()->toDateString());
        } elseif ($dateFilter === 'month') {
            $query->whereMonth('appointment_date', now()->month)
                  ->whereYear('appointment_date', now()->year);
        } elseif ($dateFrom || $dateTo) {
            if ($dateFrom) {
                $query->whereDate('appointment_date', '>=', $dateFrom);
            }
            if ($dateTo) {
                $query->whereDate('appointment_date', '<=', $dateTo);
            }
        }

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($gender !== 'all') {
            $query->where('gender', $gender);
        }

        if ($ageMin) {
            $query->where('age', '>=', $ageMin);
        }

        if ($ageMax) {
            $query->where('age', '<=', $ageMax);
        }

        if ($chamberId && $chamberId !== 'all') {
            $query->where('chamber_id', $chamberId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"))
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $appointments = $query
            ->orderByRaw("CASE
                WHEN appointment_date >= ? THEN 0
                ELSE 1
            END", [$today])
            ->orderBy('appointment_date')
            ->orderByRaw("CASE status
                WHEN 'in_consultation' THEN 0
                WHEN 'arrived' THEN 1
                WHEN 'scheduled' THEN 2
                WHEN 'test_registered' THEN 3
                WHEN 'awaiting_tests' THEN 4
                WHEN 'prescribed' THEN 5
                WHEN 'cancelled' THEN 6
                ELSE 7
            END")
            ->orderByRaw('CASE WHEN appointment_time IS NULL THEN 1 ELSE 0 END')
            ->orderBy('appointment_time')
            ->orderBy('serial_no')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json([
            'appointments' => AppointmentResource::collection($appointments),
            'meta'         => [
                'current_page' => $appointments->currentPage(),
                'last_page'    => $appointments->lastPage(),
                'total'        => $appointments->total(),
            ],
        ]);
    }

    /** GET /api/doctor/appointments/{appointment} */
    public function appointmentShow(Request $request, Appointment $appointment): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();
        if ($doctorId) {
            abort_unless($appointment->doctor_id === $doctorId, 403);
        }

        $appointment->load(['user', 'prescription', 'chamber']);

        return response()->json(['appointment' => new AppointmentResource($appointment)]);
    }

    /** PUT /api/doctor/appointments/{appointment}/status */
    public function updateAppointmentStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();
        if ($doctorId) {
            abort_unless($appointment->doctor_id === $doctorId, 403);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in([
                'scheduled', 'arrived', 'in_consultation',
                'test_registered', 'awaiting_tests', 'prescribed', 'cancelled',
            ])],
        ]);

        // Only one patient can be in_consultation at a time
        if ($validated['status'] === 'in_consultation') {
            $inConsultationQuery = Appointment::with('prescription')
                ->where('status', 'in_consultation')
                ->where('id', '!=', $appointment->id);
            if ($doctorId) {
                $inConsultationQuery->where('doctor_id', $doctorId);
            }
            $inConsultationQuery->get()->each(function (Appointment $other) {
                $other->update(['status' => $other->prescription ? 'awaiting_tests' : 'arrived']);
            });
        }

        $appointment->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Status updated.', 'status' => $validated['status']]);
    }

    // ── Patients ─────────────────────────────────────────────────────────────

    /** GET /api/doctor/patients */
    public function patients(Request $request): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();
        $includeAllPatients = $request->boolean('include_all', true);

        $search       = trim($request->get('search', ''));
        $gender       = $request->get('gender', 'all');
        $ageMin       = $request->integer('age_min') ?: null;
        $ageMax       = $request->integer('age_max') ?: null;
        $hasPrescription = $request->get('has_prescription', 'all'); // all | yes | no
        $sortBy       = $request->get('sort_by', 'newest'); // newest | oldest | name_asc | name_desc | prescriptions

        $query = User::whereHas('role', fn ($q) => $q->where('name', 'patient'))
            ->when($doctorId && !$includeAllPatients, fn ($q) => $q->whereHas('appointments', fn ($aq) => $aq->where('doctor_id', $doctorId)))
            ->with(['patientProfile', 'prescriptions' => fn ($q) => $doctorId
                ? $q->where('doctor_id', $doctorId)->select('id', 'user_id', 'diagnosis', 'created_at')->latest()
                : $q->select('id', 'user_id', 'diagnosis', 'created_at')->latest()]);

        // Search
        if ($search) {
            $query->where(fn ($q) => $q
                ->where('name', 'like', "%{$search}%")
                ->orWhere('email', 'like', "%{$search}%")
                ->orWhere('phone', 'like', "%{$search}%")
            );
        }

        // Gender filter (via patientProfile)
        if ($gender !== 'all') {
            $query->whereHas('patientProfile', fn ($q) => $q->where('gender', $gender));
        }

        // Age range filter (via patientProfile)
        if ($ageMin !== null) {
            $query->whereHas('patientProfile', fn ($q) => $q->where('age', '>=', $ageMin));
        }
        if ($ageMax !== null) {
            $query->whereHas('patientProfile', fn ($q) => $q->where('age', '<=', $ageMax));
        }

        // Prescription filter
        if ($hasPrescription === 'yes') {
            $query->whereHas('prescriptions', fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId) : $q);
        } elseif ($hasPrescription === 'no') {
            $query->whereDoesntHave('prescriptions', fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId) : $q);
        }

        // Sort
        match ($sortBy) {
            'oldest'        => $query->orderBy('created_at'),
            'name_asc'      => $query->orderBy('name'),
            'name_desc'     => $query->orderByDesc('name'),
            'prescriptions' => $query->withCount(['prescriptions' => fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId) : $q])
                                     ->orderByDesc('prescriptions_count'),
            default         => $query->orderByDesc('created_at'),
        };

        $patients = $query->paginate($request->integer('per_page', 15))->withQueryString();

        return response()->json([
            'patients' => $patients->through(fn ($p) => [
                'id'                 => $p->id,
                'name'               => $p->name,
                'email'              => $p->email,
                'phone'              => $p->phone,
                'gender'             => $p->patientProfile?->gender,
                'age'                => $p->patientProfile?->age,
                'date_of_birth'      => $p->patientProfile?->date_of_birth?->toDateString(),
                'weight'             => $p->patientProfile?->weight,
                'address'            => $p->patientProfile?->address,
                'prescriptions_count'=> $p->prescriptions->count(),
                'created_at'         => $p->created_at?->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $patients->currentPage(),
                'last_page'    => $patients->lastPage(),
                'total'        => $patients->total(),
            ],
        ]);
    }

    /** POST /api/doctor/patients */
    public function createPatient(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone', 'unique:users,username'],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['phone'],
            'phone' => $validated['phone'],
            'email' => null,
            'password' => Hash::make($validated['phone']),
            'role_id' => $patientRole->id,
        ]);

        $profile = $user->patientProfile()->create([
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'address' => $validated['address'] ?? null,
        ]);

        return response()->json([
            'message' => 'Patient created successfully.',
            'patient' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $profile?->gender,
                'age' => $profile?->age,
                'address' => $profile?->address,
                'prescriptions_count' => 0,
                'created_at' => $user->created_at?->toDateTimeString(),
            ],
        ], 201);
    }

    /** GET /api/doctor/patients/{user} */
    public function patientShow(Request $request, User $user): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();

        if ($doctorId) {
            abort_unless(
                $user->appointments()->where('doctor_id', $doctorId)->exists(),
                403,
                'This patient has no appointments with you.'
            );
        }

        $user->load([
            'patientProfile',
            'appointments' => fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId)->latest() : $q->latest(),
            'prescriptions' => fn ($q) => $doctorId ? $q->where('doctor_id', $doctorId)->latest() : $q->latest(),
        ]);

        return response()->json([
            'patient' => [
                'id'            => $user->id,
                'name'          => $user->name,
                'email'         => $user->email,
                'phone'         => $user->phone,
                'gender'        => $user->patientProfile?->gender,
                'age'           => $user->patientProfile?->age,
                'date_of_birth' => $user->patientProfile?->date_of_birth?->toDateString(),
                'weight'        => $user->patientProfile?->weight,
                'address'       => $user->patientProfile?->address,
                'created_at'    => $user->created_at?->toDateTimeString(),
            ],
            'appointments'  => AppointmentResource::collection($user->appointments),
            'prescriptions' => PrescriptionResource::collection($user->prescriptions),
        ]);
    }

    /** PUT /api/doctor/patients/{user} */
    public function updatePatient(Request $request, User $user): JsonResponse
    {
        $doctor = $request->user();
        $doctorId = $doctor->doctorId();

        abort_unless(
            $user->role?->name === 'patient',
            422,
            'Selected user is not a patient.'
        );

        if ($doctorId) {
            abort_unless(
                $user->appointments()->where('doctor_id', $doctorId)->exists(),
                403,
                'This patient has no appointments with you.'
            );
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20', Rule::unique('users', 'phone')->ignore($user->id), Rule::unique('users', 'username')->ignore($user->id)],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'address' => ['nullable', 'string', 'max:500'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ]);

        $phone = $validated['phone'] ?? null;

        $user->update([
            'name' => $validated['name'],
            'phone' => $phone,
            'username' => $phone ?: $user->username,
        ]);

        if (!empty($validated['password'])) {
            $user->forceFill([
                'password' => Hash::make($validated['password']),
            ])->save();
        }

        $user->patientProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'gender' => $validated['gender'] ?? null,
                'age' => $validated['age'] ?? null,
                'address' => $validated['address'] ?? null,
            ]
        );

        $user->load('patientProfile');

        return response()->json([
            'message' => 'Patient profile updated successfully.',
            'patient' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'gender' => $user->patientProfile?->gender,
                'age' => $user->patientProfile?->age,
                'address' => $user->patientProfile?->address,
            ],
        ]);
    }

    /** PUT /api/doctor/patients/{user}/password */
    public function updatePatientPassword(Request $request, User $user): JsonResponse
    {
        $doctor = $request->user();
        $doctorId = $doctor->doctorId();

        abort_unless(
            $user->role?->name === 'patient',
            422,
            'Selected user is not a patient.'
        );

        if ($doctorId) {
            abort_unless(
                $user->appointments()->where('doctor_id', $doctorId)->exists(),
                403,
                'This patient has no appointments with you.'
            );
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user->forceFill([
            'password' => Hash::make($validated['password']),
        ])->save();

        return response()->json([
            'message' => 'Patient password updated successfully.',
        ]);
    }

    // ── Prescriptions ─────────────────────────────────────────────────────────

    /** GET /api/doctor/prescriptions */
    public function prescriptions(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $prescriptions = Prescription::with([
            'user:id,name,phone',
            'appointment:id,appointment_date,appointment_time,status,symptoms,age,gender',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ])
            ->where('doctor_id', $doctor->doctorId())
            ->orderByDesc('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return response()->json([
            'prescriptions' => PrescriptionResource::collection($prescriptions),
            'meta'          => [
                'current_page' => $prescriptions->currentPage(),
                'last_page'    => $prescriptions->lastPage(),
                'total'        => $prescriptions->total(),
            ],
        ]);
    }

    /** GET /api/doctor/prescriptions/{prescription} */
    public function prescriptionShow(Request $request, Prescription $prescription): JsonResponse
    {
        $doctor   = $request->user();
        $doctorId = $doctor->doctorId();
        if ($doctorId) {
            abort_unless($prescription->doctor_id === $doctorId, 403);
        }

        $prescription->load([
            'user:id,name,email,phone',
            'appointment:id,appointment_date,appointment_time,status',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ]);

        $prescription->user?->loadMissing('patientProfile');

        return response()->json(['prescription' => new PrescriptionResource($prescription)]);
    }

    // ── Schedule ──────────────────────────────────────────────────────────────

    /** GET /api/doctor/schedule */
    public function schedule(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $schedules = DoctorSchedule::where('doctor_id', $doctor->doctorId())->orderBy('day_of_week')->get();
        $ranges    = DoctorScheduleRange::with('chamber:id,name')
            ->where('doctor_id', $doctor->doctorId())
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get()
            ->groupBy('day_of_week');

        $byDay   = $schedules->keyBy('day_of_week');
        $payload = [];

        for ($dow = 0; $dow <= 6; $dow++) {
            $row       = $byDay->get($dow);
            $dayRanges = $ranges->get($dow, collect())
                ->map(fn ($r) => [
                    'id'           => $r->id,
                    'start_time'   => $r->start_time ? substr((string) $r->start_time, 0, 5) : null,
                    'end_time'     => $r->end_time   ? substr((string) $r->end_time, 0, 5)   : null,
                    'chamber_id'   => $r->chamber_id,
                    'chamber_name' => $r->chamber?->name,
                ])
                ->values();

            $payload[] = [
                'day_of_week'  => $dow,
                'slot_minutes' => $row?->slot_minutes ?? 30,
                'is_closed'    => $row?->is_closed ?? ($dow === 5),
                'ranges'       => $dayRanges,
            ];
        }

        $unavailable = DoctorUnavailableRange::where('doctor_id', $doctor->doctorId())
            ->orderBy('start_date')
            ->get()
            ->map(fn ($r) => [
                'id'         => $r->id,
                'start_date' => $r->start_date?->toDateString(),
                'end_date'   => $r->end_date?->toDateString(),
            ])
            ->values();

        return response()->json([
            'schedule'          => $payload,
            'unavailable_ranges'=> $unavailable,
        ]);
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    /** GET /api/doctor/profile */
    public function profile(Request $request): JsonResponse
    {
        $doctor = $request->user()->load('doctorProfile');

        return response()->json([
            'user'    => [
                'id'    => $doctor->id,
                'name'  => $doctor->name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
            ],
            'profile' => $doctor->doctorProfile,
        ]);
    }

    /** PUT /api/doctor/profile */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'            => ['sometimes', 'string', 'max:255'],
            'phone'           => ['sometimes', 'nullable', 'string', 'max:50'],
            'specialization'  => ['sometimes', 'nullable', 'string', 'max:255'],
            'degree'          => ['sometimes', 'nullable', 'string', 'max:255'],
            'registration_no' => ['sometimes', 'nullable', 'string', 'max:100'],
            'bio'             => ['sometimes', 'nullable', 'string'],
            'experience'      => ['sometimes', 'nullable', 'integer', 'min:0'],
        ]);

        $userFields    = array_intersect_key($validated, array_flip(['name', 'phone']));
        $profileFields = array_diff_key($validated, $userFields);

        if (! empty($userFields)) {
            $user->update($userFields);
        }

        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileFields
        );

        return response()->json(['message' => 'Profile updated.']);
    }

    // ── Chambers ─────────────────────────────────────────────────────────────

    public function chambers(Request $request): JsonResponse
    {
        $doctor = $request->user();
        $doctorId = $doctor->doctorId();

        $chambers = \App\Models\Chamber::where('doctor_id', $doctorId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'location']);

        return response()->json(['chambers' => $chambers]);
    }

    public function medicines(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'query' => ['nullable', 'string', 'max:120'],
            'exact' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = trim((string) ($validated['query'] ?? ''));
        $exact = (bool) ($validated['exact'] ?? false);
        $limit = array_key_exists('limit', $validated) ? (int) $validated['limit'] : null;
        $perPage = array_key_exists('per_page', $validated) ? (int) $validated['per_page'] : 10;

        $builder = Medicine::query()->select(['id', 'name', 'strength']);

        if ($query !== '') {
            $normalized = preg_replace('/\s+/', ' ', Str::lower($query));
            if ($exact) {
                $builder->whereRaw('LOWER(TRIM(name)) = ?', [$normalized]);
            } else {
                $builder->where('name', 'like', '%' . $query . '%');
            }
        }

        $builder->orderBy('name');
        if ($exact || $limit !== null) {
            if ($limit !== null) {
                $builder->limit($limit);
            }

            return response()->json($builder->get());
        }

        $paginator = $builder
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($paginator);
    }

    /** POST /api/doctor/medicines */
    public function storeMedicine(Request $request): JsonResponse
    {
        $request->merge([
            'name' => preg_replace('/\s+/', ' ', trim((string) $request->input('name', ''))),
            'strength' => trim((string) $request->input('strength', '')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:120',
                Rule::unique('medicines')->where(fn ($q) =>
                    $q->whereRaw('LOWER(name) = ?', [Str::lower((string) $request->input('name'))])
                ),
            ],
            'strength' => ['nullable', 'string', 'max:60'],
        ]);

        $medicine = Medicine::create([
            'name' => $validated['name'],
            'strength' => $validated['strength'] ?? null,
        ]);

        return response()->json([
            'message' => 'Medicine created successfully.',
            'medicine' => $medicine->only(['id', 'name', 'strength']),
        ], 201);
    }

    /** PUT /api/doctor/medicines/{medicine} */
    public function updateMedicine(Request $request, Medicine $medicine): JsonResponse
    {
        $request->merge([
            'name' => preg_replace('/\s+/', ' ', trim((string) $request->input('name', ''))),
            'strength' => trim((string) $request->input('strength', '')),
        ]);

        $validated = $request->validate([
            'name' => [
                'required', 'string', 'max:120',
                Rule::unique('medicines')->where(fn ($q) =>
                    $q->whereRaw('LOWER(name) = ?', [Str::lower((string) $request->input('name'))])
                )->ignore($medicine->id),
            ],
            'strength' => ['nullable', 'string', 'max:60'],
        ]);

        $medicine->update([
            'name' => $validated['name'],
            'strength' => $validated['strength'] ?? null,
        ]);

        return response()->json([
            'message' => 'Medicine updated successfully.',
            'medicine' => $medicine->only(['id', 'name', 'strength']),
        ]);
    }

    /** DELETE /api/doctor/medicines/{medicine} */
    public function destroyMedicine(Medicine $medicine): JsonResponse
    {
        $medicine->delete();

        return response()->json([
            'message' => 'Medicine deleted successfully.',
        ]);
    }

    // ── Walk-in appointment ───────────────────────────────────────────────────

    /** POST /api/doctor/appointments */
    public function createWalkinAppointment(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'mode'             => ['sometimes', 'in:select_patient,walkin,new_patient'],
            'user_id'          => ['required_if:mode,select_patient', 'nullable', 'integer', 'exists:users,id'],
            'name'             => ['nullable', 'string', 'max:255'],
            'phone'            => ['nullable', 'string', 'max:20'],
            'address'          => ['nullable', 'string', 'max:500'],
            'age'              => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender'           => ['nullable', 'in:male,female,other'],
            'chamber_id'       => ['nullable', 'integer', 'exists:chambers,id'],
            'appointment_date' => ['required', 'date'],
            'appointment_time' => ['required', 'string'],
            'symptoms'         => ['nullable', 'string', 'max:2000'],
            'status'           => ['nullable', 'in:scheduled,arrived,in_consultation,test_registered,awaiting_tests,prescribed,cancelled'],
        ]);

        $mode            = $validated['mode'] ?? 'walkin';
        $appointmentDate = $validated['appointment_date'];

        $serial = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $appointmentDate)
            ->count() + 1;

        $appointmentData = [
            'doctor_id'        => $doctor->doctorId(),
            'chamber_id'       => $validated['chamber_id'] ?? null,
            'appointment_date' => $appointmentDate,
            'appointment_time' => $validated['appointment_time'],
            'serial_no'        => $serial,
            'status'           => $validated['status'] ?? 'scheduled',
            'symptoms'         => $validated['symptoms'] ?? null,
            'name'             => $validated['name'] ?? null,
            'phone'            => $validated['phone'] ?? null,
            'address'          => $validated['address'] ?? null,
            'age'              => $validated['age'] ?? null,
            'gender'           => $validated['gender'] ?? null,
        ];

        if ($mode === 'select_patient') {
            // Use existing registered patient
            $appointmentData['user_id']  = $validated['user_id'];
            $appointmentData['is_guest'] = false;

        } elseif ($mode === 'new_patient') {
            // Create or find patient account by phone
            $patientRole = Role::where('name', 'patient')->firstOrFail();
            $phone       = $validated['phone'] ?? null;

            $user = $phone
                ? User::where('phone', $phone)->orWhere('username', $phone)->first()
                : null;

            if (! $user) {
                $user = User::create([
                    'name'     => $validated['name'] ?? 'Patient',
                    'username' => $phone ?? Str::random(10),
                    'phone'    => $phone,
                    'email'    => null,
                    'password' => Hash::make($phone ?? Str::random(16)),
                    'role_id'  => $patientRole->id,
                ]);
            }

            $user->patientProfile()->updateOrCreate(
                ['user_id' => $user->id],
                array_filter([
                    'age'    => $validated['age'] ?? null,
                    'gender' => $validated['gender'] ?? null,
                ], fn ($v) => $v !== null)
            );

            $appointmentData['user_id']  = $user->id;
            $appointmentData['is_guest'] = false;

        } else {
            // Walk-in guest — no user account
            $appointmentData['user_id']  = null;
            $appointmentData['is_guest'] = true;
        }

        $appointment = Appointment::create($appointmentData);

        return response()->json([
            'message'     => 'Appointment created.',
            'appointment' => new AppointmentResource($appointment->load('user')),
        ], 201);
    }
}
