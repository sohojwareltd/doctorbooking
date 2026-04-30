<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Api\PrescriptionController as ApiPrescriptionController;
use App\Http\Controllers\Controller;
use App\Models\Chamber;
use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\User;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PrescriptionController extends Controller
{
    /** GET /public/prescriptions/{prescription} */
    public function publicShow(Prescription $prescription): Response
    {
        $prescription->load([
            'appointment:id,appointment_date,appointment_time,status',
            'doctor:id,user_id,specialization,degree',
            'doctor.user:id,name,email,phone',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ]);

        $chamber = $prescription->doctor_id
            ? Chamber::where('doctor_id', $prescription->doctor_id)->where('is_active', true)->first()
              ?? Chamber::where('doctor_id', $prescription->doctor_id)->first()
            : null;

        return Inertia::render('public/PrescriptionShow', [
            'prescription' => [
                'id'               => $prescription->id,
                'uuid'             => $prescription->uuid,
                'created_at'       => $prescription->created_at?->toDateTimeString(),
                'diagnosis'        => $prescription->diagnosis,
                'medications'      => $prescription->medications,
                'dose'             => $prescription->dose,
                'instructions'     => $prescription->instructions,
                'tests'            => $prescription->tests,
                'investigation_items' => $prescription->investigationItems->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'note' => $item->note,
                    'sort_order' => $item->sort_order,
                ])->values(),
                'next_visit_date'  => $prescription->next_visit_date?->format('Y-m-d'),
                'visit_type'       => $prescription->visit_type,
                'template_type'    => $prescription->template_type,
                'specialty_data'   => $prescription->specialty_data,
                'patient_name'     => $prescription->patient_name,
                'patient_contact'  => $prescription->patient_contact,
                'patient_age'      => $prescription->patient_age,
                'patient_age_unit' => $prescription->patient_age_unit ?? 'years',
                'patient_gender'   => $prescription->patient_gender,
                'patient_weight'   => $prescription->patient_weight,
                'appointment' => $prescription->appointment ? [
                    'appointment_date' => $prescription->appointment->appointment_date?->toDateString(),
                    'appointment_time' => substr((string) $prescription->appointment->appointment_time, 0, 5),
                    'status'           => $prescription->appointment->status,
                ] : null,
            ],
            'doctorInfo' => [
                'name'           => $prescription->doctor?->user?->name,
                'email'          => $prescription->doctor?->user?->email,
                'phone'          => $prescription->doctor?->user?->phone,
                'specialization' => $prescription->doctor?->specialization,
                'degree'         => $prescription->doctor?->degree,
            ],
            'chamberInfo' => $chamber ? [
                'name'     => $chamber->name,
                'location' => $chamber->location,
                'phone'    => $chamber->phone,
            ] : null,
        ]);
    }

    // ── Doctor ────────────────────────────────────────────────────────────────

    /** GET /doctor/prescriptions */
    public function doctorIndex(): Response
    {
        /** @var User $doctor */
        $doctor = Auth::user();
        $doctorId = $doctor->doctorId();

        $prescriptionsQuery = Prescription::with([
                'user:id,name,phone',
                'appointment:id,name,age,gender,phone,symptoms',
            ]);

        if ($doctorId) {
            $prescriptionsQuery->where('doctor_id', $doctorId);
        }

        $prescriptions = $prescriptionsQuery
            ->orderByDesc('id')
            ->paginate(10)
            ->through(fn ($p) => [
                'id'              => $p->id,
                'uuid'            => $p->uuid,
                'user_id'         => $p->user_id,
                'patient_name'    => $p->patient_name ?? $p->user?->name ?? $p->appointment?->name,
                'patient_age'     => $p->patient_age ?? $p->appointment?->age,
                'patient_gender'  => $p->patient_gender ?? $p->user?->patientProfile?->gender ?? $p->appointment?->gender,
                'patient_contact' => $p->patient_contact ?? $p->user?->phone ?? $p->appointment?->phone,
                'symptoms'        => $p->appointment?->symptoms,
                'diagnosis'       => $p->diagnosis,
                'medications'     => $p->medications,
                'instructions'    => $p->instructions,
                'tests'           => $p->tests,
                'next_visit_date' => $p->next_visit_date?->toDateString(),
                'created_at'      => $p->created_at,
            ])
            ->withQueryString();

        $allQuery = Prescription::query();
        if ($doctorId) {
            $allQuery->where('doctor_id', $doctorId);
        }
        $all = $allQuery->get(['next_visit_date']);
        $withFollowUp   = $all->filter(fn ($p) => $p->next_visit_date)->count();
        $upcomingFollowUps = $all->filter(fn ($p) => $p->next_visit_date
            && \Carbon\Carbon::parse($p->next_visit_date)->gte(now()->startOfDay())
        )->count();

        return Inertia::render('doctor/Prescriptions', [
            'prescriptions' => $prescriptions,
            'stats'         => [
                'withFollowUp'     => $withFollowUp,
                'withoutFollowUp'  => $all->count() - $withFollowUp,
                'upcomingFollowUps'=> $upcomingFollowUps,
            ],
        ]);
    }

    /** GET /doctor/prescriptions/create */
    public function doctorCreate(Request $request): Response
    {
        /** @var User $doctor */
        $doctor        = Auth::user();
        $appointmentId = $request->query('appointment_id');
        $patientId     = $request->query('patient_id') ?? $request->query('patient');
        $selectedPatient = null;
        $appointment   = null;

        if ($appointmentId) {
            $appointment = Appointment::query()
                ->with(['user:id,name,email,phone', 'user.patientProfile:user_id,age,gender,weight'])
                ->where('doctor_id', $doctor->doctorId())
                ->where('id', $appointmentId)
                ->first();

            if ($appointment) {
                $selectedPatient = [
                    'id'    => $appointment->user_id,
                    'name'  => $appointment->name ?? $appointment->user?->name,
                    'phone' => $appointment->phone ?? $appointment->user?->phone,
                    'email' => $appointment->email ?? $appointment->user?->email,
                    'gender'=> $appointment->gender ?? $appointment->user?->patientProfile?->gender,
                    'age'   => $appointment->age ?? $appointment->user?->patientProfile?->age,
                    'weight'=> $appointment->user?->patientProfile?->weight,
                ];
            }
        } elseif ($patientId) {
            $patient = User::where('id', $patientId)
                ->whereHas('role', fn ($q) => $q->where('name', 'patient'))
                ->first();

            if ($patient) {
                $patient->loadMissing('patientProfile');
                $selectedPatient = [
                    'id'    => $patient->id,
                    'name'  => $patient->name,
                    'phone' => $patient->phone,
                    'email' => $patient->email,
                    'gender'=> $patient->patientProfile?->gender,
                    'age'   => $patient->patientProfile?->age,
                    'weight'=> $patient->patientProfile?->weight,
                ];
            }
        }

        $chamber = $appointment?->chamber_id
            ? Chamber::where('doctor_id', $doctor->doctorId())->where('id', $appointment->chamber_id)->first()
            : null;

        if (! $chamber) {
            $chamber = Chamber::where('doctor_id', $doctor->doctorId())->where('is_active', true)->first()
                ?? Chamber::where('doctor_id', $doctor->doctorId())->first();
        }

        $chamberInfo = $chamber ? [
            'id'              => $chamber->id,
            'name'            => $chamber->name,
            'location'        => $chamber->location,
            'phone'           => $chamber->phone,
            'google_maps_url' => $chamber->google_maps_url,
        ] : null;

        return Inertia::render('doctor/CreatePrescription', [
            'appointmentId'   => $appointmentId ? (int) $appointmentId : null,
            'selectedPatient' => $selectedPatient,
            'chamberInfo'     => $chamberInfo,
            'doctorInfo'      => [
                'name' => $doctor->name,
                'email' => $doctor->email,
                'phone' => $doctor->phone,
                'specialization' => $doctor->doctorProfile?->specialization,
                'degree' => $doctor->doctorProfile?->degree,
            ],
        ]);
    }

    /** GET /doctor/prescriptions/{prescription} */
    public function doctorShow(Prescription $prescription): Response
    {
        /** @var User $doctor */
        $doctor   = Auth::user();
        $doctorId = $doctor->doctorId();
        if ($doctorId) {
            abort_unless($prescription->doctor_id === $doctorId, 403);
        }

        $prescription->load([
            'user:id,name,email,phone',
            'appointment:id,appointment_date,appointment_time,status,name,age,gender,phone,email',
            'investigationItems:id,prescription_id,name,note,sort_order',
            'reports:id,prescription_id,title,original_name,file_path,mime_type,file_size,note,report_text,created_at',
        ]);

        $prescription->user?->loadMissing('patientProfile');

        $chamber = $doctorId ? Chamber::where('doctor_id', $doctorId)->where('is_active', true)->first() : null;

        return Inertia::render('doctor/PrescriptionShow', [
            'prescription' => [
                'id'               => $prescription->id,
                'uuid'             => $prescription->uuid,
                'appointment_id'   => $prescription->appointment_id,
                'created_at'       => $prescription->created_at?->toDateTimeString(),
                'diagnosis'        => $prescription->diagnosis,
                'medications'      => $prescription->medications,
                'dose'             => $prescription->dose,
                'instructions'     => $prescription->instructions,
                'tests'            => $prescription->tests,
                'investigation_items' => $prescription->investigationItems->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'note' => $item->note,
                    'sort_order' => $item->sort_order,
                ])->values(),
                'next_visit_date'  => $prescription->next_visit_date?->format('Y-m-d'),
                'visit_type'       => $prescription->visit_type,
                'template_type'    => $prescription->template_type,
                'specialty_data'   => $prescription->specialty_data,
                'patient_name'     => $prescription->appointment?->name ?? $prescription->patient_name,
                'patient_contact'  => $prescription->appointment?->phone ?? $prescription->patient_contact,
                'patient_age'      => $prescription->appointment?->age ?? $prescription->patient_age,
                'patient_age_unit' => $prescription->patient_age_unit ?? 'years',
                'patient_gender'   => $prescription->appointment?->gender ?? $prescription->patient_gender,
                'patient_weight'   => $prescription->patient_weight ?? $prescription->user?->patientProfile?->weight,
                'user'             => $prescription->user ? [
                    'id'      => $prescription->user->id,
                    'name'    => $prescription->user->name,
                    'email'   => $prescription->user->email,
                    'phone'   => $prescription->user->phone,
                    'address' => $prescription->user->patientProfile?->address,
                    'gender'  => $prescription->user->patientProfile?->gender,
                    'weight'  => $prescription->user->patientProfile?->weight,
                ] : null,
                'appointment' => $prescription->appointment ? [
                    'appointment_date' => (string) $prescription->appointment->appointment_date,
                    'appointment_time' => substr((string) $prescription->appointment->appointment_time, 0, 5),
                    'status'           => $prescription->appointment->status,
                ] : null,
            ],
            'chamberInfo' => $chamber ? [
                'name'     => $chamber->name,
                'location' => $chamber->location,
                'phone'    => $chamber->phone,
            ] : null,
            'medicines' => Medicine::orderBy('name')->get(['id', 'name', 'strength']),
            'reports' => $prescription->reports
                ->sortByDesc('id')
                ->values()
                ->map(fn ($report) => [
                    'id' => $report->id,
                    'title' => $report->title,
                    'original_name' => $report->original_name,
                    'file_url' => $report->file_path ? asset('storage/'.$report->file_path) : null,
                    'mime_type' => $report->mime_type,
                    'file_size' => $report->file_size,
                    'note' => $report->note,
                    'report_text' => $report->report_text,
                    'created_at' => $report->created_at?->toDateTimeString(),
                ]),
        ]);
    }

    /** GET /doctor/prescriptions/{prescription}/edit */
    public function doctorEdit(Prescription $prescription): Response
    {
        /** @var User $doctor */
        $doctor   = Auth::user();
        $doctorId = $doctor->doctorId();
        if ($doctorId) {
            abort_unless($prescription->doctor_id === $doctorId, 403);
        }

        $prescription->load([
            'user:id,name,email,phone',
            'appointment:id,appointment_date,appointment_time,status,name,age,gender,phone,email',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ]);

        $prescription->user?->loadMissing('patientProfile');

        $chamber = $doctorId ? Chamber::where('doctor_id', $doctorId)->where('is_active', true)->first() : null;

        return Inertia::render('doctor/EditPrescription', [
            'prescription' => [
                'id'               => $prescription->id,
                'uuid'             => $prescription->uuid,
                'appointment_id'   => $prescription->appointment_id,
                'created_at'       => $prescription->created_at?->toDateTimeString(),
                'diagnosis'        => $prescription->diagnosis,
                'medications'      => $prescription->medications,
                'dose'             => $prescription->dose,
                'instructions'     => $prescription->instructions,
                'tests'            => $prescription->tests,
                'investigation_items' => $prescription->investigationItems->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'note' => $item->note,
                    'sort_order' => $item->sort_order,
                ])->values(),
                'next_visit_date'  => $prescription->next_visit_date?->format('Y-m-d'),
                'visit_type'       => $prescription->visit_type,
                'template_type'    => $prescription->template_type,
                'specialty_data'   => $prescription->specialty_data,
                'patient_name'     => $prescription->appointment?->name ?? $prescription->patient_name,
                'patient_contact'  => $prescription->appointment?->phone ?? $prescription->patient_contact,
                'patient_age'      => $prescription->appointment?->age ?? $prescription->patient_age,
                'patient_age_unit' => $prescription->patient_age_unit ?? 'years',
                'patient_gender'   => $prescription->appointment?->gender ?? $prescription->patient_gender,
                'patient_weight'   => $prescription->patient_weight ?? $prescription->user?->patientProfile?->weight,
                'user'             => $prescription->user ? [
                    'id'      => $prescription->user->id,
                    'name'    => $prescription->user->name,
                    'email'   => $prescription->user->email,
                    'phone'   => $prescription->user->phone,
                    'address' => $prescription->user->patientProfile?->address,
                    'gender'  => $prescription->user->patientProfile?->gender,
                    'weight'  => $prescription->user->patientProfile?->weight,
                ] : null,
                'appointment' => $prescription->appointment ? [
                    'appointment_date' => (string) $prescription->appointment->appointment_date,
                    'appointment_time' => substr((string) $prescription->appointment->appointment_time, 0, 5),
                    'status'           => $prescription->appointment->status,
                ] : null,
            ],
            'chamberInfo' => $chamber ? [
                'name'     => $chamber->name,
                'location' => $chamber->location,
                'phone'    => $chamber->phone,
            ] : null,
            'medicines' => Medicine::orderBy('name')->get(['id', 'name', 'strength']),
        ]);
    }

    /** GET /doctor/investigation-tests */
    public function doctorInvestigationTests(): Response
    {
        return Inertia::render('doctor/InvestigationTests');
    }

    /** POST /doctor/prescriptions — delegate to API controller */
    public function doctorStore(Request $request): mixed
    {
        return app(ApiPrescriptionController::class)->store($request);
    }

    /** PUT /doctor/prescriptions/{prescription} — delegate to API controller */
    public function doctorUpdate(Request $request, Prescription $prescription): mixed
    {
        return app(ApiPrescriptionController::class)->update($request, $prescription);
    }

    // ── Patient ───────────────────────────────────────────────────────────────

    /** GET /patient/prescriptions */
    public function patientIndex(): Response
    {
        $user = Auth::user();

        $prescriptions = Prescription::with([
                'user:id,name,phone',
                'appointment:id,name,age,gender,phone,symptoms',
            ])
            ->where('user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        $all = Prescription::where('user_id', $user->id)->get(['next_visit_date']);

        $withFollowUp      = $all->filter(fn ($p) => $p->next_visit_date)->count();
        $upcomingFollowUps = $all->filter(fn ($p) => $p->next_visit_date
            && \Carbon\Carbon::parse($p->next_visit_date)->gte(now()->startOfDay())
        )->count();

        return Inertia::render('user/Prescriptions', [
            'prescriptions' => $prescriptions->through(fn ($p) => [
                'id'              => $p->id,
                'uuid'            => $p->uuid,
                'user_id'         => $p->user_id,
                'patient_name'    => $p->patient_name ?? $p->user?->name ?? $p->appointment?->name,
                'patient_age'     => $p->patient_age ?? $p->appointment?->age,
                'patient_gender'  => $p->patient_gender ?? $p->user?->patientProfile?->gender ?? $p->appointment?->gender,
                'patient_contact' => $p->patient_contact ?? $p->user?->phone ?? $p->appointment?->phone,
                'symptoms'        => $p->appointment?->symptoms,
                'diagnosis'       => $p->diagnosis,
                'medications'     => $p->medications,
                'instructions'    => $p->instructions,
                'tests'           => $p->tests,
                'follow_up_date'  => $p->next_visit_date?->toDateString(),
                'created_at'      => $p->created_at,
                'user'            => $p->user ? ['name' => $p->user->name, 'phone' => $p->user->phone] : null,
            ]),
            'stats' => [
                'withFollowUp'      => $withFollowUp,
                'withoutFollowUp'   => $all->count() - $withFollowUp,
                'upcomingFollowUps' => $upcomingFollowUps,
            ],
        ]);
    }

    /** GET /patient/prescriptions/{prescription} */
    public function patientShow(Prescription $prescription): Response
    {
        $user = Auth::user();

        // Allow access only if this prescription belongs to the authenticated patient user.
        abort_unless($prescription->user_id === $user->id, 403);

        $prescription->load([
            'appointment:id,appointment_date,appointment_time,status',
            'doctor:id,user_id,specialization,degree',
            'doctor.user:id,name,email,phone',
            'investigationItems:id,prescription_id,name,note,sort_order',
        ]);

        $chamber = $prescription->doctor_id
            ? Chamber::where('doctor_id', $prescription->doctor_id)->where('is_active', true)->first()
              ?? Chamber::where('doctor_id', $prescription->doctor_id)->first()
            : null;

        return Inertia::render('user/PrescriptionShow', [
            'prescription' => [
                'id'               => $prescription->id,
                'uuid'             => $prescription->uuid,
                'created_at'       => $prescription->created_at?->toDateTimeString(),
                'diagnosis'        => $prescription->diagnosis,
                'medications'      => $prescription->medications,
                'dose'             => $prescription->dose,
                'instructions'     => $prescription->instructions,
                'tests'            => $prescription->tests,
                'investigation_items' => $prescription->investigationItems->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'note' => $item->note,
                    'sort_order' => $item->sort_order,
                ])->values(),
                'next_visit_date'  => $prescription->next_visit_date?->format('Y-m-d'),
                'visit_type'       => $prescription->visit_type,
                'template_type'    => $prescription->template_type,
                'specialty_data'   => $prescription->specialty_data,
                'patient_name'     => $prescription->patient_name ?? $user->name,
                'patient_contact'  => $prescription->patient_contact ?? $user->phone,
                'patient_age'      => $prescription->patient_age,
                'patient_age_unit' => $prescription->patient_age_unit ?? 'years',
                'patient_gender'   => $prescription->patient_gender,
                'patient_weight'   => $prescription->patient_weight,
                'appointment' => $prescription->appointment ? [
                    'appointment_date' => $prescription->appointment->appointment_date?->toDateString(),
                    'appointment_time' => substr((string) $prescription->appointment->appointment_time, 0, 5),
                    'status'           => $prescription->appointment->status,
                ] : null,
            ],
            'doctorInfo' => [
                'name'           => $prescription->doctor?->user?->name,
                'email'          => $prescription->doctor?->user?->email,
                'phone'          => $prescription->doctor?->user?->phone,
                'specialization' => $prescription->doctor?->specialization,
                'degree'         => $prescription->doctor?->degree,
            ],
            'chamberInfo' => $chamber ? [
                'name'     => $chamber->name,
                'location' => $chamber->location,
                'phone'    => $chamber->phone,
            ] : null,
        ]);
    }

    // ── Compounder ──────────────────────────────────────────────────────────

    /** GET /compounder/prescriptions */
    public function compoundIndex(): Response
    {
        $prescriptions = Prescription::with(['user:id,name,email', 'doctor:id,name'])
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('admin/Prescriptions', [
            'prescriptions' => $prescriptions,
        ]);
    }

    /** GET /compounder/prescriptions/{prescription} */
    public function compoundShow(Prescription $prescription): Response
    {
        $prescription->load([
            'user:id,name,email,phone',
            'doctor:id,name,email',
        ]);

        $contactInfo = \App\Models\SiteContent::where('key', 'contact')->first();

        return Inertia::render('admin/PrescriptionShow', [
            'prescription' => $prescription,
            'contactInfo'  => $contactInfo,
        ]);
    }
}
