<?php

use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\User;
use Illuminate\Support\Carbon;

it('filters out past slots for today', function () {
    $this->travelTo(Carbon::parse('2025-12-29 15:24:00'));

    $doctor = User::factory()->create([
        'role' => 'doctor',
    ]);

    $date = '2025-12-29';
    $dow = Carbon::parse($date)->dayOfWeek;

    DoctorSchedule::create([
        'doctor_id' => $doctor->id,
        'day_of_week' => $dow,
        'slot_minutes' => 30,
        'is_closed' => false,
    ]);

    DoctorScheduleRange::create([
        'doctor_id' => $doctor->id,
        'day_of_week' => $dow,
        'start_time' => '09:00:00',
        'end_time' => '17:00:00',
    ]);

    $res = $this->getJson("/available-slots/{$date}");

    $res->assertOk();

    $slots = $res->json('slots');
    expect($slots)->toBeArray();

    expect($slots)->not->toContain('09:00');
    expect($slots)->not->toContain('15:00');
    expect($slots)->toContain('15:30');
});

it('does not return slots for dates in the past', function () {
    $this->travelTo(Carbon::parse('2025-12-29 15:24:00'));

    User::factory()->create([
        'role' => 'doctor',
    ]);

    $res = $this->getJson('/available-slots/2025-12-28');

    $res->assertOk();
    expect($res->json('closed'))->toBeTrue();
    expect($res->json('slots'))->toBeArray()->toBe([]);
});
