<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class PrescriptionController extends Controller
{
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $doctor = $request->user();
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'appointment_id' => ['nullable', 'integer'],
            'patient_name' => ['required', 'string', 'max:255'],
            'patient_age' => ['nullable', 'string', 'max:10'],
            'patient_age_unit' => ['nullable', 'string', 'max:20'],
            'patient_gender' => ['nullable', 'string', 'max:20'],
            'patient_weight' => ['nullable', 'string', 'max:20'],
            'patient_contact' => ['nullable', 'string', 'max:50'],
            'visit_type' => ['nullable', 'string', 'max:50'],
            'diagnosis' => ['nullable', 'string', 'max:5000'],
            'medications' => ['nullable', 'string', 'max:10000'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'tests' => ['nullable', 'string', 'max:10000'],
            'next_visit_date' => ['nullable', 'date'],
        ]);

        $userId = null;
        $appointmentId = $validated['appointment_id'] ?? null;
        $userCreated = false;

        // If appointment_id is provided, validate it
        if ($appointmentId) {
            $appointment = Appointment::with('prescription')
                ->where('doctor_id', $doctor->id)
                ->where('id', $appointmentId)
                ->first();

            if (!$appointment) {
                return response()->json(['message' => 'Appointment not found.'], 404);
            }

            if ($appointment->prescription) {
                return response()->json(['message' => 'Prescription already exists for this appointment.'], 422);
            }

            $userId = $appointment->user_id;
        }

        // If no user_id from appointment, try to find or create user by phone
        if (!$userId && !empty($validated['patient_contact'])) {
            $phone = $validated['patient_contact'];
            
            // Try to find existing user by phone
            $existingUser = User::where('phone', $phone)->first();
            
            if ($existingUser) {
                // User exists, use their ID
                $userId = $existingUser->id;
                
                // Update user's weight if provided
                if (!empty($validated['patient_weight'])) {
                    $existingUser->update(['weight' => $validated['patient_weight']]);
                }
            } else {
                // Create new user account
                $newUser = User::create([
                    'name' => $validated['patient_name'],
                    'phone' => $phone,
                    'email' => null,
                    'password' => Hash::make($phone), // Default password is phone number
                    'role' => 'patient',
                    'gender' => $validated['patient_gender'] ?? null,
                    'weight' => $validated['patient_weight'] ?? null,
                    'email_verified_at' => now(),
                ]);
                
                $userId = $newUser->id;
                $userCreated = true;
            }
        }

        // Save prescription
        $prescription = Prescription::create([
            'appointment_id' => $appointmentId,
            'user_id' => $userId,
            'doctor_id' => $doctor->id,
            'visit_type' => $validated['visit_type'] ?? null,
            'diagnosis' => trim($validated['diagnosis'] ?? ''),
            'medications' => $validated['medications'] ?? '',
            'instructions' => $validated['instructions'] ?? null,
            'tests' => $validated['tests'] ?? null,
            'next_visit_date' => $validated['next_visit_date'] ?? null,
        ]);

        // Update user's weight if user exists and weight provided
        if ($userId && !empty($validated['patient_weight']) && !$userCreated) {
            User::where('id', $userId)->update([
                'weight' => $validated['patient_weight'],
            ]);
        }

        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => $userCreated 
                    ? 'Prescription created. New patient account created with phone number as password.' 
                    : 'Prescription created.',
                'user_created' => $userCreated,
                'prescription_id' => $prescription->id,
            ]);
        }

        return redirect()->route('doctor.prescriptions.show', $prescription->id)
            ->with('success', $userCreated 
                ? 'Prescription created. New patient account created (Password: Phone Number)' 
                : 'Prescription created.');
    }

    public function update(Request $request, Prescription $prescription): JsonResponse
    {
        $doctor = $request->user();
        if (!$doctor || $doctor->role !== 'doctor' || $prescription->doctor_id !== $doctor->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'diagnosis' => ['nullable', 'string', 'max:5000'],
            'medications' => ['nullable', 'string', 'max:10000'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'tests' => ['nullable', 'string', 'max:10000'],
            'next_visit_date' => ['nullable', 'date'],
            'patient_contact' => ['nullable', 'string', 'max:50'],
            'patient_age' => ['nullable', 'string', 'max:10'],
            'patient_age_unit' => ['nullable', 'string', 'max:20'],
            'patient_gender' => ['nullable', 'string', 'max:20'],
            'patient_weight' => ['nullable', 'string', 'max:20'],
            'visit_type' => ['nullable', 'string', 'max:50'],
        ]);

        $rawPatientAge = array_key_exists('patient_age', $validated)
            ? trim((string) ($validated['patient_age'] ?? ''))
            : null;
        $parsedPatientAge = null;
        if (!is_null($rawPatientAge) && $rawPatientAge !== '' && is_numeric($rawPatientAge)) {
            $parsedPatientAge = (int) $rawPatientAge;
        }

        $prescription->update([
            'diagnosis' => trim($validated['diagnosis'] ?? ''),
            'medications' => $validated['medications'] ?? '',
            'instructions' => $validated['instructions'] ?? null,
            'tests' => $validated['tests'] ?? null,
            'next_visit_date' => $validated['next_visit_date'] ?? null,
            'visit_type' => $validated['visit_type'] ?? null,
        ]);

        if ($prescription->user) {
            $prescription->user->update([
                'phone' => $validated['patient_contact'] ?? $prescription->user->phone,
                'age' => !is_null($rawPatientAge) ? $parsedPatientAge : $prescription->user->age,
                'gender' => $validated['patient_gender'] ?? $prescription->user->gender,
                'weight' => $validated['patient_weight'] ?? $prescription->user->weight,
            ]);
        }

        if ($prescription->appointment) {
            $appointmentUpdates = [];

            if (!empty($validated['patient_contact'])) {
                $appointmentUpdates['phone'] = $validated['patient_contact'];
            }

            if (!empty($validated['patient_gender'])) {
                $appointmentUpdates['gender'] = $validated['patient_gender'];
            }

            if (!is_null($rawPatientAge)) {
                $appointmentUpdates['age'] = $parsedPatientAge;
            }

            if (!empty($appointmentUpdates)) {
                $prescription->appointment->update($appointmentUpdates);
            }
        }

        $prescription->load([
            'user:id,name,phone,age,gender,weight',
            'appointment:id,age,gender,phone',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Prescription updated successfully.',
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
                'patient_contact' => $prescription->user?->phone ?? $prescription->appointment?->phone,
                'patient_age' => $prescription->user?->age ?? $prescription->appointment?->age,
                'patient_age_unit' => $validated['patient_age_unit'] ?? 'years',
                'patient_gender' => $prescription->user?->gender ?? $prescription->appointment?->gender,
                'patient_weight' => $prescription->user?->weight,
                'user' => $prescription->user ? [
                    'id' => $prescription->user->id,
                    'name' => $prescription->user->name,
                    'phone' => $prescription->user->phone,
                    'age' => $prescription->user->age,
                    'gender' => $prescription->user->gender,
                    'weight' => $prescription->user->weight,
                ] : null,
            ],
        ]);
    }
}
