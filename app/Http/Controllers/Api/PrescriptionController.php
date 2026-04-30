<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PrescriptionResource;
use App\Models\Appointment;
use App\Models\PatientReport;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\PrescriptionInvestigationItem;
use App\Models\PrescriptionMessage;
use App\Models\Role;
use App\Models\User;
use App\Services\Sms\SmsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Prescription CRUD.
 * Used by both the web (Inertia via form submit) and the API.
 */
class PrescriptionController extends Controller
{
    /** GET /api/doctor/investigation-items */
    public function investigationItems(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $validated = $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'prescription_id' => ['nullable', 'integer', 'exists:prescriptions,id'],
        ]);

        $query = PrescriptionInvestigationItem::query()
            ->with(['prescription:id,doctor_id,user_id,patient_name,created_at', 'prescription.user:id,name'])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        if ($user->hasRole('doctor')) {
            $doctorId = $user->doctorId();
            $query->whereHas('prescription', fn ($q) => $q->where('doctor_id', $doctorId));
        }

        if (!empty($validated['prescription_id'])) {
            $query->where('prescription_id', (int) $validated['prescription_id']);
        }

        if (!empty($validated['q'])) {
            $term = trim((string) $validated['q']);
            $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('note', 'like', "%{$term}%");
            });
        }

        $items = $query->limit(300)->get()->map(fn (PrescriptionInvestigationItem $item) => $this->mapInvestigationItem($item));

        return response()->json(['items' => $items]);
    }

    /** POST /api/doctor/investigation-items */
    public function storeInvestigationItem(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $validated = $request->validate([
            'prescription_id' => ['required', 'integer', 'exists:prescriptions,id'],
            'name' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $prescription = Prescription::findOrFail((int) $validated['prescription_id']);
        $this->authorizeInvestigationCrud($user, $prescription);

        $item = $prescription->investigationItems()->create([
            'name' => trim((string) $validated['name']),
            'note' => !empty($validated['note']) ? trim((string) $validated['note']) : null,
            'sort_order' => $validated['sort_order'] ?? ((int) $prescription->investigationItems()->max('sort_order') + 1),
        ]);

        $item->load(['prescription:id,doctor_id,user_id,patient_name,created_at', 'prescription.user:id,name']);

        return response()->json([
            'message' => 'Investigation item created successfully.',
            'item' => $this->mapInvestigationItem($item),
        ], 201);
    }

    /** PUT /api/doctor/investigation-items/{item} */
    public function updateInvestigationItem(Request $request, PrescriptionInvestigationItem $item): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $item->loadMissing('prescription:id,doctor_id,user_id,patient_name,created_at');
        $this->authorizeInvestigationCrud($user, $item->prescription);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $item->update([
            'name' => trim((string) $validated['name']),
            'note' => !empty($validated['note']) ? trim((string) $validated['note']) : null,
            'sort_order' => $validated['sort_order'] ?? $item->sort_order,
        ]);

        $item->load(['prescription:id,doctor_id,user_id,patient_name,created_at', 'prescription.user:id,name']);

        return response()->json([
            'message' => 'Investigation item updated successfully.',
            'item' => $this->mapInvestigationItem($item),
        ]);
    }

    /** DELETE /api/doctor/investigation-items/{item} */
    public function destroyInvestigationItem(Request $request, PrescriptionInvestigationItem $item): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $item->loadMissing('prescription:id,doctor_id');
        $this->authorizeInvestigationCrud($user, $item->prescription);

        $item->delete();

        return response()->json(['message' => 'Investigation item deleted successfully.']);
    }

    /** POST /api/doctor/prescriptions */
    public function store(Request $request): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->hasRole('doctor') || $actor->hasRole('compounder'), 403);

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
            'chief_complaints'  => ['nullable', 'string', 'max:10000'],
            'oe_data'           => ['nullable', 'array'],
            'diagnosis'         => ['nullable', 'string', 'max:5000'],
            'medications'       => ['nullable', 'string', 'max:10000'],
            'dose'              => ['nullable', 'string', 'max:10000'],
            'instructions'      => ['nullable', 'string', 'max:10000'],
            'tests'             => ['nullable', 'string', 'max:10000'],
            'investigation_items' => ['nullable', 'array'],
            'investigation_items.*.name' => ['nullable', 'string', 'max:255'],
            'investigation_items.*.note' => ['nullable', 'string', 'max:1000'],
            'investigation_items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'next_visit_date'   => ['nullable', 'date'],
            'appointment_action'=> ['nullable', 'in:arrived,awaiting_tests,prescribed'],
        ]);

        $userId = null;
        $appointment = null;
        $userCreated = false;
        $toNullableString = static function ($value): ?string {
            if ($value === null) {
                return null;
            }

            $text = trim((string) $value);

            return $text !== '' ? $text : null;
        };

        $toNullableInt = static function ($value): ?int {
            if ($value === null || $value === '') {
                return null;
            }

            return is_numeric($value) ? (int) $value : null;
        };

        $effectivePatientName = trim((string) ($validated['patient_name'] ?? ''));
        $effectivePatientAge = $toNullableString($validated['patient_age'] ?? null);
        $effectivePatientAgeUnit = $toNullableString($validated['patient_age_unit'] ?? null) ?? 'years';
        $effectivePatientGender = $toNullableString($validated['patient_gender'] ?? null);
        $effectivePatientWeight = $toNullableString($validated['patient_weight'] ?? null);
        $effectivePatientContact = $toNullableString($validated['patient_contact'] ?? null);

        if ($validated['appointment_id'] ?? null) {
            $appointment = Appointment::with('prescription')
                ->where('doctor_id', $actor->doctorId())
                ->where('id', $validated['appointment_id'])
                ->firstOrFail();

            $appointment->loadMissing('user.patientProfile');

            if (! $effectivePatientName) {
                $effectivePatientName = $appointment->name
                    ?? $appointment->user?->name
                    ?? $effectivePatientName;
            }

            if (! $effectivePatientContact) {
                $effectivePatientContact = $toNullableString($appointment->phone)
                    ?? $toNullableString($appointment->user?->phone)
                    ?? $effectivePatientContact;
            }

            if (! $effectivePatientAge) {
                $effectivePatientAge = $toNullableString($appointment->age)
                    ?? $toNullableString($appointment->user?->patientProfile?->age)
                    ?? $effectivePatientAge;
            }

            if (! $effectivePatientGender) {
                $effectivePatientGender = $toNullableString($appointment->gender)
                    ?? $toNullableString($appointment->user?->patientProfile?->gender)
                    ?? $effectivePatientGender;
            }

            if ($appointment->prescription) {
                $existingPrescription = $appointment->prescription;

                $existingPrescription->update([
                    'visit_type'       => $validated['visit_type'] ?? $existingPrescription->visit_type,
                    'template_type'    => $validated['template_type'] ?? $existingPrescription->template_type ?? 'general',
                    'specialty_data'   => $validated['specialty_data'] ?? $existingPrescription->specialty_data,
                    'chief_complaints' => array_key_exists('chief_complaints', $validated)
                        ? $toNullableString($validated['chief_complaints'])
                        : ($existingPrescription->chief_complaints ?? $this->extractChiefComplaintsFromDiagnosis($validated['diagnosis'] ?? null)),
                    'oe_data'          => array_key_exists('oe_data', $validated)
                        ? $this->normalizeOeData($validated['oe_data'])
                        : ($existingPrescription->oe_data ?? $this->extractOeDataFromDiagnosis($validated['diagnosis'] ?? null)),
                    'diagnosis'        => trim($validated['diagnosis'] ?? ''),
                    'medications'      => $validated['medications'] ?? '',
                    'dose'             => $validated['dose'] ?? $existingPrescription->dose,
                    'instructions'     => $validated['instructions'] ?? $existingPrescription->instructions,
                    'tests'            => $validated['tests'] ?? $existingPrescription->tests,
                    'next_visit_date'  => $validated['next_visit_date'] ?? $existingPrescription->next_visit_date,
                    'patient_name'     => $effectivePatientName ?: $existingPrescription->patient_name,
                    'patient_age'      => $effectivePatientAge ?? $existingPrescription->patient_age,
                    'patient_age_unit' => $effectivePatientAgeUnit ?: ($existingPrescription->patient_age_unit ?? 'years'),
                    'patient_gender'   => $effectivePatientGender ?? $existingPrescription->patient_gender,
                    'patient_weight'   => $effectivePatientWeight ?? $existingPrescription->patient_weight,
                    'patient_contact'  => $effectivePatientContact ?? $existingPrescription->patient_contact,
                ]);

                $appointment->update([
                    'name' => $effectivePatientName ?: ($appointment->name ?? $appointment->user?->name),
                    'phone' => $effectivePatientContact ?? ($appointment->phone ?? $appointment->user?->phone),
                    'age' => $toNullableInt($effectivePatientAge) ?? ($appointment->age ?? $appointment->user?->patientProfile?->age),
                    'gender' => $effectivePatientGender ?? ($appointment->gender ?? $appointment->user?->patientProfile?->gender),
                ]);

                $investigationItems = $validated['investigation_items'] ?? $this->linesToInvestigationItems($validated['tests'] ?? null);
                $this->syncInvestigationItems($existingPrescription, $investigationItems);

                if ($validated['appointment_action'] ?? null) {
                    $appointment->update(['status' => $validated['appointment_action']]);
                }

                return response()->json([
                    'message' => 'Prescription updated for this appointment.',
                    'prescription_id' => $existingPrescription->id,
                    'prescription_uuid' => $existingPrescription->uuid,
                ]);
            }
            $userId = $appointment->user_id;
        }

        if (! $userId && ! empty($effectivePatientContact)) {
            $phone = $effectivePatientContact;
            $patientRole = Role::where('name', 'patient')->first();

            $existingUser = User::where('phone', $phone)
                ->orWhere('username', $phone)
                ->first();

            if ($existingUser) {
                $userId = $existingUser->id;
                $existingUser->patientProfile()->updateOrCreate(
                    ['user_id' => $existingUser->id],
                    array_filter([
                        'age' => $toNullableInt($effectivePatientAge),
                        'weight' => $effectivePatientWeight,
                        'gender' => $effectivePatientGender,
                    ])
                );
            } elseif ($patientRole) {
                $newUser = User::create([
                    'name'     => $effectivePatientName,
                    'username' => $phone,
                    'phone'    => $phone,
                    'email'    => null,
                    'password' => Hash::make($phone),
                    'role_id'  => $patientRole->id,
                ]);
                $newUser->patientProfile()->create([
                    'age' => $toNullableInt($effectivePatientAge),
                    'gender' => $effectivePatientGender,
                    'weight' => $effectivePatientWeight,
                ]);
                $userId = $newUser->id;
                $userCreated = true;
            }
        }

        $prescription = Prescription::create([
            'appointment_id'   => $validated['appointment_id'] ?? null,
            'user_id'          => $userId,
            'doctor_id'        => $actor->doctorId(),
            'visit_type'       => $validated['visit_type'] ?? null,
            'template_type'    => $validated['template_type'] ?? 'general',
            'specialty_data'   => $validated['specialty_data'] ?? null,
            'chief_complaints' => $toNullableString($validated['chief_complaints'] ?? null)
                ?? $this->extractChiefComplaintsFromDiagnosis($validated['diagnosis'] ?? null),
            'oe_data'          => $this->normalizeOeData($validated['oe_data'] ?? null)
                ?? $this->extractOeDataFromDiagnosis($validated['diagnosis'] ?? null),
            'diagnosis'        => trim($validated['diagnosis'] ?? ''),
            'medications'      => $validated['medications'] ?? '',
            'dose'             => $validated['dose'] ?? null,
            'instructions'     => $validated['instructions'] ?? null,
            'tests'            => $validated['tests'] ?? null,
            'next_visit_date'  => $validated['next_visit_date'] ?? null,
            'patient_name'     => $effectivePatientName,
            'patient_age'      => $effectivePatientAge,
            'patient_age_unit' => $effectivePatientAgeUnit,
            'patient_gender'   => $effectivePatientGender,
            'patient_weight'   => $effectivePatientWeight,
            'patient_contact'  => $effectivePatientContact,
        ]);

        if ($appointment) {
            $appointment->update([
                'name' => $effectivePatientName ?: ($appointment->name ?? $appointment->user?->name),
                'phone' => $effectivePatientContact ?? ($appointment->phone ?? $appointment->user?->phone),
                'age' => $toNullableInt($effectivePatientAge) ?? ($appointment->age ?? $appointment->user?->patientProfile?->age),
                'gender' => $effectivePatientGender ?? ($appointment->gender ?? $appointment->user?->patientProfile?->gender),
            ]);
        }

        $investigationItems = $validated['investigation_items'] ?? $this->linesToInvestigationItems($validated['tests'] ?? null);
        $this->syncInvestigationItems($prescription, $investigationItems);

        if ($validated['appointment_action'] ?? null) {
            $appointment?->update(['status' => $validated['appointment_action']]);
        }

        return response()->json([
            'message'         => $userCreated
                ? 'Prescription created. New patient account created (password = phone number).'
                : 'Prescription created.',
            'user_created'    => $userCreated,
            'prescription_id' => $prescription->id,
            'prescription_uuid' => $prescription->uuid,
        ], 201);
    }

    /** POST /api/doctor/prescriptions/{prescription}/messages */
    public function storeMessage(Request $request, Prescription $prescription, SmsService $smsService): JsonResponse
    {
       
      

        $validated = $request->validate([
            'phone' => ['required', 'string', 'max:50'],
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $publicUrl = route('public.prescriptions.show', ['prescription' => $prescription->uuid ?: $prescription->id]);
        $messageBody = trim((string) $validated['message']);
        if (! str_contains($messageBody, $publicUrl)) {
            $messageBody = trim($messageBody."\n\n".$publicUrl);
        }
dd($messageBody);
        $saved = PrescriptionMessage::create([
            'prescription_id' => $prescription->id,
            'doctor_id' => $prescription->doctor_id,
            'phone' => trim($validated['phone']),
            'message' => $messageBody,
        ]);

        $smsResult = $smsService->send($saved->phone, $saved->message);
        $smsSent = (bool) ($smsResult['success'] ?? false);

        return response()->json([
            'message' => $smsSent
                ? 'Prescription message saved and SMS sent successfully.'
                : 'Prescription message saved, but SMS sending failed.',
            'sms' => [
                'sent' => $smsSent,
                'status_code' => $smsResult['status_code'] ?? null,
                'detail' => $smsResult['message'] ?? null,
            ],
            'saved' => [
                'id' => $saved->id,
                'prescription_id' => $saved->prescription_id,
                'phone' => $saved->phone,
                'message' => $saved->message,
                'public_url' => $publicUrl,
                'created_at' => $saved->created_at?->toDateTimeString(),
            ],
        ], 201);
    }

    /** PUT /api/doctor/prescriptions/{prescription} */
    public function update(Request $request, Prescription $prescription): JsonResponse
    {
        $actor = $request->user();
        abort_unless($actor->hasRole('doctor') || $actor->hasRole('compounder'), 403);
        abort_unless($prescription->doctor_id === $actor->doctorId(), 403);

        $validated = $request->validate([
            'diagnosis'         => ['nullable', 'string', 'max:5000'],
            'medications'       => ['nullable', 'string', 'max:10000'],
            'dose'              => ['nullable', 'string', 'max:10000'],
            'instructions'      => ['nullable', 'string', 'max:10000'],
            'tests'             => ['nullable', 'string', 'max:10000'],
            'investigation_items' => ['nullable', 'array'],
            'investigation_items.*.name' => ['nullable', 'string', 'max:255'],
            'investigation_items.*.note' => ['nullable', 'string', 'max:1000'],
            'investigation_items.*.sort_order' => ['nullable', 'integer', 'min:0'],
            'next_visit_date'   => ['nullable', 'date'],
            'patient_contact'   => ['nullable', 'string', 'max:50'],
            'patient_age'       => ['nullable', 'string', 'max:10'],
            'patient_age_unit'  => ['nullable', 'string', 'max:20'],
            'patient_gender'    => ['nullable', 'string', 'max:20'],
            'patient_weight'    => ['nullable', 'string', 'max:20'],
            'visit_type'        => ['nullable', 'string', 'max:50'],
            'template_type'     => ['nullable', 'in:general,eye'],
            'specialty_data'    => ['nullable', 'array'],
            'chief_complaints'  => ['nullable', 'string', 'max:10000'],
            'oe_data'           => ['nullable', 'array'],
            'appointment_action'=> ['nullable', 'string', 'in:arrived,awaiting_tests,prescribed'],
        ]);

        $toNullableString = static function ($value): ?string {
            if ($value === null) {
                return null;
            }

            $text = trim((string) $value);

            return $text !== '' ? $text : null;
        };

        $toNullableInt = static function ($value): ?int {
            if ($value === null || $value === '') {
                return null;
            }

            return is_numeric($value) ? (int) $value : null;
        };

        $effectivePatientAge = array_key_exists('patient_age', $validated)
            ? $toNullableString($validated['patient_age'])
            : $prescription->patient_age;
        $effectivePatientAgeUnit = array_key_exists('patient_age_unit', $validated)
            ? ($toNullableString($validated['patient_age_unit']) ?? 'years')
            : ($prescription->patient_age_unit ?? 'years');
        $effectivePatientGender = array_key_exists('patient_gender', $validated)
            ? $toNullableString($validated['patient_gender'])
            : $prescription->patient_gender;
        $effectivePatientWeight = array_key_exists('patient_weight', $validated)
            ? $toNullableString($validated['patient_weight'])
            : $prescription->patient_weight;
        $effectivePatientContact = array_key_exists('patient_contact', $validated)
            ? $toNullableString($validated['patient_contact'])
            : $prescription->patient_contact;

        $prescription->update([
            'chief_complaints' => array_key_exists('chief_complaints', $validated)
                ? $toNullableString($validated['chief_complaints'])
                : ($prescription->chief_complaints ?? $this->extractChiefComplaintsFromDiagnosis($validated['diagnosis'] ?? null)),
            'oe_data'          => array_key_exists('oe_data', $validated)
                ? $this->normalizeOeData($validated['oe_data'])
                : ($prescription->oe_data ?? $this->extractOeDataFromDiagnosis($validated['diagnosis'] ?? null)),
            'diagnosis'        => trim($validated['diagnosis'] ?? ''),
            'medications'      => $validated['medications'] ?? '',
            'dose'             => $validated['dose'] ?? $prescription->dose,
            'instructions'     => $validated['instructions'] ?? null,
            'tests'            => $validated['tests'] ?? null,
            'next_visit_date'  => $validated['next_visit_date'] ?? null,
            'visit_type'       => $validated['visit_type'] ?? null,
            'template_type'    => $validated['template_type'] ?? $prescription->template_type ?? 'general',
            'specialty_data'   => $validated['specialty_data'] ?? $prescription->specialty_data,
            'patient_contact'  => $effectivePatientContact,
            'patient_age'      => $effectivePatientAge,
            'patient_age_unit' => $effectivePatientAgeUnit,
            'patient_gender'   => $effectivePatientGender,
            'patient_weight'   => $effectivePatientWeight,
        ]);

        if (array_key_exists('investigation_items', $validated) || array_key_exists('tests', $validated)) {
            $investigationItems = $validated['investigation_items'] ?? $this->linesToInvestigationItems($validated['tests'] ?? null);
            $this->syncInvestigationItems($prescription, $investigationItems);
        }

        if ($prescription->user) {
            $prescription->user->patientProfile()->updateOrCreate(
                ['user_id' => $prescription->user_id],
                array_filter([
                    'age' => $toNullableInt($effectivePatientAge),
                    'gender' => $effectivePatientGender,
                    'weight' => $effectivePatientWeight,
                ])
            );
        }

        if ($prescription->appointment) {
            $prescription->appointment->loadMissing('user.patientProfile');
            $prescription->appointment->update([
                'name' => $prescription->patient_name ?: ($prescription->appointment->name ?? $prescription->appointment->user?->name),
                'phone' => $effectivePatientContact ?? ($prescription->appointment->phone ?? $prescription->appointment->user?->phone),
                'age' => $toNullableInt($effectivePatientAge) ?? ($prescription->appointment->age ?? $prescription->appointment->user?->patientProfile?->age),
                'gender' => $effectivePatientGender ?? ($prescription->appointment->gender ?? $prescription->appointment->user?->patientProfile?->gender),
            ]);
        }

        if (($validated['appointment_action'] ?? null) && $prescription->appointment) {
            $prescription->appointment->update(['status' => $validated['appointment_action']]);
        }

        $prescription->load([
            'user:id,name,phone',
            'appointment:id,appointment_date,appointment_time,status',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ]);

        return response()->json([
            'message'      => 'Prescription updated.',
            'prescription' => new PrescriptionResource($prescription),
        ]);
    }

    /** GET /api/doctor/prescriptions/{prescription}/reports */
    public function reports(Request $request, Prescription $prescription): JsonResponse
    {
        $this->authorizeReportAccess($request, $prescription);

        $reports = PatientReport::query()
            ->where('prescription_id', $prescription->id)
            ->latest()
            ->get()
            ->map(fn (PatientReport $report) => $this->mapReport($report));

        return response()->json(['reports' => $reports]);
    }

    /** POST /api/doctor/prescriptions/{prescription}/reports */
    public function uploadReport(Request $request, Prescription $prescription): JsonResponse
    {
        $this->authorizeReportAccess($request, $prescription);

        $validated = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
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

        $ownerUserId = $prescription->user_id ?: $request->user()->id;

        $title = trim((string) ($validated['title'] ?? ''));

        if ($hasFile) {
            $file = $validated['report_file'];
            $path = $file->store("patient-reports/{$ownerUserId}", 'public');
            $originalName = $file->getClientOriginalName();
            $mimeType = $file->getClientMimeType();
            $fileSize = $file->getSize();
            if ($title === '') {
                $title = pathinfo((string) $originalName, PATHINFO_FILENAME) ?: 'Report';
            }
        } else {
            $path = null;
            $originalName = $title !== '' ? $title : 'Text Report';
            $mimeType = null;
            $fileSize = null;
            if ($title === '') {
                $title = 'Text Report';
            }
        }

        $report = PatientReport::create([
            'user_id' => $ownerUserId,
            'prescription_id' => $prescription->id,
            'title' => $title,
            'original_name' => $originalName,
            'file_path' => $path,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'note' => $validated['note'] ?? null,
            'report_text' => $reportText !== '' ? $reportText : null,
        ]);

        return response()->json([
            'message' => 'Report uploaded successfully.',
            'report' => $this->mapReport($report),
        ], 201);
    }

    /** PUT /api/doctor/prescriptions/{prescription}/reports/{report} */
    public function updateReport(Request $request, Prescription $prescription, PatientReport $report): JsonResponse
    {
        $this->authorizeReportAccess($request, $prescription);
        abort_unless((int) $report->prescription_id === (int) $prescription->id, 404);

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
            'report' => $this->mapReport($report),
        ]);
    }

    /** DELETE /api/doctor/prescriptions/{prescription}/reports/{report} */
    public function deleteReport(Request $request, Prescription $prescription, PatientReport $report): JsonResponse
    {
        $this->authorizeReportAccess($request, $prescription);
        abort_unless((int) $report->prescription_id === (int) $prescription->id, 404);

        if ($report->file_path) {
            Storage::disk('public')->delete($report->file_path);
        }

        $report->delete();

        return response()->json([
            'message' => 'Report deleted successfully.',
        ]);
    }

    private function authorizeReportAccess(Request $request, Prescription $prescription): void
    {
        $user = $request->user();

        if ($user->hasRole('doctor')) {
            abort_unless($prescription->doctor_id === $user->doctorId(), 403);
            return;
        }

        abort_unless($user->hasRole('compounder'), 403);
    }

    private function mapReport(PatientReport $report): array
    {
        return [
            'id' => $report->id,
            'title' => $report->title,
            'original_name' => $report->original_name,
            'file_url' => $report->file_path ? asset('storage/'.$report->file_path) : null,
            'mime_type' => $report->mime_type,
            'file_size' => $report->file_size,
            'note' => $report->note,
            'report_text' => $report->report_text,
            'created_at' => $report->created_at?->toDateTimeString(),
        ];
    }

    private function mapInvestigationItem(PrescriptionInvestigationItem $item): array
    {
        $prescription = $item->prescription;
        $patientName = $prescription?->patient_name ?: $prescription?->user?->name;

        return [
            'id' => $item->id,
            'prescription_id' => $item->prescription_id,
            'name' => $item->name,
            'note' => $item->note,
            'sort_order' => $item->sort_order,
            'updated_at' => $item->updated_at?->toDateTimeString(),
            'prescription' => $prescription ? [
                'id' => $prescription->id,
                'patient_name' => $patientName,
                'created_at' => $prescription->created_at?->toDateTimeString(),
            ] : null,
        ];
    }

    private function authorizeInvestigationCrud($user, ?Prescription $prescription): void
    {
        abort_unless($prescription, 404);

        if ($user->hasRole('doctor')) {
            abort_unless($prescription->doctor_id === $user->doctorId(), 403);
            return;
        }

        abort_unless($user->hasRole('compounder'), 403);
    }

    private function linesToInvestigationItems(?string $tests): array
    {
        return collect(explode("\n", (string) ($tests ?? '')))
            ->map(fn ($line) => trim((string) $line))
            ->filter(fn ($line) => $line !== '')
            ->values()
            ->map(fn ($line, $index) => [
                'name' => $line,
                'note' => null,
                'sort_order' => $index,
            ])
            ->all();
    }

    private function syncInvestigationItems(Prescription $prescription, ?array $items): void
    {
        if (!is_array($items)) {
            return;
        }

        $normalized = collect($items)
            ->map(function ($item, $index) {
                $name = trim((string) ($item['name'] ?? ''));
                $note = trim((string) ($item['note'] ?? ''));
                $sortOrder = isset($item['sort_order']) && is_numeric($item['sort_order'])
                    ? (int) $item['sort_order']
                    : $index;

                if ($name === '') {
                    return null;
                }

                return [
                    'name' => $name,
                    'note' => $note !== '' ? $note : null,
                    'sort_order' => $sortOrder,
                ];
            })
            ->filter()
            ->values()
            ->all();

        $prescription->investigationItems()->delete();

        if (!empty($normalized)) {
            $prescription->investigationItems()->createMany($normalized);
        }
    }

    private function normalizeOeData($oeData): ?array
    {
        if (!is_array($oeData)) {
            return null;
        }

        $normalized = collect($oeData)
            ->map(function ($item) {
                if (!is_array($item)) {
                    return null;
                }

                $key = trim((string) ($item['key'] ?? ''));
                $label = trim((string) ($item['label'] ?? $key));
                $value = trim((string) ($item['value'] ?? ''));

                if ($key === '' || $value === '') {
                    return null;
                }

                return [
                    'key' => strtoupper($key),
                    'label' => $label !== '' ? $label : strtoupper($key),
                    'value' => $value,
                ];
            })
            ->filter()
            ->values()
            ->all();

        return $normalized !== [] ? $normalized : null;
    }

    private function extractChiefComplaintsFromDiagnosis(?string $diagnosis): ?string
    {
        $text = trim((string) ($diagnosis ?? ''));
        if ($text === '') {
            return null;
        }

        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];
        $inCc = false;
        $cc = [];

        foreach ($lines as $line) {
            $line = trim((string) $line);
            if ($line === '') {
                if ($inCc) {
                    break;
                }
                continue;
            }

            if (preg_match('/^Chief Complaints\s*:/i', $line)) {
                $inCc = true;
                continue;
            }

            if ($inCc) {
                if (!str_starts_with($line, '-')) {
                    break;
                }

                $item = trim((string) preg_replace('/^-\s*/', '', $line));
                if ($item !== '') {
                    $cc[] = $item;
                }
            }
        }

        return $cc !== [] ? implode("\n", $cc) : null;
    }

    private function extractOeDataFromDiagnosis(?string $diagnosis): ?array
    {
        $text = trim((string) ($diagnosis ?? ''));
        if ($text === '') {
            return null;
        }

        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];
        $inOe = false;
        $data = [];

        foreach ($lines as $line) {
            $line = trim((string) $line);
            if ($line === '') {
                if ($inOe) {
                    break;
                }
                continue;
            }

            if (preg_match('/^(O\/E|OE|Vitals)\s*:/i', $line)) {
                $inOe = true;

                $inline = trim((string) preg_replace('/^(O\/E|OE|Vitals)\s*:\s*/i', '', $line));
                if ($inline !== '') {
                    foreach (explode(',', $inline) as $chunk) {
                        $chunk = trim((string) $chunk);
                        if ($chunk === '') {
                            continue;
                        }

                        if (preg_match('/^([A-Za-z][A-Za-z0-9\/ ]*)\s*[: ]\s*(.+)$/', $chunk, $m)) {
                            $key = strtoupper(trim((string) $m[1]));
                            $value = trim((string) $m[2]);
                            if ($key !== '' && $value !== '') {
                                $data[] = ['key' => $key, 'label' => $key, 'value' => $value];
                            }
                        }
                    }
                }

                continue;
            }

            if ($inOe) {
                if (!str_starts_with($line, '-')) {
                    break;
                }

                $item = trim((string) preg_replace('/^-\s*/', '', $line));
                if ($item === '') {
                    continue;
                }

                if (preg_match('/^([A-Za-z][A-Za-z0-9\/ ]*)\s*:\s*(.+)$/', $item, $m)) {
                    $key = strtoupper(trim((string) $m[1]));
                    $value = trim((string) $m[2]);
                    if ($key !== '' && $value !== '') {
                        $data[] = ['key' => $key, 'label' => $key, 'value' => $value];
                    }
                }
            }
        }

        return $data !== [] ? $data : null;
    }
}
