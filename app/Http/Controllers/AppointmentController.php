<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
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
            'appointment_date' => $validated['date'],
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
            return response()->json(['slots' => [], 'date' => $date]);
        }

        try {
            $carbon = now()->parse($date);
        } catch (\Throwable $e) {
            return response()->json(['slots' => [], 'date' => $date]);
        }

        $dow = $carbon->dayOfWeek; // 0=Sun ... 6=Sat
        $schedule = DoctorSchedule::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->first();

        $ranges = DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->where('day_of_week', $dow)
            ->orderBy('start_time')
            ->get(['start_time', 'end_time']);

        $isClosed = $schedule?->is_closed ?? ($dow === 0);
        $slotMinutes = $schedule?->slot_minutes ?? 30;

        if ($isClosed || $slotMinutes <= 0) {
            return response()->json(['slots' => [], 'date' => $date]);
        }

        // If no explicit ranges are configured, fall back to the legacy single range.
        if ($ranges->count() === 0) {
            $start = $schedule?->start_time ? substr((string) $schedule->start_time, 0, 5) : '09:00';
            $end = $schedule?->end_time ? substr((string) $schedule->end_time, 0, 5) : '17:00';
            if (!$start || !$end) {
                return response()->json(['slots' => [], 'date' => $date]);
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

        return response()->json([
            'slots' => $availableSlots,
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
