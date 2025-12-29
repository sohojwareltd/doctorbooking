<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PrescriptionController extends Controller
{
    public function store(Request $request): JsonResponse|RedirectResponse
    {
        $doctor = Auth::user();
        if (!$doctor || $doctor->role !== 'doctor') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'appointment_id' => ['required', 'integer'],
            'diagnosis' => ['nullable', 'string', 'max:5000'],
            'medications' => ['nullable', 'string', 'max:10000'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'tests' => ['nullable', 'string', 'max:10000'],
            'next_visit_date' => ['nullable', 'date'],
        ]);

        $appointment = Appointment::with('prescription')
            ->where('doctor_id', $doctor->id)
            ->where('id', $validated['appointment_id'])
            ->first();

        if (!$appointment) {
            return response()->json(['message' => 'Appointment not found.'], 404);
        }

        if ($appointment->prescription) {
            return response()->json(['message' => 'Prescription already exists for this appointment.'], 422);
        }

        Prescription::create([
            'appointment_id' => $appointment->id,
            'user_id' => $appointment->user_id,
            'doctor_id' => $doctor->id,
            'diagnosis' => $validated['diagnosis'] ?? '',
            'medications' => $validated['medications'] ?? '',
            'instructions' => $validated['instructions'] ?? null,
            'tests' => $validated['tests'] ?? null,
            'next_visit_date' => $validated['next_visit_date'] ?? null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Prescription created.',
            ]);
        }

        return back()->with('success', 'Prescription created.');
    }
}
