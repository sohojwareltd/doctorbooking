<?php

namespace App\Http\Controllers;

use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
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

        $ranges = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get(['day_of_week', 'start_time', 'end_time'])
            ->groupBy('day_of_week');

        // Ensure all 7 days exist in the payload
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

            // Backward compatibility: if no explicit ranges exist, fall back to the legacy single range.
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
            'schedule.*.slot_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'schedule.*.ranges' => ['nullable', 'array'],
            'schedule.*.ranges.*.start_time' => ['required_with:schedule.*.ranges', 'date_format:H:i'],
            'schedule.*.ranges.*.end_time' => ['required_with:schedule.*.ranges', 'date_format:H:i'],
        ]);

        foreach ($validated['schedule'] as $row) {
            $isClosed = (bool) $row['is_closed'];
            $dow = (int) $row['day_of_week'];

            $ranges = [];
            if (!$isClosed) {
                $ranges = array_values(array_filter($row['ranges'] ?? [], fn ($r) => !empty($r['start_time']) && !empty($r['end_time'])));

                // Validate each range quickly (end must be after start).
                foreach ($ranges as $idx => $range) {
                    $startAt = now()->parse('2000-01-01 ' . $range['start_time']);
                    $endAt = now()->parse('2000-01-01 ' . $range['end_time']);
                    if ($endAt->lte($startAt)) {
                        return response()->json([
                            'message' => 'Invalid time range: end time must be after start time.',
                            'errors' => [
                                "schedule.$dow.ranges.$idx" => ['End time must be after start time.'],
                            ],
                        ], 422);
                    }
                }
            }

            // Keep legacy columns populated with the first range (for compatibility).
            $firstStart = (!$isClosed && isset($ranges[0]['start_time'])) ? ($ranges[0]['start_time'] . ':00') : null;
            $firstEnd = (!$isClosed && isset($ranges[0]['end_time'])) ? ($ranges[0]['end_time'] . ':00') : null;

            DoctorSchedule::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $dow,
                ],
                [
                    'is_closed' => $isClosed,
                    'start_time' => $firstStart,
                    'end_time' => $firstEnd,
                    'slot_minutes' => (int) $row['slot_minutes'],
                ]
            );

            // Replace ranges for this day.
            DoctorScheduleRange::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow)
                ->delete();

            if (!$isClosed) {
                foreach ($ranges as $range) {
                    DoctorScheduleRange::create([
                        'doctor_id' => $doctor->id,
                        'day_of_week' => $dow,
                        'start_time' => $range['start_time'] . ':00',
                        'end_time' => $range['end_time'] . ':00',
                    ]);
                }
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule saved.',
        ]);
    }
}
