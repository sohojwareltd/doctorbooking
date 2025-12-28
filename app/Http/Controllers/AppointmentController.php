<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    /**
     * Public endpoint: get the configured doctor's unavailable date ranges.
     */
    public function getDoctorUnavailableRanges(): JsonResponse
    {
        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json(['ranges' => [], 'closed_weekdays' => [0, 1, 2, 3, 4, 5, 6]]);
        }

        $ranges = DoctorUnavailableRange::where('doctor_id', $doctor->id)
            ->orderBy('start_date')
            ->orderBy('end_date')
            ->get(['start_date', 'end_date'])
            ->map(fn ($r) => [
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
            ])
            ->values()
            ->toArray();

        $schedules = DoctorSchedule::where('doctor_id', $doctor->id)
            ->get(['day_of_week', 'start_time', 'end_time', 'is_closed'])
            ->keyBy('day_of_week');

        $rangeDays = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->distinct()
            ->pluck('day_of_week')
            ->map(fn ($d) => (int) $d)
            ->toArray();

        $closedWeekdays = [];
        for ($dow = 0; $dow <= 6; $dow++) {
            $row = $schedules->get($dow);
            $isClosed = (bool) ($row?->is_closed ?? false);
            $hasRanges = in_array($dow, $rangeDays, true);
            $hasLegacyRange = !$isClosed && $row?->start_time && $row?->end_time;

            $isOpen = !$isClosed && ($hasRanges || $hasLegacyRange);
            if (!$isOpen) {
                $closedWeekdays[] = $dow;
            }
        }

        return response()->json(['ranges' => $ranges, 'closed_weekdays' => $closedWeekdays]);
    }

    /**
     * Store a public booking request (no auth required).
     */
    public function storePublic(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['required', 'email', 'max:255'],
            'date' => ['required', 'date'],
            'time' => ['required', 'string'],
            'message' => ['nullable', 'string', 'max:2000'],
        ]);

        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            $message = 'No doctor is configured yet. Please contact support.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 422);
            }

            return back()->withErrors(['booking' => $message])->withInput();
        }

        $dateString = now()->parse($validated['date'])->toDateString();
        $isUnavailable = DoctorUnavailableRange::where('doctor_id', $doctor->id)
            ->whereDate('start_date', '<=', $dateString)
            ->whereDate('end_date', '>=', $dateString)
            ->exists();

        if ($isUnavailable) {
            $message = 'Doctor is unavailable on the selected date. Please choose another date.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 422);
            }

            return back()->withErrors(['booking' => $message])->withInput();
        }

        $user = User::where('email', $validated['email'])->first();
        if (!$user) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make(Str::random(16)),
                'role' => 'user',
                'phone' => $validated['phone'],
            ]);
        }

        $time = $validated['time'];
        if (preg_match('/^\d{2}:\d{2}$/', $time) === 1) {
            $time .= ':00';
        }

        Appointment::create([
            'user_id' => $user->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => $dateString,
            'appointment_time' => $time,
            'status' => 'pending',
            'symptoms' => $validated['message'] ?? null,
            'notes' => null,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Your appointment request has been submitted. We will contact you shortly.',
            ]);
        }

        return back()->with('success', 'Your appointment request has been submitted. We will contact you shortly.');
    }

    /**
     * Get available time slots for a specific date.
     */
    public function getAvailableSlots(Request $request, string $date): JsonResponse
    {
        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json([
                'slots' => [],
                'all' => [],
                'booked' => [],
                'closed' => true,
                'date' => $date,
            ]);
        }

        try {
            $carbon = now()->parse($date);
        } catch (\Throwable $e) {
            return response()->json([
                'slots' => [],
                'all' => [],
                'booked' => [],
                'closed' => true,
                'date' => $date,
            ]);
        }

        $isUnavailable = DoctorUnavailableRange::where('doctor_id', $doctor->id)
            ->whereDate('start_date', '<=', $carbon->toDateString())
            ->whereDate('end_date', '>=', $carbon->toDateString())
            ->exists();

        if ($isUnavailable) {
            return response()->json([
                'slots' => [],
                'all' => [],
                'booked' => [],
                'closed' => true,
                'date' => $date,
            ]);
        }

        $dow = $carbon->dayOfWeek; // 0=Sun ... 6=Sat
        $schedule = DoctorSchedule::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->first();

        $ranges = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->orderBy('start_time')
            ->get(['start_time', 'end_time']);

        if (!$schedule && $ranges->count() === 0) {
            return response()->json([
                'slots' => [],
                'all' => [],
                'booked' => [],
                'closed' => true,
                'date' => $date,
            ]);
        }

        $isClosed = $schedule?->is_closed ?? false;
        $slotMinutes = $schedule?->slot_minutes ?? 30;

        if ($isClosed || $slotMinutes <= 0) {
            return response()->json([
                'slots' => [],
                'all' => [],
                'booked' => [],
                'closed' => true,
                'date' => $date,
            ]);
        }

        // If no explicit ranges are configured, fall back to the legacy single range.
        if ($ranges->count() === 0) {
            $start = $schedule?->start_time ? substr((string) $schedule->start_time, 0, 5) : '09:00';
            $end = $schedule?->end_time ? substr((string) $schedule->end_time, 0, 5) : '17:00';
            if (!$start || !$end) {
                return response()->json([
                    'slots' => [],
                    'all' => [],
                    'booked' => [],
                    'closed' => false,
                    'date' => $date,
                ]);
            }
            $ranges = collect([(object) ['start_time' => $start . ':00', 'end_time' => $end . ':00']]);
        }

        $slotMap = [];
        foreach ($ranges as $range) {
            $start = $range->start_time ? substr((string) $range->start_time, 0, 5) : null;
            $end = $range->end_time ? substr((string) $range->end_time, 0, 5) : null;
            if (!$start || !$end) {
                continue;
            }

            $startAt = now()->parse($date . ' ' . $start);
            $endAt = now()->parse($date . ' ' . $end);
            if ($endAt->lt($startAt)) {
                continue;
            }

            $cursor = $startAt->copy();
            while ($cursor->lte($endAt)) {
                $slotMap[$cursor->format('H:i')] = true;
                $cursor->addMinutes($slotMinutes);
            }
        }

        $allSlots = array_keys($slotMap);
        sort($allSlots);

        $bookedSlots = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $date)
            ->pluck('appointment_time')
            ->map(fn ($time) => substr((string) $time, 0, 5))
            ->toArray();

        $availableSlots = array_values(array_diff($allSlots, $bookedSlots));
        $bookedUnique = array_values(array_unique($bookedSlots));
        $bookedInSchedule = array_values(array_intersect($allSlots, $bookedUnique));
        sort($bookedInSchedule);

        return response()->json([
            'slots' => $availableSlots,
            'all' => $allSlots,
            'booked' => $bookedInSchedule,
            'closed' => false,
            'date' => $date,
        ]);
    }

    /**
     * Update appointment status (doctor/admin only).
     */
    public function updateStatus(Request $request, Appointment $appointment): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['pending', 'approved', 'completed', 'cancelled'])],
        ]);

        $user = Auth::user();
        if (!$user || !in_array($user->role, ['doctor', 'admin'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $appointment->update(['status' => $validated['status']]);

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment status updated.',
        ]);
    }
}
