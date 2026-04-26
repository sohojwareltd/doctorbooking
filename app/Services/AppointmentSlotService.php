<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\User;
use Illuminate\Support\Carbon;
use RuntimeException;

class AppointmentSlotService
{
    /**
     * @return array{is_closed: bool, slots: \Illuminate\Support\Collection, all_slots: \Illuminate\Support\Collection}
     */
    public function getAvailabilityForDate(User $doctor, string $dateString, ?int $chamberId = null): array
    {
        $date = Carbon::parse($dateString)->toDateString();
        $dow = Carbon::parse($date)->dayOfWeek;

        [$schedule, $ranges] = $this->resolveScheduleAndRanges($doctor, $dow, $chamberId);

        if ($schedule?->is_closed || ($ranges->isEmpty() && ! $schedule)) {
            return [
                'is_closed' => true,
                'slots' => collect(),
                'all_slots' => collect(),
            ];
        }

        $slotMinutes = (int) ($schedule?->slot_minutes ?? 30);
        $allSlots = $this->buildAllSlots($date, $schedule?->start_time, $schedule?->end_time, $ranges, $slotMinutes);

        if ($allSlots->isEmpty()) {
            return [
                'is_closed' => true,
                'slots' => collect(),
                'all_slots' => collect(),
            ];
        }

        $bookedTimes = $this->bookedTimes($doctor, $date, $chamberId);
        $now = now();

        // Queue-based booking: once a later slot is booked, earlier gaps are not reused.
        // Only slots after the latest booked schedule slot remain available.
        $lastBookedIndex = -1;
        foreach ($bookedTimes as $booked) {
            $idx = $allSlots->search($booked);
            if ($idx !== false && $idx > $lastBookedIndex) {
                $lastBookedIndex = $idx;
            }
        }

        $queueSlots = $allSlots->slice($lastBookedIndex + 1)->values();

        $availableSlots = $queueSlots->filter(function (string $slot) use ($bookedTimes, $date, $now) {
            if ($bookedTimes->contains($slot)) {
                return false;
            }

            if ($date === $now->toDateString()) {
                return Carbon::parse($date.' '.$slot)->gt($now);
            }

            return true;
        })->values();

        return [
            'is_closed' => false,
            'slots' => $availableSlots,
            'all_slots' => $allSlots->values(),
        ];
    }

    /**
     * @return array{0: string, 1: Carbon}
     */
    public function resolveTime(User $doctor, string $dateString, ?string $rawTime, ?int $chamberId = null): array
    {
        $date = Carbon::parse($dateString)->toDateString();
        $availability = $this->getAvailabilityForDate($doctor, $date, $chamberId);

        if ($availability['is_closed']) {
            throw new RuntimeException('Doctor is unavailable on the selected date. Please choose another date.');
        }

        if ($rawTime && preg_match('/^\d{2}:\d{2}$/', $rawTime)) {
            $rawTime .= ':00';
        }

        if ($rawTime) {
            $requestedHm = substr((string) $rawTime, 0, 5);

            if (! $availability['all_slots']->contains($requestedHm)) {
                throw new RuntimeException('Selected time is outside the doctor schedule. Please choose another time.');
            }

            if (! $availability['slots']->contains($requestedHm)) {
                throw new RuntimeException('Selected time is no longer available. Please choose another time.');
            }

            $estimatedAt = Carbon::parse($date.' '.$requestedHm.':00');

            return [$estimatedAt->format('H:i:s'), $estimatedAt];
        }

        $nextAvailable = $availability['slots']->first();
        if (! $nextAvailable) {
            throw new RuntimeException('No slots are available on the selected date. Please choose another date.');
        }

        $estimatedAt = Carbon::parse($date.' '.$nextAvailable.':00');

        return [$estimatedAt->format('H:i:s'), $estimatedAt];
    }

    /**
     * @return array{0: ?DoctorSchedule, 1: \Illuminate\Support\Collection}
     */
    private function resolveScheduleAndRanges(User $doctor, int $dayOfWeek, ?int $chamberId): array
    {
        $scheduleQuery = DoctorSchedule::where('doctor_id', $doctor->doctorId())->where('day_of_week', $dayOfWeek);
        $rangeQuery = DoctorScheduleRange::where('doctor_id', $doctor->doctorId())->where('day_of_week', $dayOfWeek);

        if ($chamberId) {
            $schedule = (clone $scheduleQuery)->where('chamber_id', $chamberId)->first()
                ?: (clone $scheduleQuery)->whereNull('chamber_id')->first();

            $ranges = (clone $rangeQuery)->where('chamber_id', $chamberId)->orderBy('start_time')->get();
            if ($ranges->isEmpty()) {
                $ranges = (clone $rangeQuery)->whereNull('chamber_id')->orderBy('start_time')->get();
            }

            return [$schedule, $ranges];
        }

        $schedule = $scheduleQuery->whereNull('chamber_id')->first();
        $ranges = $rangeQuery->whereNull('chamber_id')->orderBy('start_time')->get();

        return [$schedule, $ranges];
    }

    private function buildAllSlots(
        string $dateString,
        ?string $scheduleStart,
        ?string $scheduleEnd,
        $ranges,
        int $slotMinutes
    ) {
        $allSlots = collect();

        foreach ($ranges as $range) {
            $start = Carbon::parse($dateString.' '.$range->start_time);
            $end = Carbon::parse($dateString.' '.$range->end_time);

            while ($start->lt($end)) {
                $allSlots->push($start->format('H:i'));
                $start->addMinutes($slotMinutes);
            }
        }

        if ($allSlots->isEmpty() && $scheduleStart && $scheduleEnd) {
            $start = Carbon::parse($dateString.' '.$scheduleStart);
            $end = Carbon::parse($dateString.' '.$scheduleEnd);

            while ($start->lt($end)) {
                $allSlots->push($start->format('H:i'));
                $start->addMinutes($slotMinutes);
            }
        }

        return $allSlots;
    }

    private function bookedTimes(User $doctor, string $dateString, ?int $chamberId)
    {
        $query = Appointment::where('doctor_id', $doctor->doctorId())
            ->whereDate('appointment_date', $dateString)
            ->whereNotIn('status', ['cancelled']);

        if ($chamberId) {
            $query->where('chamber_id', $chamberId);
        }

        return $query->pluck('appointment_time')
            ->map(fn ($time) => substr((string) $time, 0, 5))
            ->values();
    }
}
