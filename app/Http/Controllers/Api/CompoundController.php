<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PrescriptionResource;
use App\Http\Resources\UserResource;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Compounder (clinic assistant / receptionist) API endpoints.
 * Has broad read and appointment-management access.
 * Role: compounder
 */
class CompoundController extends Controller
{
    // ── Dashboard ─────────────────────────────────────────────────────────────

    /** GET /api/compounder/stats */
    public function stats(): JsonResponse
    {
        $today = now()->toDateString();

        return response()->json([
            'users'             => User::count(),
            'patients'          => User::whereHas('role', fn ($q) => $q->where('name', 'patient'))->count(),
            'appointments_today'=> Appointment::whereDate('appointment_date', $today)->count(),
            'scheduled'         => Appointment::where('status', 'scheduled')->count(),
            'total_appointments'=> Appointment::count(),
            'total_prescriptions'=> Prescription::count(),
        ]);
    }

    // ── Appointments ──────────────────────────────────────────────────────────

    /** GET /api/compounder/appointments */
    public function appointments(Request $request): JsonResponse
    {
        $appointments = Appointment::with(['user:id,name', 'doctor:id,name'])
            ->orderByDesc('appointment_date')
            ->orderBy('serial_no')
            ->orderBy('appointment_time')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json([
            'appointments' => AppointmentResource::collection($appointments),
            'meta'         => [
                'current_page' => $appointments->currentPage(),
                'last_page'    => $appointments->lastPage(),
                'total'        => $appointments->total(),
            ],
            'stats' => [
                'total'           => Appointment::count(),
                'scheduled'       => Appointment::where('status', 'scheduled')->count(),
                'arrived'         => Appointment::where('status', 'arrived')->count(),
                'in_consultation' => Appointment::where('status', 'in_consultation')->count(),
                'awaiting_tests'  => Appointment::where('status', 'awaiting_tests')->count(),
                'prescribed'      => Appointment::where('status', 'prescribed')->count(),
                'cancelled'       => Appointment::where('status', 'cancelled')->count(),
            ],
        ]);
    }

    /** PUT /api/compounder/appointments/{appointment}/status */
    public function updateAppointmentStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in([
                'scheduled', 'arrived', 'in_consultation',
                'awaiting_tests', 'prescribed', 'cancelled',
            ])],
        ]);

        $appointment->update(['status' => $validated['status']]);

        return response()->json(['message' => 'Status updated.', 'status' => $validated['status']]);
    }

    /**
     * POST /api/compounder/appointments
     * Walk-in patient booking — find/create patient user and create appointment.
     */
    public function bookAppointment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'   => ['required', 'string', 'max:255'],
            'phone'  => ['required', 'string', 'max:20'],
            'age'    => ['required', 'integer', 'min:1', 'max:150'],
            'gender' => ['required', 'in:male,female,other'],
        ]);

        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['message' => 'No doctor configured.'], 422);
        }

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        // Find or create patient by phone
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
            // Update profile info
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
            'doctor_id' => $doctor->doctorId(),
            'appointment_date' => $today,
            'appointment_time' => now()->format('H:i:s'),
            'serial_no'        => $serial,
            'status'           => 'scheduled',
        ]);

        return response()->json([
            'message'     => 'Walk-in appointment created.',
            'appointment' => new AppointmentResource($appointment),
        ], 201);
    }

    // ── Users / Patients ──────────────────────────────────────────────────────

    /** GET /api/compounder/users */
    public function users(Request $request): JsonResponse
    {
        $users = User::with('role')
            ->withCount('prescriptions')
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        return response()->json([
            'users' => $users->through(fn ($u) => [
                'id'                  => $u->id,
                'name'                => $u->name,
                'username'            => $u->username,
                'email'               => $u->email,
                'phone'               => $u->phone,
                'role'                => $u->role?->name,
                'prescriptions_count' => $u->prescriptions_count,
                'created_at'          => $u->created_at?->toDateTimeString(),
            ]),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    // ── Prescriptions ─────────────────────────────────────────────────────────

    /** GET /api/compounder/prescriptions */
    public function prescriptions(Request $request): JsonResponse
    {
        $prescriptions = Prescription::with(['user:id,name,email', 'doctor:id,name'])
            ->latest()
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

    /** GET /api/compounder/prescriptions/{prescription} */
    public function prescriptionShow(Prescription $prescription): JsonResponse
    {
        $prescription->load([
            'user:id,name,email,phone',
            'doctor:id,name,email',
        ]);

        return response()->json(['prescription' => new PrescriptionResource($prescription)]);
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    /** GET /api/compounder/reports */
    public function reports(): JsonResponse
    {
        $recentAppointments = Appointment::with(['user:id,name', 'doctor:id,name'])
            ->orderByDesc('appointment_date')
            ->take(10)
            ->get()
            ->map(fn ($a) => [
                'id'               => $a->id,
                'serial_no'        => $a->serial_no,
                'patient_name'     => $a->user?->name ?? $a->name,
                'doctor_name'      => $a->doctor?->name,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'status'           => $a->status,
            ]);

        return response()->json([
            'stats' => [
                'total_users'                  => User::count(),
                'total_appointments'           => Appointment::count(),
                'total_prescriptions'          => Prescription::count(),
                'scheduled_appointments'       => Appointment::where('status', 'scheduled')->count(),
                'arrived_appointments'         => Appointment::where('status', 'arrived')->count(),
                'in_consultation_appointments' => Appointment::where('status', 'in_consultation')->count(),
                'awaiting_tests_appointments'  => Appointment::where('status', 'awaiting_tests')->count(),
                'prescribed_appointments'      => Appointment::where('status', 'prescribed')->count(),
                'cancelled_appointments'       => Appointment::where('status', 'cancelled')->count(),
                'total_patients'               => User::whereHas('role', fn ($q) => $q->where('name', 'patient'))->count(),
            ],
            'recent_appointments' => $recentAppointments,
        ]);
    }
}
