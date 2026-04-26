<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\User;
use App\Services\AppointmentSlotService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Public (unauthenticated) booking API.
 * Used by the public booking form AND external apps.
 */
class PublicController extends Controller
{
    public function __construct(private readonly AppointmentSlotService $slotService)
    {
    }

    /** POST /api/public/contact */
    public function contact(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:3000'],
        ]);

        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        $recipientEmail = $doctor?->email;

        if (! $recipientEmail) {
            return response()->json([
                'message' => 'Doctor email is not configured yet.',
            ], 422);
        }

        try {
            Mail::send('emails.contact-doctor', [
                'sender_name' => $validated['name'],
                'sender_phone' => $validated['phone'],
                'sender_email' => $validated['email'] ?? null,
                'subject_text' => $validated['subject'],
                'message_text' => $validated['message'],
            ], function ($mail) use ($validated, $recipientEmail) {
                $mail->to($recipientEmail)
                    ->subject('New contact message: ' . Str::limit((string) $validated['subject'], 120));

                if (! empty($validated['email'])) {
                    $mail->replyTo($validated['email'], $validated['name']);
                }
            });
        } catch (\Throwable $exception) {
            Log::error('Failed to send doctor contact email', [
                'error' => $exception->getMessage(),
            ]);

            return response()->json([
                'message' => 'Could not send message right now. Please try again later.',
            ], 500);
        }

        return response()->json([
            'message' => 'Your message has been sent successfully.',
        ]);
    }

    /** GET /api/public/doctor */
    public function doctor(): JsonResponse
    {
        $doctor = User::with('doctorProfile')
            ->whereHas('role', fn ($q) => $q->where('name', 'doctor'))
            ->first();

        if (! $doctor) {
            return response()->json(['doctor' => null]);
        }

        $profile = $doctor->doctorProfile;

        return response()->json([
            'doctor' => [
                'id' => $doctor->id,
                'name' => $doctor->name,
                'specialization' => $profile?->specialization,
                'degree' => $profile?->degree,
                'bio' => $profile?->bio,
                'experience' => $profile?->experience,
                'profile_picture' => $profile?->profile_picture,
                'hero_image' => $profile?->hero_image,
            ],
        ]);
    }

    /** GET /api/public/chambers */
    public function chambers(): JsonResponse
    {
        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['chambers' => []]);
        }

        $chambers = Chamber::where('doctor_id', $doctor->doctorId())
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'location', 'phone', 'google_maps_url']);

        return response()->json(['chambers' => $chambers]);
    }

    /** GET /api/public/schedule?chamber_id= */
    public function schedule(Request $request): JsonResponse
    {
        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['schedule' => []]);
        }

        $chamberId = $request->integer('chamber_id') ?: null;
        $docId = $doctor->doctorId();

        $scheduleQuery = DoctorSchedule::where('doctor_id', $docId);
        $rangeQuery = DoctorScheduleRange::where('doctor_id', $docId);

        if ($chamberId) {
            $schedules = (clone $scheduleQuery)->where('chamber_id', $chamberId)->get();
            if ($schedules->isEmpty()) {
                $schedules = (clone $scheduleQuery)->whereNull('chamber_id')->get();
            }
            $ranges = (clone $rangeQuery)->where('chamber_id', $chamberId)->orderBy('day_of_week')->orderBy('start_time')->get();
            if ($ranges->isEmpty()) {
                $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('day_of_week')->orderBy('start_time')->get();
            }
        } else {
            $schedules = (clone $scheduleQuery)->whereNull('chamber_id')->get();
            $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('day_of_week')->orderBy('start_time')->get();
        }

        $byDay = $schedules->keyBy('day_of_week');
        $rangesByDay = $ranges->groupBy('day_of_week');
        $payload = [];

        for ($dow = 0; $dow <= 6; $dow++) {
            $row = $byDay->get($dow);
            $dayRanges = ($rangesByDay->get($dow, collect()))
                ->map(fn ($r) => [
                    'start_time' => $r->start_time ? substr((string) $r->start_time, 0, 5) : null,
                    'end_time' => $r->end_time ? substr((string) $r->end_time, 0, 5) : null,
                ])
                ->values();

            $payload[] = [
                'day_of_week' => $dow,
                'day_name' => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][$dow],
                'is_closed' => $row ? (bool) $row->is_closed : ($dayRanges->isEmpty() || $dow === 0),
                'slot_minutes' => $row?->slot_minutes ?? 30,
                'ranges' => $dayRanges,
            ];
        }

        return response()->json(['schedule' => $payload]);
    }

    /** GET /api/public/unavailable-ranges?chamber_id= */
    public function unavailableRanges(Request $request): JsonResponse
    {
        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['ranges' => [], 'closed_weekdays' => range(0, 6), 'fully_booked_dates' => []]);
        }

        $chamberId = $request->integer('chamber_id') ?: null;

        $ranges = DoctorUnavailableRange::where('doctor_id', $doctor->doctorId())
            ->orderBy('start_date')
            ->get(['start_date', 'end_date'])
            ->map(fn ($r) => [
                'start_date' => $r->start_date?->toDateString(),
                'end_date' => $r->end_date?->toDateString(),
            ])
            ->values();

        $schedules = DoctorSchedule::where('doctor_id', $doctor->doctorId())
            ->where('chamber_id', $chamberId)
            ->where('is_closed', 0)
            ->get(['day_of_week', 'is_closed']);

        if ($schedules->isEmpty()) {
            $schedules = DoctorSchedule::where('doctor_id', $doctor->doctorId())
                ->whereNull('chamber_id')
                ->where('is_closed', 0)
                ->get(['day_of_week', 'is_closed']);
        }

        // If still no schedule rows, fall back to ranges to determine open days.
        // Days with ranges are treated as open; Sunday is closed by default.
        if ($schedules->isEmpty()) {
            $openDaysFromRanges = DoctorScheduleRange::where('doctor_id', $doctor->doctorId())
                ->where('chamber_id', $chamberId)
                ->distinct()
                ->pluck('day_of_week');

            if ($openDaysFromRanges->isEmpty()) {
                $openDaysFromRanges = DoctorScheduleRange::where('doctor_id', $doctor->doctorId())
                    ->whereNull('chamber_id')
                    ->distinct()
                    ->pluck('day_of_week');
            }

            $closedWeekdays = [];
            for ($d = 0; $d <= 6; $d++) {
                if ($d === 0 || ! $openDaysFromRanges->contains($d)) {
                    $closedWeekdays[] = $d;
                }
            }

            return response()->json(['ranges' => $ranges, 'closed_weekdays' => $closedWeekdays, 'fully_booked_dates' => []]);
        }

        $closedWeekdays = [];
        for ($d = 0; $d <= 6; $d++) {
            $dayRows = $schedules->where('day_of_week', $d);
            if ($dayRows->isEmpty() || $dayRows->every(fn ($r) => $r->is_closed)) {
                $closedWeekdays[] = $d;
            }
        }

        // Also mark days that have schedule but no remaining slots as disabled.
        $fullyBookedDates = [];
        $today = now()->startOfDay();
        $until = now()->copy()->addDays(45)->startOfDay();
        for ($cursor = $today->copy(); $cursor->lte($until); $cursor->addDay()) {
            $dateString = $cursor->toDateString();
            $availability = $this->slotService->getAvailabilityForDate($doctor, $dateString, $chamberId);
            if (! $availability['is_closed'] && $availability['slots']->isEmpty()) {
                $fullyBookedDates[] = $dateString;
            }
        }

        return response()->json([
            'ranges' => $ranges,
            'closed_weekdays' => $closedWeekdays,
            'fully_booked_dates' => $fullyBookedDates,
        ]);
    }

    /** GET /api/public/slots/{date} */
    public function availableSlots(Request $request, string $date): JsonResponse
    {
        $request->validate([
            'chamber_id' => ['nullable', 'integer', 'exists:chambers,id'],
        ]);

        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['slots' => []]);
        }

        $dateString = now()->parse($date)->toDateString();
        $chamberId = $request->integer('chamber_id') ?: null;

        $availability = $this->slotService->getAvailabilityForDate($doctor, $dateString, $chamberId);

        if ($availability['is_closed']) {
            return response()->json([
                'slots' => [],
                'is_closed' => true,
                'closed' => true,
                'message' => 'Doctor is unavailable on the selected date. Please choose another date.',
            ]);
        }

        $slots = $availability['slots']->values();

        return response()->json([
            'slots' => $slots,
            'is_closed' => false,
            'closed' => false,
            'message' => $slots->isEmpty() ? 'No slots are available on the selected date. Please choose another date.' : null,
        ]);
    }

    /** GET /api/public/booking-preview */
    public function bookingPreview(Request $request): JsonResponse
    {
        $request->validate([
            'date' => ['required', 'date'],
            'time' => ['nullable', 'string'],
            'chamber_id' => ['nullable', 'integer', 'exists:chambers,id'],
        ]);

        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['serial_no' => null, 'estimated_time' => null]);
        }

        $dateString = now()->parse($request->date)->toDateString();
        $chamberId = $request->integer('chamber_id') ?: null;

        $countQuery = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $dateString)
            ->whereNotIn('status', ['cancelled']);
        if ($chamberId) {
            $countQuery->where('chamber_id', $chamberId);
        }
        $serial = $countQuery->count() + 1;

        try {
            [$appointmentTime, $estimatedAt] = $this->slotService->resolveTime(
                $doctor, $dateString, $request->time, $chamberId
            );
        } catch (\RuntimeException $exception) {
            return response()->json([
                'serial_no' => null,
                'estimated_time' => null,
                'message' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'serial_no' => $serial,
            'estimated_time' => $estimatedAt->format('H:i'),
        ]);
    }

    /** POST /api/public/book-appointment */
    public function bookAppointment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'age' => ['nullable', 'integer', 'min:1', 'max:150'],
            'gender' => ['nullable', 'in:male,female,other'],
            'date' => ['required', 'date'],
            'time' => ['nullable', 'string'],
            'symptoms' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'address' => ['nullable', 'string', 'max:500'],
            'chamber_id' => ['nullable', 'integer', 'exists:chambers,id'],
            'captcha_token' => ['nullable', 'string'],
            'captcha_answer' => ['nullable', 'string'],
        ]);

        $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();
        if (! $doctor) {
            return response()->json(['message' => 'No doctor is configured yet.'], 422);
        }

        // Validate chamber
        $chamber = null;
        if (! empty($validated['chamber_id'])) {
            $chamber = Chamber::where('id', $validated['chamber_id'])
                ->where('doctor_id', $doctor->doctorId())
                ->where('is_active', true)
                ->first();
            if (! $chamber) {
                return response()->json(['message' => 'The selected chamber is not available.'], 422);
            }
        }

        // Captcha (optional — web form only)
        if (! empty($validated['captcha_token'])) {
            $cacheKey = 'booking_captcha:'.$validated['captcha_token'];
            $expected = Cache::pull($cacheKey);

            // Backward-compatible fallback while older tokens may still be in session.
            if ($expected === null) {
                $expected = session('booking_captcha_'.$validated['captcha_token']);
            }

            session()->forget('booking_captcha_'.$validated['captcha_token']);
            if ($expected === null || trim((string) $validated['captcha_answer']) !== (string) $expected) {
                return response()->json(['message' => 'Captcha answer is incorrect.'], 422);
            }
        }

        $dateString = now()->parse($validated['date'])->toDateString();

        // Check doctor unavailability
        if (DoctorUnavailableRange::where('doctor_id', $doctor->doctorId())
            ->whereDate('start_date', '<=', $dateString)
            ->whereDate('end_date', '>=', $dateString)
            ->exists()) {
            return response()->json(['message' => 'Doctor is unavailable on the selected date.'], 422);
        }

        // Match logged-in user (Bearer token on API) or session user or email on file
        $linkedUser = null;
        $bearer = $request->bearerToken();
        if ($bearer) {
            $tokenModel = PersonalAccessToken::findToken($bearer);
            if ($tokenModel?->tokenable instanceof User) {
                $linkedUser = $tokenModel->tokenable;
            }
        }
        if ($linkedUser === null && $request->user()) {
            $linkedUser = $request->user();
        }
        if ($linkedUser === null && ! empty($validated['email'])) {
            $linkedUser = User::where('email', $validated['email'])
                ->orWhere('username', $validated['email'])
                ->first();
        }

        $countQuery = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $dateString)
            ->whereNotIn('status', ['cancelled']);
        if ($chamber) {
            $countQuery->where('chamber_id', $chamber->id);
        }
        $serial = $countQuery->count() + 1;

        try {
            [$appointmentTime, $estimatedAt] = $this->slotService->resolveTime(
                $doctor, $dateString, $validated['time'] ?? null, $chamber?->id
            );
        } catch (\RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        }

        $appointment = Appointment::create([
            'user_id' => $linkedUser?->id,
            'doctor_id' => $doctor->doctorId(),
            'chamber_id' => $chamber?->id,
            'appointment_date' => $dateString,
            'appointment_time' => $appointmentTime,
            'serial_no' => $serial,
            'estimated_start_time' => $estimatedAt->format('H:i:s'),
            'status' => 'scheduled',
            'symptoms' => $validated['symptoms'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'address' => $validated['address'] ?? null,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'age' => $validated['age'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'is_guest' => $linkedUser === null,
        ]);

        return response()->json([
            'message' => 'Appointment booked successfully.',
            'serial_no' => $appointment->serial_no,
            'estimated_time' => substr((string) $appointment->estimated_start_time, 0, 5),
            'appointment_id' => $appointment->id,
        ], 201);
    }

    /** GET /api/public/captcha */
    public function captcha(): JsonResponse
    {
        $a = random_int(1, 9);
        $b = random_int(1, 9);
        $token = Str::random(32);
        $answer = (string) ($a + $b);

        // Primary store: cache token with short TTL (independent of session middleware behavior).
        Cache::put('booking_captcha:'.$token, $answer, now()->addMinutes(10));

        // Keep session copy as fallback for compatibility.
        session(['booking_captcha_'.$token => $answer]);

        return response()->json([
            'token' => $token,
            'question' => "What is {$a} + {$b}?",
        ]);
    }

}
