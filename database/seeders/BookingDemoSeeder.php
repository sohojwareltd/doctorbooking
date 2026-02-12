<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\DoctorUnavailableRange;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BookingDemoSeeder extends Seeder
{
    /**
     * Seed a demo doctor, chambers, schedules and a few appointments
     * to exercise the new booking system (serial + estimated time).
     */
    public function run(): void
    {
        // 1) Ensure we have a demo doctor
        $doctor = User::firstOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Demo Doctor',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+8801712345678',
            ]
        );

        // 2) Create a main chamber for this doctor
        $mainChamber = Chamber::firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'name' => 'Main Chamber',
            ],
            [
                'location' => 'Demo Clinic, 123 Main Street',
                'phone' => $doctor->phone,
                'is_active' => true,
            ]
        );

        // 3) Configure a simple weekly schedule: Mon–Sat, 5:00 PM – 9:00 PM, 10‑minute slots
        $slotMinutes = 10;
        foreach (range(1, 6) as $dow) { // 1 = Mon ... 6 = Sat
            DoctorSchedule::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $dow,
                ],
                [
                    'is_closed' => false,
                    'start_time' => '17:00:00',
                    'end_time' => '21:00:00',
                    'slot_minutes' => $slotMinutes,
                ]
            );

            // Clear any existing ranges for that day and add one continuous range
            DoctorScheduleRange::where('doctor_id', $doctor->id)
                ->where('day_of_week', $dow)
                ->delete();

            DoctorScheduleRange::create([
                'doctor_id' => $doctor->id,
                'day_of_week' => $dow,
                'start_time' => '17:00:00',
                'end_time' => '21:00:00',
            ]);
        }

        // Close Sunday
        DoctorSchedule::updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'day_of_week' => 0,
            ],
            [
                'is_closed' => true,
                'start_time' => null,
                'end_time' => null,
                'slot_minutes' => $slotMinutes,
            ]
        );

        DoctorScheduleRange::where('doctor_id', $doctor->id)
            ->where('day_of_week', 0)
            ->delete();

        // 4) Add one upcoming unavailable day (for demo)
        $offDate = now()->addDays(2)->toDateString();
        DoctorUnavailableRange::updateOrCreate(
            [
                'doctor_id' => $doctor->id,
                'start_date' => $offDate,
                'end_date' => $offDate,
            ],
            []
        );

        // 5) Seed a few demo appointments for today to demonstrate serials
        $today = now()->toDateString();

        // Avoid duplicating demo appointments if seeder is re‑run
        if (Appointment::where('doctor_id', $doctor->id)->whereDate('appointment_date', $today)->exists()) {
            return;
        }

        $baseTime = now()->setTime(17, 0, 0); // 5:00 PM today

        foreach (range(1, 5) as $serial) {
            $estimated = $baseTime->copy()->addMinutes($slotMinutes * ($serial - 1));

            Appointment::create([
                'user_id' => null,
                'doctor_id' => $doctor->id,
                'chamber_id' => $mainChamber->id,
                'appointment_date' => $today,
                'appointment_time' => $estimated->format('H:i:s'),
                'serial_no' => $serial,
                'estimated_start_time' => $estimated->format('H:i:s'),
                'status' => 'scheduled',
                'symptoms' => 'Demo appointment #' . $serial,
                'notes' => null,
                'name' => 'Demo Patient ' . $serial,
                'phone' => '01XXXXXXXX' . $serial,
                'email' => "demo{$serial}@example.com",
                'age' => 30 + $serial,
                'gender' => 'other',
                'is_guest' => true,
            ]);
        }
    }
}

