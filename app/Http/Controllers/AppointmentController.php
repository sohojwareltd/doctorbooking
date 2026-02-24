<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Chamber;
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
            ->get(['day_of_week', 'is_closed']);

        $closedWeekdays = [];
        for ($dow = 0; $dow <= 6; $dow++) {
            $rowsForDay = $schedules->where('day_of_week', $dow);
            if ($rowsForDay->count() === 0) {
                $closedWeekdays[] = $dow;
                continue;
            }

            $hasOpen = $rowsForDay->contains(fn ($r) => !$r->is_closed);
            if (!$hasOpen) {
                $closedWeekdays[] = $dow;
            }
        }

        return response()->json(['ranges' => $ranges, 'closed_weekdays' => $closedWeekdays]);
    }

    /**
     * Store a public booking request (no auth required - guest booking).
     */
    public function storePublic(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            // Email is optional for public bookings – only name & phone are required.
            'email' => ['nullable', 'email', 'max:255'],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender' => ['nullable', 'in:male,female,other'],
            'date' => ['required', 'date'],
            // Time is optional – when omitted, we will calculate the next
            // available slot from the doctor's schedule and existing count.
            'time' => ['nullable', 'string'],
            'message' => ['nullable', 'string', 'max:2000'],
            // Optional chamber selection (per‑chamber serials when provided)
            'chamber_id' => ['nullable', 'integer', 'exists:chambers,id'],
            // Optional simple captcha fields (enforced for flows that send them)
            'captcha_token' => ['nullable', 'string'],
            'captcha_answer' => ['nullable', 'string'],
        ]);

        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            $message = 'No doctor is configured yet. Please contact support.';

            if ($request->expectsJson()) {
                return response()->json(['message' => $message], 422);
            }

            return back()->withErrors(['booking' => $message])->withInput();
        }

        // If a chamber is provided, ensure it belongs to this doctor and is active.
        $chamber = null;
        if (!empty($validated['chamber_id'])) {
            $chamber = Chamber::where('id', $validated['chamber_id'])
                ->where('doctor_id', $doctor->id)
                ->where('is_active', true)
                ->first();

            if (!$chamber) {
                $message = 'The selected chamber is not available. Please choose another chamber.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 422);
                }

                return back()->withErrors(['booking' => $message])->withInput();
            }
        }

        // Optional lightweight captcha: if the frontend sends both fields, enforce validation.
        $captchaToken = $validated['captcha_token'] ?? null;
        $captchaAnswer = $validated['captcha_answer'] ?? null;
        if ($captchaToken !== null || $captchaAnswer !== null) {
            $expected = session('booking_captcha_' . $captchaToken);
            // One‑time use token
            session()->forget('booking_captcha_' . $captchaToken);

            $isValidCaptcha = $expected !== null && trim((string) $captchaAnswer) === (string) $expected;

            if (!$isValidCaptcha) {
                $message = 'Captcha answer is incorrect. Please try again.';

                if ($request->expectsJson()) {
                    return response()->json(['message' => $message], 422);
                }

                return back()->withErrors(['captcha' => $message])->withInput();
            }
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

        // Check if user exists (optional - user can book as guest).
        // Only attempt lookup when an email was provided.
        $userEmail = $validated['email'] ?? null;
        $user = $userEmail ? User::where('email', $userEmail)->first() : null;

        $time = $validated['time'] ?? null;

        // Determine serial number and estimated start time for this date.
        // When a chamber is selected, serials are per doctor + chamber + date.
        $existingQuery = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $dateString);

        if ($chamber) {
            $existingQuery->where('chamber_id', $chamber->id);
        }

        $existingCount = $existingQuery->count();
        $serial = $existingCount + 1;

        // If a specific time was supplied (e.g. from internal admin/user
        // booking flows), use it as the base. Otherwise, compute the next
        // available time from the doctor's schedule and slot size.
        if ($time && preg_match('/^\d{2}:\d{2}$/', $time) === 1) {
            $time .= ':00';
        }

        if (!$time) {
            $carbon = now()->parse($dateString);
            $dow = $carbon->dayOfWeek; // 0=Sun..6=Sat

            // Prefer chamber-specific schedule if available, otherwise use default (no chamber).
            $scheduleQuery = DoctorSchedule::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow);
            $rangeQuery = DoctorScheduleRange::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow);

            if ($chamber) {
                $schedule = (clone $scheduleQuery)->where('chamber_id', $chamber->id)->first()
                    ?: (clone $scheduleQuery)->whereNull('chamber_id')->first();
                $ranges = (clone $rangeQuery)->where('chamber_id', $chamber->id)->orderBy('start_time')->get(['start_time', 'end_time']);
                if ($ranges->count() === 0) {
                    $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
                }
            } else {
                $schedule = $scheduleQuery->whereNull('chamber_id')->first();
                $ranges = $rangeQuery->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
            }

            $slotMinutes = $schedule?->slot_minutes ?? 30;

            // Use the first configured range, or sensible defaults.
            if ($ranges->count() > 0) {
                $firstRange = $ranges->first();
                $startBase = substr((string) $firstRange->start_time, 0, 5);
            } else {
                $startBase = $schedule?->start_time
                    ? substr((string) $schedule->start_time, 0, 5)
                    : '09:00';
            }

            $startAt = now()->parse($dateString . ' ' . $startBase . ':00');
            $estimatedAt = $startAt->copy()->addMinutes($slotMinutes * ($serial - 1));
        } else {
            $estimatedAt = now()->parse($dateString . ' ' . $time);
        }

        $appointmentTime = $estimatedAt->format('H:i:s');

        $appointment = Appointment::create([
            'user_id' => $user?->id,  // NULL if guest, user ID if registered
            'doctor_id' => $doctor->id,
            'chamber_id' => $chamber?->id,
            'appointment_date' => $dateString,
            'appointment_time' => $appointmentTime,
            'serial_no' => $serial,
            'estimated_start_time' => $estimatedAt->format('H:i:s'),
            'status' => 'scheduled',
            'symptoms' => $validated['message'] ?? null,
            'notes' => null,
            // Guest information
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'is_guest' => !$user,  // TRUE if guest, FALSE if registered user
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'status' => 'success',
                'message' => 'Your appointment request has been submitted. We will contact you shortly.',
                'serial_no' => $appointment->serial_no,
                'estimated_time' => substr((string) $appointment->estimated_start_time, 0, 5),
            ]);
        }

        return back()->with('success', 'Your appointment request has been submitted. We will contact you shortly.');
    }

    /**
     * Preview the next serial number and estimated time for a given date/time/chamber.
     *
     * This is used by the multi-step public booking UI to show:
     * "Your Serial #3 – 05:40 PM" on the chamber selection step
     * before the patient submits their information.
     */
    public function previewSerial(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['required', 'date'],
            // Optional explicit time (used by internal flows); when omitted,
            // we compute the next time from the schedule and existing count.
            'time' => ['nullable', 'string'],
            'chamber_id' => ['nullable', 'integer', 'exists:chambers,id'],
        ]);

        $doctor = User::where('role', 'doctor')->first();
        if (!$doctor) {
            return response()->json([
                'serial_no' => null,
                'estimated_time' => null,
                'message' => 'No doctor configured.',
            ], 422);
        }

        $dateString = now()->parse($validated['date'])->toDateString();

        $time = $validated['time'] ?? null;

        $chamberId = $validated['chamber_id'] ?? null;

        $existingQuery = Appointment::where('doctor_id', $doctor->id)
            ->whereDate('appointment_date', $dateString);

        if ($chamberId) {
            $existingQuery->where('chamber_id', $chamberId);
        }

        $existingCount = $existingQuery->count();
        $serial = $existingCount + 1;

        if ($time && preg_match('/^\d{2}:\d{2}$/', $time) === 1) {
            $time .= ':00';
        }

        if (!$time) {
            $carbon = now()->parse($dateString);
            $dow = $carbon->dayOfWeek;

            $scheduleQuery = DoctorSchedule::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow);
            $rangeQuery = DoctorScheduleRange::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow);

            if ($chamberId) {
                $schedule = (clone $scheduleQuery)->where('chamber_id', $chamberId)->first()
                    ?: (clone $scheduleQuery)->whereNull('chamber_id')->first();
                $ranges = (clone $rangeQuery)->where('chamber_id', $chamberId)->orderBy('start_time')->get(['start_time', 'end_time']);
                if ($ranges->count() === 0) {
                    $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
                }
            } else {
                $schedule = $scheduleQuery->whereNull('chamber_id')->first();
                $ranges = $rangeQuery->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
            }

            $slotMinutes = $schedule?->slot_minutes ?? 30;

            if ($ranges->count() > 0) {
                $firstRange = $ranges->first();
                $startBase = substr((string) $firstRange->start_time, 0, 5);
            } else {
                $startBase = $schedule?->start_time
                    ? substr((string) $schedule->start_time, 0, 5)
                    : '09:00';
            }

            $startAt = now()->parse($dateString . ' ' . $startBase . ':00');
            $estimatedAt = $startAt->copy()->addMinutes($slotMinutes * ($serial - 1));
        } else {
            $estimatedAt = now()->parse($dateString . ' ' . $time);
        }

        return response()->json([
            'serial_no' => $serial,
            'estimated_time' => $estimatedAt->format('H:i'),
        ]);
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

        // Do not offer slots for dates in the past.
        $dateYmd = $carbon->toDateString();
        $todayYmd = now()->toDateString();
        if ($dateYmd < $todayYmd) {
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

        $chamberId = $request->query('chamber_id');

        $scheduleQuery = DoctorSchedule::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow);
        $rangeQuery = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow);

        if ($chamberId) {
            $schedule = (clone $scheduleQuery)->where('chamber_id', $chamberId)->first()
                ?: (clone $scheduleQuery)->whereNull('chamber_id')->first();
            $ranges = (clone $rangeQuery)->where('chamber_id', $chamberId)->orderBy('start_time')->get(['start_time', 'end_time']);
            if ($ranges->count() === 0) {
                $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
            }
        } else {
            $schedule = $scheduleQuery->whereNull('chamber_id')->first();
            $ranges = $rangeQuery->whereNull('chamber_id')->orderBy('start_time')->get(['start_time', 'end_time']);
        }

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

        // If booking for today, hide any slots that already passed.
        if ($dateYmd === $todayYmd) {
            $threshold = now();
            $isFutureOrNow = static function (string $time) use ($threshold): bool {
                $slotAt = $threshold->copy()->setTimeFromTimeString($time);
                return $slotAt->gte($threshold);
            };

            $allSlots = array_values(array_filter($allSlots, $isFutureOrNow));
            $availableSlots = array_values(array_filter($availableSlots, $isFutureOrNow));
            $bookedInSchedule = array_values(array_filter($bookedInSchedule, $isFutureOrNow));
        }

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
            'status' => ['required', Rule::in(['scheduled', 'arrived', 'in_consultation', 'awaiting_tests', 'prescribed', 'cancelled'])],
        ]);

        $user = $request->user();
        if (!$user || !in_array($user->role, ['doctor', 'admin'], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($user->role === 'doctor' && $appointment->doctor_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $newStatus = $validated['status'];
        $doctorId = $appointment->doctor_id;

        // If setting status to "in_consultation", ensure only one patient can be in consultation at a time
        if ($newStatus === 'in_consultation') {
            // Find all other appointments for this doctor that are currently "in_consultation"
            $otherInConsultation = Appointment::where('doctor_id', $doctorId)
                ->where('status', 'in_consultation')
                ->where('id', '!=', $appointment->id)
                ->get();

            // Change them back to "arrived" status (they were in consultation but now another patient is being seen)
            if ($otherInConsultation->count() > 0) {
                Appointment::where('doctor_id', $doctorId)
                    ->where('status', 'in_consultation')
                    ->where('id', '!=', $appointment->id)
                    ->update(['status' => 'arrived']);
            }
        }

        $appointment->update(['status' => $newStatus]);

        return response()->json([
            'status' => 'success',
            'message' => 'Appointment status updated.',
        ]);
    }

    /**
     * Link guest appointments to a user account (after user registration).
     */
    public function linkGuestAppointments(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || $user->role !== 'user') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Find all guest appointments with matching email
        $linkedCount = Appointment::where('email', $user->email)
            ->whereNull('user_id')
            ->where('is_guest', true)
            ->update([
                'user_id' => $user->id,
                'is_guest' => false,
            ]);

        return response()->json([
            'status' => 'success',
            'message' => "Linked $linkedCount appointment(s) to your account.",
            'count' => $linkedCount,
        ]);
    }
}
