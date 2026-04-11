<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PatientController extends Controller
{
    /** GET /doctor/patients */
    public function index(): Response
    {
        $doctor = Auth::user();

        $patientQuery = User::whereHas('role', fn ($q) => $q->where('name', 'patient'));

        if (! $doctor?->hasRole('compounder')) {
            $patientQuery->whereHas('appointments', fn ($q) => $q->where('doctor_id', $doctor->doctorId()));
        }

        $allPatients = (clone $patientQuery)->with('patientProfile')->get();
        $hasPhone    = $allPatients->filter(fn ($p) => $p->phone)->count();
        $emailOnly   = $allPatients->filter(fn ($p) => $p->email && ! $p->phone)->count();
        $noContact   = $allPatients->filter(fn ($p) => ! $p->email && ! $p->phone)->count();

        $patients = (clone $patientQuery)
            ->with([
                'patientProfile',
                'prescriptions' => fn ($q) => $doctor?->hasRole('compounder')
                    ? $q->select('id', 'user_id', 'diagnosis', 'created_at')->latest()
                    : $q->where('doctor_id', $doctor->doctorId())
                        ->select('id', 'user_id', 'diagnosis', 'created_at')
                        ->latest(),
            ])
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('doctor/Patients', [
            'patients' => $patients->through(fn ($p) => [
                'id'                  => $p->id,
                'name'                => $p->name,
                'email'               => $p->email,
                'phone'               => $p->phone,
                'gender'              => $p->patientProfile?->gender,
                'age'                 => $p->patientProfile?->age,
                'date_of_birth'       => $p->patientProfile?->date_of_birth?->toDateString(),
                'created_at'          => $p->created_at,
                'has_prescription'    => $p->prescriptions->isNotEmpty(),
                'prescriptions_count' => $p->prescriptions->count(),
                'prescriptions'       => $p->prescriptions->map(fn ($rx) => [
                    'id'         => $rx->id,
                    'diagnosis'  => $rx->diagnosis,
                    'created_at' => $rx->created_at,
                ])->toArray(),
            ]),
            'stats' => [
                'hasPhone'  => $hasPhone,
                'emailOnly' => $emailOnly,
                'noContact' => $noContact,
            ],
        ]);
    }

    /** GET /doctor/patients/{patient} */
    public function show(User $patient): Response
    {
        $doctor = Auth::user();

        if (! $doctor?->hasRole('compounder')) {
            abort_unless(
                $patient->appointments()->where('doctor_id', $doctor->doctorId())->exists(),
                403
            );
        }

        $patient->load([
            'patientProfile',
            'appointments' => fn ($q) => $doctor?->hasRole('compounder')
                ? $q->latest()
                : $q->where('doctor_id', $doctor->doctorId())->latest(),
            'prescriptions' => fn ($q) => $doctor?->hasRole('compounder')
                ? $q->latest()
                : $q->where('doctor_id', $doctor->doctorId())->latest(),
        ]);

        return Inertia::render('doctor/PatientShow', [
            'patient' => [
                'id'            => $patient->id,
                'name'          => $patient->name,
                'email'         => $patient->email,
                'phone'         => $patient->phone,
                'gender'        => $patient->patientProfile?->gender,
                'age'           => $patient->patientProfile?->age,
                'date_of_birth' => $patient->patientProfile?->date_of_birth?->toDateString(),
                'weight'        => $patient->patientProfile?->weight,
                'address'       => $patient->patientProfile?->address,
                'created_at'    => $patient->created_at,
            ],
            'appointments'  => $patient->appointments->map(fn ($a) => [
                'id'               => $a->id,
                'appointment_date' => $a->appointment_date?->toDateString(),
                'appointment_time' => $a->appointment_time,
                'status'           => $a->status,
                'symptoms'         => $a->symptoms,
                'created_at'       => $a->created_at,
            ]),
            'prescriptions' => $patient->prescriptions->map(fn ($p) => [
                'id'              => $p->id,
                'diagnosis'       => $p->diagnosis,
                'medications'     => $p->medications,
                'instructions'    => $p->instructions,
                'tests'           => $p->tests,
                'next_visit_date' => $p->next_visit_date,
                'created_at'      => $p->created_at,
            ]),
        ]);
    }

    /** GET /compounder/users */
    public function compoundUsers(): Response
    {
        $users = User::with('role')
            ->withCount('prescriptions')
            ->orderByDesc('created_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Users', [
            'users' => $users->through(fn ($u) => [
                'id'                  => $u->id,
                'name'                => $u->name,
                'email'               => $u->email,
                'phone'               => $u->phone,
                'role'                => $u->role?->name,
                'created_at'          => $u->created_at,
                'has_prescription'    => $u->prescriptions_count > 0,
                'prescriptions_count' => $u->prescriptions_count,
            ]),
        ]);
    }
}
