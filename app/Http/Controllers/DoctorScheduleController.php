<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\Chamber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DoctorScheduleController extends Controller
{
    public function show(Request $request): Response
    {
        $doctor = Auth::user();

        $chambers = Chamber::where('doctor_id', $doctor->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        $selectedChamberId = $request->query('chamber_id');
        if ($selectedChamberId !== null && $selectedChamberId !== '') {
            $selectedChamberId = (int) $selectedChamberId;
            if (!$chambers->firstWhere('id', $selectedChamberId)) {
                $selectedChamberId = null;
            }
        } else {
            $selectedChamberId = null;
        }

        $rangeQuery = DoctorScheduleRange::where('doctor_id', $doctor->id);
        if ($selectedChamberId) {
            $rangeQuery->where('chamber_id', $selectedChamberId);
        } else {
            $rangeQuery->whereNull('chamber_id');
        }

        $schedules = DoctorSchedule::where('doctor_id', $doctor->id)
            ->orderBy('day_of_week')
            ->get(['day_of_week', 'start_time', 'end_time', 'slot_minutes', 'is_closed']);

        $ranges = $rangeQuery
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

        $unavailableRanges = DoctorUnavailableRange::where('doctor_id', $doctor->id)
            ->orderBy('start_date')
            ->orderBy('end_date')
            ->get(['start_date', 'end_date'])
            ->map(fn ($r) => [
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
            ])
            ->toArray();

        return Inertia::render('doctor/Schedule', [
            'schedule' => $payload,
            'unavailable_ranges' => $unavailableRanges,
            'chambers' => $chambers,
            'current_chamber_id' => $selectedChamberId,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $doctor = $request->user();

        $validated = $request->validate([
            'chamber_id' => ['nullable', 'integer'],
            'schedule' => ['required', 'array', 'size:7'],
            'schedule.*.day_of_week' => ['required', 'integer', 'min:0', 'max:6'],
            'schedule.*.is_closed' => ['required', 'boolean'],
            'schedule.*.slot_minutes' => ['required', 'integer', 'min:5', 'max:240'],
            'schedule.*.ranges' => ['nullable', 'array'],
            'schedule.*.ranges.*.start_time' => ['required_with:schedule.*.ranges', 'date_format:H:i'],
            'schedule.*.ranges.*.end_time' => ['required_with:schedule.*.ranges', 'date_format:H:i'],

            'unavailable_ranges' => ['nullable', 'array'],
            'unavailable_ranges.*.start_date' => ['required_with:unavailable_ranges', 'date_format:Y-m-d'],
            'unavailable_ranges.*.end_date' => ['required_with:unavailable_ranges', 'date_format:Y-m-d'],
        ]);

        $chamberId = $validated['chamber_id'] ?? null;
        if ($chamberId) {
            $ownsChamber = Chamber::where('doctor_id', $doctor->id)
                ->where('id', $chamberId)
                ->exists();
            if (!$ownsChamber) {
                return response()->json(['message' => 'Invalid chamber.'], 422);
            }
        }

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

            // Replace ranges for this day and chamber (or default).
            DoctorScheduleRange::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow)
                ->where(function ($q) use ($chamberId) {
                    if ($chamberId) {
                        $q->where('chamber_id', $chamberId);
                    } else {
                        $q->whereNull('chamber_id');
                    }
                })
                ->delete();

            if (!$isClosed) {
                foreach ($ranges as $range) {
                    DoctorScheduleRange::create([
                        'doctor_id' => $doctor->id,
                        'day_of_week' => $dow,
                        'chamber_id' => $chamberId,
                        'start_time' => $range['start_time'] . ':00',
                        'end_time' => $range['end_time'] . ':00',
                    ]);
                }
            }
        }

        $incomingUnavailable = array_values(array_filter($validated['unavailable_ranges'] ?? [], fn ($r) => !empty($r['start_date']) && !empty($r['end_date'])));

        $warning = null;

        foreach ($incomingUnavailable as $idx => $range) {
            $start = now()->parse($range['start_date'])->startOfDay();
            $end = now()->parse($range['end_date'])->startOfDay();
            if ($end->lt($start)) {
                return response()->json([
                    'message' => 'Invalid date range: end date must be on or after start date.',
                    'errors' => [
                        "unavailable_ranges.$idx" => ['End date must be on or after start date.'],
                    ],
                ], 422);
            }
        }

        if (count($incomingUnavailable) > 0) {
            $existingCount = Appointment::where('doctor_id', $doctor->id)
                ->where('status', '!=', 'cancelled')
                ->whereDate('appointment_date', '>=', now()->toDateString())
                ->where(function ($q) use ($incomingUnavailable) {
                    foreach ($incomingUnavailable as $range) {
                        $q->orWhereBetween('appointment_date', [$range['start_date'], $range['end_date']]);
                    }
                })
                ->count();

            if ($existingCount > 0) {
                $warning = $existingCount . ' existing appointment(s) fall within your unavailable date ranges. New bookings will be blocked for those dates.';
            }
        }

        DoctorUnavailableRange::where('doctor_id', $doctor->id)->delete();

        foreach ($incomingUnavailable as $range) {
            DoctorUnavailableRange::create([
                'doctor_id' => $doctor->id,
                'start_date' => $range['start_date'],
                'end_date' => $range['end_date'],
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Schedule saved.',
            'warning' => $warning,
        ]);
    }
}
