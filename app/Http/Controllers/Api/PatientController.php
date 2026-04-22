<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\PatientReport;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Patient (registered user) API endpoints.
 * Role: patient
 */
class PatientController extends Controller
{
    /** GET /api/patient/profile */
    public function profile(Request $request): JsonResponse
    {
        $user = $request->user()->load('patientProfile', 'role');

        return response()->json([
            'user' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'email'    => $user->email,
                'phone'    => $user->phone,
                'role'     => $user->role?->name,
            ],
            'profile' => $user->patientProfile,
        ]);
    }

    /** PUT /api/patient/profile */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'          => ['sometimes', 'string', 'max:255'],
            'phone'         => ['sometimes', 'nullable', 'string', 'max:50'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'age'           => ['sometimes', 'nullable', 'integer', 'min:0'],
            'gender'        => ['sometimes', 'nullable', 'in:male,female,other'],
            'weight'        => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'address'       => ['sometimes', 'nullable', 'string', 'max:500'],
        ]);

        $userFields    = array_intersect_key($validated, array_flip(['name', 'phone']));
        $profileFields = array_diff_key($validated, $userFields);

        if (! empty($userFields)) {
            $user->update($userFields);
        }

        $user->patientProfile()->updateOrCreate(
            ['user_id' => $user->id],
            $profileFields
        );

        return response()->json(['message' => 'Profile updated.']);
    }

    /** GET /api/patient/appointments */
    public function appointments(Request $request): JsonResponse
    {
        $user = $request->user();

        $appointments = Appointment::with(['prescription:id,appointment_id'])
            ->where(fn ($q) => $q->where('user_id', $user->id)
                ->orWhere('email', $user->email))
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->paginate($request->integer('per_page', 10))
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

    /** GET /api/patient/appointments/{appointment} */
    public function appointmentShow(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        abort_unless(
            $appointment->user_id === $user->id || $appointment->email === $user->email,
            403
        );

        $appointment->load(['prescription']);

        return response()->json(['appointment' => new AppointmentResource($appointment)]);
    }

    /** GET /api/patient/prescriptions */
    public function prescriptions(Request $request): JsonResponse
    {
        $user = $request->user();

        $prescriptions = Prescription::where('user_id', $user->id)
            ->with(['doctor:id,name', 'appointment:id,appointment_date,symptoms'])
            ->orderByDesc('created_at')
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

    /** GET /api/patient/prescriptions/{prescription} */
    public function prescriptionShow(Request $request, Prescription $prescription): JsonResponse
    {
        $user = $request->user();
        abort_unless($prescription->user_id === $user->id, 403);

        $prescription->load([
            'doctor:id,name,email,phone',
            'appointment:id,appointment_date,appointment_time,status',
        ]);

        return response()->json(['prescription' => new PrescriptionResource($prescription)]);
    }

    /** GET /api/patient/prescriptions/{prescription}/reports */
    public function prescriptionReports(Request $request, Prescription $prescription): JsonResponse
    {
        $user = $request->user();
        abort_unless($prescription->user_id === $user->id, 403);

        $reports = PatientReport::query()
            ->where('user_id', $user->id)
            ->where('prescription_id', $prescription->id)
            ->latest()
            ->get()
            ->map(fn (PatientReport $report) => [
                'id' => $report->id,
                'original_name' => $report->original_name,
                'file_url' => asset('storage/'.$report->file_path),
                'mime_type' => $report->mime_type,
                'file_size' => $report->file_size,
                'note' => $report->note,
                'created_at' => $report->created_at?->toDateTimeString(),
            ]);

        return response()->json(['reports' => $reports]);
    }

    /** POST /api/patient/prescriptions/{prescription}/reports */
    public function uploadPrescriptionReport(Request $request, Prescription $prescription): JsonResponse
    {
        $user = $request->user();
        abort_unless($prescription->user_id === $user->id, 403);

        $validated = $request->validate([
            'report_file' => ['required', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $file = $validated['report_file'];
        $path = $file->store("patient-reports/{$user->id}", 'public');

        $report = PatientReport::create([
            'user_id' => $user->id,
            'prescription_id' => $prescription->id,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Report uploaded successfully.',
            'report' => [
                'id' => $report->id,
                'original_name' => $report->original_name,
                'file_url' => asset('storage/'.$report->file_path),
                'mime_type' => $report->mime_type,
                'file_size' => $report->file_size,
                'note' => $report->note,
                'created_at' => $report->created_at?->toDateTimeString(),
            ],
        ], 201);
    }

    /** POST /api/patient/link-guest-appointments */
    public function linkGuestAppointments(Request $request): JsonResponse
    {
        $user = $request->user();

        $count = Appointment::where('email', $user->email)
            ->whereNull('user_id')
            ->where('is_guest', true)
            ->update(['user_id' => $user->id, 'is_guest' => false]);

        return response()->json([
            'message' => "Linked {$count} guest appointment(s) to your account.",
            'count'   => $count,
        ]);
    }
}
