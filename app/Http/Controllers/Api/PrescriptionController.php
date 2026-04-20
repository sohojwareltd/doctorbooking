<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/**
 * Prescription CRUD — doctor only.
 * Used by both the web (Inertia via form submit) and the API.
 */
class PrescriptionController extends Controller
{
    /** POST /api/doctor/prescriptions */
    public function store(Request $request): JsonResponse
    {
        $doctor = $request->user();
        abort_unless($doctor->hasRole('doctor'), 403);

        $validated = $request->validate([
            'appointment_id'    => ['nullable', 'integer', 'exists:appointments,id'],
            'patient_name'      => ['required', 'string', 'max:255'],
            'patient_age'       => ['nullable', 'string', 'max:10'],
            'patient_age_unit'  => ['nullable', 'string', 'max:20'],
            'patient_gender'    => ['nullable', 'string', 'max:20'],
            'patient_weight'    => ['nullable', 'string', 'max:20'],
            'patient_contact'   => ['nullable', 'string', 'max:50'],
            'visit_type'        => ['nullable', 'string', 'max:50'],
            'template_type'     => ['nullable', 'in:general,eye'],
            'specialty_data'    => ['nullable', 'array'],
            'diagnosis'         => ['nullable', 'string', 'max:5000'],
            'medications'       => ['nullable', 'string', 'max:10000'],
            'instructions'      => ['nullable', 'string', 'max:10000'],
            'tests'             => ['nullable', 'string', 'max:10000'],
            'next_visit_date'   => ['nullable', 'date'],
            'appointment_action'=> ['nullable', 'in:awaiting_tests,prescribed'],
        ]);

        $userId      = null;
        $appointment = null;
        $userCreated = false;

        if ($validated['appointment_id'] ?? null) {
            $appointment = Appointment::with('prescription')
                ->where('doctor_id', $doctor->doctorId())
                ->where('id', $validated['appointment_id'])
                ->firstOrFail();

            if ($appointment->prescription) {
                return response()->json(['message' => 'Prescription already exists for this appointment.'], 422);
            }
            $userId = $appointment->user_id;
        }

        // Auto-create patient if phone provided and no user found
        if (! $userId && ! empty($validated['patient_contact'])) {
            $phone       = $validated['patient_contact'];
            $patientRole = Role::where('name', 'patient')->first();

            $existingUser = User::where('phone', $phone)
                ->orWhere('username', $phone)
                ->first();

            if ($existingUser) {
                $userId = $existingUser->id;
                $existingUser->patientProfile()->updateOrCreate(
                    ['user_id' => $existingUser->id],
                    array_filter([
                        'weight' => $validated['patient_weight'] ?? null,
                        'gender' => $validated['patient_gender'] ?? null,
                    ])
                );
            } elseif ($patientRole) {
                $safePhone = preg_replace('/\D+/', '', (string) $phone);
                $newUser   = User::create([
                    'name'     => $validated['patient_name'],
                    'username' => $phone,
                    'phone'    => $phone,
                    'email'    => null,
                    'password' => Hash::make($phone),
                    'role_id'  => $patientRole->id,
                ]);
                $newUser->patientProfile()->create([
                    'gender' => $validated['patient_gender'] ?? null,
                    'weight' => $validated['patient_weight'] ?? null,
                ]);
                $userId      = $newUser->id;
                $userCreated = true;
            }
        }

        $prescription = Prescription::create([
            'appointment_id'   => $validated['appointment_id'] ?? null,
            'user_id'          => $userId,
            'doctor_id' => $doctor->doctorId(),
            'visit_type'       => $validated['visit_type'] ?? null,
            'template_type'    => $validated['template_type'] ?? 'general',
            'specialty_data'   => $validated['specialty_data'] ?? null,
            'diagnosis'        => trim($validated['diagnosis'] ?? ''),
            'medications'      => $validated['medications'] ?? '',
            'instructions'     => $validated['instructions'] ?? null,
            'tests'            => $validated['tests'] ?? null,
            'next_visit_date'  => $validated['next_visit_date'] ?? null,
            'patient_name'     => $validated['patient_name'],
            'patient_age'      => $validated['patient_age'] ?? null,
            'patient_age_unit' => $validated['patient_age_unit'] ?? 'years',
            'patient_gender'   => $validated['patient_gender'] ?? null,
            'patient_weight'   => $validated['patient_weight'] ?? null,
            'patient_contact'  => $validated['patient_contact'] ?? null,
        ]);

        if ($validated['appointment_action'] ?? null) {
            $appointment?->update(['status' => $validated['appointment_action']]);
        }

        return response()->json([
            'message'         => $userCreated
                ? 'Prescription created. New patient account created (password = phone number).'
                : 'Prescription created.',
            'user_created'    => $userCreated,
            'prescription_id' => $prescription->id,
        ], 201);
    }

    /** PUT /api/doctor/prescriptions/{prescription} */
    public function update(Request $request, Prescription $prescription): JsonResponse
    {
        $doctor = $request->user();
        abort_unless($doctor->hasRole('doctor') && $prescription->doctor_id === $doctor->doctorId(), 403);

        $validated = $request->validate([
            'diagnosis'         => ['nullable', 'string', 'max:5000'],
            'medications'       => ['nullable', 'string', 'max:10000'],
            'instructions'      => ['nullable', 'string', 'max:10000'],
            'tests'             => ['nullable', 'string', 'max:10000'],
            'next_visit_date'   => ['nullable', 'date'],
            'patient_contact'   => ['nullable', 'string', 'max:50'],
            'patient_age'       => ['nullable', 'string', 'max:10'],
            'patient_age_unit'  => ['nullable', 'string', 'max:20'],
            'patient_gender'    => ['nullable', 'string', 'max:20'],
            'patient_weight'    => ['nullable', 'string', 'max:20'],
            'visit_type'        => ['nullable', 'string', 'max:50'],
            'template_type'     => ['nullable', 'in:general,eye'],
            'specialty_data'    => ['nullable', 'array'],
            'appointment_action'=> ['nullable', 'string', 'in:prescribed'],
        ]);

        $prescription->update([
            'diagnosis'        => trim($validated['diagnosis'] ?? ''),
            'medications'      => $validated['medications'] ?? '',
            'instructions'     => $validated['instructions'] ?? null,
            'tests'            => $validated['tests'] ?? null,
            'next_visit_date'  => $validated['next_visit_date'] ?? null,
            'visit_type'       => $validated['visit_type'] ?? null,
            'template_type'    => $validated['template_type'] ?? $prescription->template_type ?? 'general',
            'specialty_data'   => $validated['specialty_data'] ?? $prescription->specialty_data,
            'patient_contact'  => $validated['patient_contact'] ?? $prescription->patient_contact,
            'patient_age'      => $validated['patient_age'] ?? $prescription->patient_age,
            'patient_age_unit' => $validated['patient_age_unit'] ?? $prescription->patient_age_unit,
            'patient_gender'   => $validated['patient_gender'] ?? $prescription->patient_gender,
            'patient_weight'   => $validated['patient_weight'] ?? $prescription->patient_weight,
        ]);

        // Keep patient profile in sync
        if ($prescription->user) {
            $prescription->user->patientProfile()->updateOrCreate(
                ['user_id' => $prescription->user_id],
                array_filter([
                    'gender' => $validated['patient_gender'] ?? null,
                    'weight' => $validated['patient_weight'] ?? null,
                ])
            );
        }

        if (($validated['appointment_action'] ?? null) === 'prescribed' && $prescription->appointment) {
            if (in_array($prescription->appointment->status, ['awaiting_tests', 'in_consultation'], true)) {
                $prescription->appointment->update(['status' => 'prescribed']);
            }
        }

        $prescription->load([
            'user:id,name,phone',
            'appointment:id,appointment_date,appointment_time,status',
        ]);

        return response()->json([
            'message'      => 'Prescription updated.',
            'prescription' => new PrescriptionResource($prescription),
        ]);
    }
}
