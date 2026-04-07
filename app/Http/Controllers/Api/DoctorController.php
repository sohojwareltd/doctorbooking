<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

        $query = Appointment::with(['user:id,name,email,phone', 'prescription:id,appointment_id']);
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

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%"))
                  ->orWhere('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $appointments = $query
            ->orderByDesc('appointment_date')
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
                'awaiting_tests', 'prescribed', 'cancelled',
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

        $patients = User::whereHas('role', fn ($q) => $q->where('name', 'patient'))
            ->when($doctorId, fn ($q) => $q->whereHas('appointments', fn ($aq) => $aq->where('doctor_id', $doctorId)))
            ->with(['patientProfile', 'prescriptions' => fn ($q) => $doctorId
                ? $q->where('doctor_id', $doctorId)->select('id', 'user_id', 'diagnosis', 'created_at')->latest()
                : $q->select('id', 'user_id', 'diagnosis', 'created_at')->latest()])
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

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

    // ── Prescriptions ─────────────────────────────────────────────────────────

    /** GET /api/doctor/prescriptions */
    public function prescriptions(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $prescriptions = Prescription::with([
            'user:id,name,phone',
            'appointment:id,appointment_date,appointment_time,status,symptoms,age,gender',
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

    // ── Walk-in appointment ───────────────────────────────────────────────────

    /** POST /api/doctor/appointments */
    public function createWalkinAppointment(Request $request): JsonResponse
    {
        $doctor    = $request->user();
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:255'],
            'phone'  => ['required', 'string', 'max:20'],
            'age'    => ['required', 'integer', 'min:1', 'max:150'],
            'gender' => ['required', 'in:male,female,other'],
        ]);

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        $user = User::where('phone', $validated['phone'])
            ->orWhere('username', $validated['phone'])
            ->first();

        if (! $user) {
            $user = User::create([
                'name'     => $validated['name'],
                'username' => $validated['phone'],
                'phone'    => $validated['phone'],
                'email'    => null,
                'password' => Hash::make($validated['phone']),
                'role_id'  => $patientRole->id,
            ]);
            $user->patientProfile()->create([
                'age'    => $validated['age'],
                'gender' => $validated['gender'],
            ]);
        } else {
            $user->patientProfile()->updateOrCreate(
                ['user_id' => $user->id],
                ['age' => $validated['age'], 'gender' => $validated['gender']]
            );
        }

        $today  = now()->toDateString();
        $serial = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $today)
            ->count() + 1;

        $appointment = Appointment::create([
            'user_id'          => $user->id,
            'doctor_id'        => $doctor->doctorId(),
            'appointment_date' => $today,
            'appointment_time' => now()->format('H:i:s'),
            'serial_no'        => $serial,
            'status'           => 'scheduled',
        ]);

        return response()->json([
            'message'     => 'Walk-in appointment created.',
            'appointment' => new AppointmentResource($appointment->load('user')),
        ], 201);
    }
}
