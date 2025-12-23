<?php

namespace App\Http\Controllers;

use App\Models\DoctorSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DoctorScheduleController extends Controller
{
    public function show(): Response
    {
        $doctor = Auth::user();

        $schedules = DoctorSchedule::where('doctor_id', $doctor->id)
            ->orderBy('day_of_week')
            ->get(['day_of_week', 'start_time', 'end_time', 'slot_minutes', 'is_closed']);

        // Ensure all 7 days exist in the payload
        $byDay = $schedules->keyBy('day_of_week');
        $payload = [];
        for ($dow = 0; $dow <= 6; $dow++) {
            $row = $byDay->get($dow);
            $payload[] = [
                'day_of_week' => $dow,
                'start_time' => $row?->start_time ? substr((string) $row->start_time, 0, 5) : '09:00',
                'end_time' => $row?->end_time ? substr((string) $row->end_time, 0, 5) : '17:00',
                'slot_minutes' => $row?->slot_minutes ?? 30,
                'is_closed' => $row?->is_closed ?? ($dow === 0),
            ];
        }

        return Inertia::render('doctor/Schedule', [
            'schedule' => $payload,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $doctor = Auth::user();

        $validated = $request->validate([
            'schedule' => ['required', 'array', 'size:7'],
            'schedule.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'schedule.*.is_closed' => ['required', 'boolean'],
            'schedule.*.start_time' => ['nullable', 'date_format:H:i'],
            'schedule.*.end_time' => ['nullable', 'date_format:H:i'],
            'schedule.*.slot_minutes' => ['required', 'integer', 'min:5', 'max:240'],
        ]);

        foreach ($validated['schedule'] as $row) {
            $isClosed = (bool) $row['is_closed'];
            $start = $isClosed ? null : ($row['start_time'] ?? null);
            $end = $isClosed ? null : ($row['end_time'] ?? null);

            DoctorSchedule::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'day_of_week' => (int) $row['day_of_week'],
                ],
                [
                    'is_closed' => $isClosed,
                    'start_time' => $start ? ($start . ':00') : null,
                    'end_time' => $end ? ($end . ':00') : null,
                    'slot_minutes' => (int) $row['slot_minutes'],
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule saved.',
        ]);
    }
}
