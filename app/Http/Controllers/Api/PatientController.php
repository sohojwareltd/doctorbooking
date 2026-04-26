<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\PatientReport;
use App\Models\Prescription;
use App\Models\SiteContent;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Patient (registered user) API endpoints.
 * Role: patient
 */
class PatientController extends Controller
{
    /** GET /api/patient/dashboard-mobile */
    public function dashboardMobile(Request $request): JsonResponse
    {
        $user = $request->user();
        $userEmail = strtolower((string) ($user->email ?? ''));

        $upcomingAppointment = Appointment::query()
            ->with(['chamber:id,name,location'])
            ->where(function ($q) use ($user, $userEmail) {
                $q->where('user_id', $user->id);

                if ($userEmail !== '') {
                    $q->orWhere(function ($guest) use ($userEmail) {
                        $guest->whereNull('user_id')
                            ->where('is_guest', true)
                            ->whereNotNull('email')
                            ->whereRaw('LOWER(email) = ?', [$userEmail]);
                    });
                }
            })
            ->whereDate('appointment_date', '>=', now()->toDateString())
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->first();

        $appointmentAt = null;
        $countdownSeconds = null;
        if ($upcomingAppointment?->appointment_date) {
            $date = $upcomingAppointment->appointment_date->toDateString();
            $time = $upcomingAppointment->appointment_time ?: '00:00:00';
            $appointmentAt = Carbon::parse($date.' '.$time);
            $countdownSeconds = max(0, now()->diffInSeconds($appointmentAt, false));
        }

        $recentPrescription = Prescription::query()
            ->with(['appointment:id,chamber_id', 'appointment.chamber:id,name,location'])
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->first();

        $recentReport = PatientReport::query()
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->first();

        $homeContent = SiteContent::query()->where('key', 'home')->first()?->value;
        $homeContent = is_array($homeContent) ? SiteContent::normalizeValue($homeContent) : [];

        $defaultTip = 'A short walk after meals can help steady your energy through the afternoon.';
        $tipText = data_get($homeContent, 'health_tip')
            ?? data_get($homeContent, 'daily_health_tip')
            ?? data_get($homeContent, 'tip.text')
            ?? $defaultTip;

        $chamberName = $upcomingAppointment?->chamber?->name
            ?? $recentPrescription?->appointment?->chamber?->name;
        $chamberLocation = $upcomingAppointment?->chamber?->location
            ?? $recentPrescription?->appointment?->chamber?->location;

        return response()->json([
            'message' => 'Patient dashboard snapshot fetched successfully.',
            'dashboard' => [
                'greeting' => [
                    'name' => $user->name,
                    'subtitle' => 'Here is a calm snapshot of your care today.',
                ],
                'upcoming_appointment' => $upcomingAppointment ? [
                    'id' => $upcomingAppointment->id,
                    'date' => $upcomingAppointment->appointment_date?->toDateString(),
                    'time' => $upcomingAppointment->appointment_time,
                    'serial_no' => $upcomingAppointment->serial_no,
                    'status' => $upcomingAppointment->status,
                    'chamber_name' => $upcomingAppointment->chamber?->name,
                    'chamber_location' => $upcomingAppointment->chamber?->location,
                    'appointment_at' => $appointmentAt?->toIso8601String(),
                    'countdown_seconds' => $countdownSeconds,
                ] : null,
                'daily_tip' => [
                    'title' => 'Daily health tip',
                    'text' => $tipText,
                ],
                'your_chamber' => [
                    'name' => $chamberName,
                    'location' => $chamberLocation,
                ],
                'recent_prescription' => $recentPrescription ? [
                    'id' => $recentPrescription->id,
                    'summary' => $recentPrescription->medications
                        ? mb_substr(trim(strip_tags($recentPrescription->medications)), 0, 140)
                        : null,
                    'issued_at' => $recentPrescription->created_at?->toDateString(),
                ] : null,
                'recent_test_result' => $recentReport ? [
                    'id' => $recentReport->id,
                    'name' => $recentReport->note ?: $recentReport->original_name,
                    'status' => 'ready',
                    'uploaded_at' => $recentReport->created_at?->toDateString(),
                    'file_url' => asset('storage/'.$recentReport->file_path),
                ] : null,
            ],
        ]);
    }

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
        $userEmail = strtolower((string) ($user->email ?? ''));

        $appointments = Appointment::with([
            'prescription:id,uuid,appointment_id',
            'chamber:id,name',
            'user:id,name,email,phone',
        ])
            ->where(function ($q) use ($user, $userEmail) {
                $q->where('user_id', $user->id);

                if ($userEmail !== '') {
                    $q->orWhere(function ($guest) use ($userEmail) {
                        $guest->whereNull('user_id')
                            ->where('is_guest', true)
                            ->whereNotNull('email')
                            ->whereRaw('LOWER(email) = ?', [$userEmail]);
                    });
                }
            })
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

    /** GET /api/patient/appointments-mobile */
    public function appointmentsMobile(Request $request): JsonResponse
    {
        $user = $request->user();
        $userEmail = strtolower((string) ($user->email ?? ''));

        $rows = Appointment::query()
            ->with([
                'chamber:id,name,location',
                'doctor:id,user_id,specialization',
                'prescription:id,uuid,appointment_id,diagnosis,medications,tests',
            ])
            ->where(function ($q) use ($user, $userEmail) {
                $q->where('user_id', $user->id);

                if ($userEmail !== '') {
                    $q->orWhere(function ($guest) use ($userEmail) {
                        $guest->whereNull('user_id')
                            ->where('is_guest', true)
                            ->whereNotNull('email')
                            ->whereRaw('LOWER(email) = ?', [$userEmail]);
                    });
                }
            })
            ->orderBy('appointment_date')
            ->orderBy('appointment_time')
            ->get();

        $upcoming = [];
        $pastCancelled = [];

        foreach ($rows as $appointment) {
            $payload = [
                'id' => $appointment->id,
                'date' => $appointment->appointment_date?->toDateString(),
                'time' => $appointment->appointment_time ? substr((string) $appointment->appointment_time, 0, 5) : null,
                'serial_no' => $appointment->serial_no,
                'status' => $appointment->status,
                'status_label' => $this->statusLabel((string) $appointment->status),
                'title' => $appointment->prescription?->diagnosis
                    ? Str::of(strip_tags((string) $appointment->prescription->diagnosis))->squish()->limit(80, '')->__toString()
                    : ($appointment->symptoms ?: 'Appointment follow-up'),
                'specialty' => $appointment->doctor?->specialization ?: 'General Medicine',
                'chamber' => [
                    'name' => $appointment->chamber?->name,
                    'location' => $appointment->chamber?->location,
                ],
                'labs_count' => $this->countDelimitedItems($appointment->prescription?->tests),
                'prescriptions_count' => $appointment->prescription ? 1 : 0,
                'has_prescription' => (bool) $appointment->prescription,
            ];

            if ($this->isUpcomingAppointment($appointment)) {
                $upcoming[] = $payload;
            } else {
                $pastCancelled[] = $payload;
            }
        }

        return response()->json([
            'message' => 'Appointments data fetched successfully.',
            'appointments' => [
                'upcoming' => $upcoming,
                'past_cancelled' => $pastCancelled,
            ],
            'counts' => [
                'upcoming' => count($upcoming),
                'past_cancelled' => count($pastCancelled),
                'total' => count($rows),
            ],
        ]);
    }

    /** GET /api/patient/appointments/{appointment} */
    public function appointmentShow(Request $request, Appointment $appointment): JsonResponse
    {
        $user = $request->user();
        $userEmail = strtolower((string) ($user->email ?? ''));

        $isOwner = $appointment->user_id === $user->id;
        $isLinkedGuest = $userEmail !== ''
            && is_null($appointment->user_id)
            && (bool) $appointment->is_guest
            && strtolower((string) ($appointment->email ?? '')) === $userEmail;

        abort_unless($isOwner || $isLinkedGuest, 403);

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
                'report_text' => $report->report_text,
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
            'report_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            'report_text' => ['nullable', 'string', 'max:20000'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $reportText = trim((string) ($validated['report_text'] ?? ''));
        $hasFile = $request->hasFile('report_file');

        if (! $hasFile && $reportText === '') {
            return response()->json([
                'message' => 'Please upload a file or write a text report.',
            ], 422);
        }

        if ($hasFile) {
            $file = $validated['report_file'];
            $path = $file->store("patient-reports/{$user->id}", 'public');
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getClientMimeType();
            $fileSize = $file->getSize();
        } else {
            $baseName = trim((string) ($validated['note'] ?? ''));
            $slug = Str::slug($baseName) ?: 'text-report';
            $fileName = now()->format('Ymd_His').'_'.$slug.'_'.Str::lower(Str::random(6)).'.txt';
            $path = "patient-reports/{$user->id}/{$fileName}";
            Storage::disk('public')->put($path, $reportText);
            $originalName = $fileName;
            $mimeType = 'text/plain';
            $fileSize = strlen($reportText);
        }

        $report = PatientReport::create([
            'user_id' => $user->id,
            'prescription_id' => $prescription->id,
            'original_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'note' => $validated['note'] ?? null,
            'report_text' => $reportText !== '' ? $reportText : null,
        ]);

        if ($prescription->appointment && ! in_array((string) $prescription->appointment->status, ['cancelled', 'prescribed'], true)) {
            $prescription->appointment->update(['status' => 'test_registered']);
        }

        return response()->json([
            'message' => 'Report uploaded successfully.',
            'report' => [
                'id' => $report->id,
                'original_name' => $report->original_name,
                'file_url' => asset('storage/'.$report->file_path),
                'mime_type' => $report->mime_type,
                'file_size' => $report->file_size,
                'note' => $report->note,
                'report_text' => $report->report_text,
                'created_at' => $report->created_at?->toDateTimeString(),
            ],
        ], 201);
    }

    /** PUT /api/patient/prescriptions/{prescription}/reports/{report} */
    public function updatePrescriptionReport(Request $request, Prescription $prescription, PatientReport $report): JsonResponse
    {
        $user = $request->user();
        abort_unless($prescription->user_id === $user->id, 403);
        abort_unless((int) $report->prescription_id === (int) $prescription->id, 404);
        abort_unless((int) $report->user_id === (int) $user->id, 403);

        $validated = $request->validate([
            'report_text' => ['nullable', 'string', 'max:20000'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        $hasNote = array_key_exists('note', $validated);
        $hasText = array_key_exists('report_text', $validated);
        if (! $hasNote && ! $hasText) {
            return response()->json([
                'message' => 'Please provide note or text report to update.',
            ], 422);
        }

        if ($hasNote) {
            $note = trim((string) ($validated['note'] ?? ''));
            $report->note = $note !== '' ? $note : null;
        }

        if ($hasText) {
            $reportText = trim((string) ($validated['report_text'] ?? ''));
            $report->report_text = $reportText !== '' ? $reportText : null;

            if (Str::startsWith((string) $report->mime_type, 'text/')) {
                Storage::disk('public')->put($report->file_path, $reportText);
                $report->file_size = strlen($reportText);
            }
        }

        $report->save();

        return response()->json([
            'message' => 'Report updated successfully.',
            'report' => [
                'id' => $report->id,
                'original_name' => $report->original_name,
                'file_url' => asset('storage/'.$report->file_path),
                'mime_type' => $report->mime_type,
                'file_size' => $report->file_size,
                'note' => $report->note,
                'report_text' => $report->report_text,
                'created_at' => $report->created_at?->toDateTimeString(),
            ],
        ]);
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

    private function isUpcomingAppointment(Appointment $appointment): bool
    {
        if (! $appointment->appointment_date) {
            return false;
        }

        $time = $appointment->appointment_time ?: '23:59:59';
        $slotAt = Carbon::parse($appointment->appointment_date->toDateString().' '.$time);

        return $slotAt->greaterThanOrEqualTo(now()) && ! in_array(strtolower((string) $appointment->status), ['cancelled', 'completed'], true);
    }

    private function countDelimitedItems(?string $value): int
    {
        if (! $value) {
            return 0;
        }

        $parts = preg_split('/[\r\n,;]+/', strip_tags($value)) ?: [];
        $parts = array_values(array_filter(array_map(fn ($item) => trim((string) $item), $parts)));

        return count($parts);
    }

    private function statusLabel(string $status): string
    {
        $normalized = strtolower(trim($status));

        return match ($normalized) {
            'approved', 'pending', 'arrived', 'in_consultation', 'test_registered', 'awaiting_tests', 'prescribed' => 'Upcoming',
            'cancelled' => 'Cancelled',
            'completed' => 'Completed',
            default => 'Past',
        };
    }
}
