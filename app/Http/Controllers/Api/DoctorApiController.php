<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorApiController extends Controller
{
    public function appointments(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $appointments = Appointment::with(['user:id,name', 'prescription:id,appointment_id'])
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('appointment_date')
            ->orderByDesc('appointment_time')
            ->get(['id','user_id','appointment_date','appointment_time','status','symptoms','name','phone','email','age','gender','is_guest']);

        return response()->json([
            'appointments' => $appointments->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'is_guest' => $a->is_guest,
                // Show user info if registered, otherwise show guest info
                'patient_name' => $a->user?->name ?? $a->name,
                'patient_phone' => $a->user?->phone ?? $a->phone,
                'patient_email' => $a->user?->email ?? $a->email,
                'patient_age' => $a->age,
                'patient_gender' => $a->gender,
                'user' => $a->user ? ['id' => $a->user->id, 'name' => $a->user->name] : null,
                'appointment_date' => $a->appointment_date?->toDateString() ?? (string) $a->appointment_date,
                'appointment_time' => substr((string) $a->appointment_time, 0, 5),
                'status' => $a->status,
                'symptoms' => $a->symptoms,
                'has_prescription' => $a->prescription !== null,
                'prescription_id' => $a->prescription?->id,
            ])->values(),
        ]);
    }

    public function schedule(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $schedules = DoctorSchedule::where('doctor_id', $doctor->id)
            ->orderBy('day_of_week')
            ->get(['day_of_week', 'start_time', 'end_time', 'slot_minutes', 'is_closed']);

        $ranges = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get(['day_of_week', 'start_time', 'end_time'])
            ->groupBy('day_of_week');

        $byDay = $schedules->keyBy('day_of_week');
        $payload = [];
        for ($dow = 0; $dow <= 6; $dow++) {
            $row = $byDay->get($dow);

            $dayRanges = $ranges->get($dow, collect())
                ->map(fn ($r) => [
                    'start_time' => $r->start_time ? substr((string) $r->start_time, 0, 5) : null,
                    'end_time' => $r->end_time ? substr((string) $r->end_time, 0, 5) : null,
                ])
                ->filter(fn ($r) => $r['start_time'] && $r['end_time'])
                ->values()
                ->toArray();

            if (count($dayRanges) === 0 && $row?->start_time && $row?->end_time && !($row?->is_closed ?? false)) {
                $dayRanges = [[
                    'start_time' => substr((string) $row->start_time, 0, 5),
                    'end_time' => substr((string) $row->end_time, 0, 5),
                ]];
            }

            $payload[] = [
                'day_of_week' => $dow,
                'slot_minutes' => $row?->slot_minutes ?? 30,
                'is_closed' => $row?->is_closed ?? ($dow === 0),
                'ranges' => $dayRanges,
            ];
        }

        $unavailableRanges = DoctorUnavailableRange::where('doctor_id', $doctor->id)
            ->orderBy('start_date')
            ->orderBy('end_date')
            ->get(['start_date', 'end_date'])
            ->map(fn ($r) => [
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
            ])
            ->values();

        return response()->json([
            'schedule' => $payload,
            'unavailable_ranges' => $unavailableRanges,
        ]);
    }

    public function prescriptions(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $rows = Prescription::with('user:id,name')
            ->where('doctor_id', $doctor->id)
            ->orderByDesc('created_at')
            ->get(['id','appointment_id','user_id','diagnosis','medications','instructions','tests','next_visit_date','created_at']);

        return response()->json([
            'prescriptions' => $rows->map(fn ($p) => [
                'id' => $p->id,
                'appointment_id' => $p->appointment_id,
                'user_id' => $p->user_id,
                'user' => $p->user ? ['id' => $p->user->id, 'name' => $p->user->name] : null,
                'diagnosis' => $p->diagnosis,
                'medications' => $p->medications,
                'instructions' => $p->instructions,
                'tests' => $p->tests,
                'next_visit_date' => $p->next_visit_date?->toDateString(),
                'created_at' => $p->created_at?->toDateTimeString(),
            ])->values(),
        ]);
    }

    public function prescriptionShow(Request $request, Prescription $prescription): JsonResponse
    {
        $doctor = $request->user();

        $p = Prescription::with([
            'user:id,name',
            'appointment:id,appointment_date,appointment_time,status',
        ])
            ->where('doctor_id', $doctor->id)
            ->where('id', $prescription->id)
            ->firstOrFail();

        return response()->json([
            'prescription' => [
                'id' => $p->id,
                'appointment_id' => $p->appointment_id,
                'created_at' => $p->created_at?->toDateTimeString(),
                'diagnosis' => $p->diagnosis,
                'medications' => $p->medications,
                'instructions' => $p->instructions,
                'tests' => $p->tests,
                'next_visit_date' => $p->next_visit_date?->toDateString(),
                'user' => $p->user ? ['id' => $p->user->id, 'name' => $p->user->name] : null,
                'appointment' => $p->appointment ? [
                    'appointment_date' => (string) $p->appointment->appointment_date,
                    'appointment_time' => substr((string) $p->appointment->appointment_time, 0, 5),
                    'status' => $p->appointment->status,
                ] : null,
            ],
        ]);
    }
}
