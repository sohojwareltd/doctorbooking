<?php

namespace Database\Seeders;

use App\Models\DoctorSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $doctor = User::firstOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Default Doctor',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '0123456789',
            ]
        );

        // Default schedule: Mon-Sat 09:00-17:00, Sun closed.
        for ($dow = 0; $dow <= 6; $dow++) {
            $isClosed = ($dow === 0);

            DoctorSchedule::updateOrCreate(
                [
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $dow,
                ],
                [
                    'is_closed' => $isClosed,
                    'start_time' => $isClosed ? null : '09:00:00',
                    'end_time' => $isClosed ? null : '17:00:00',
                    'slot_minutes' => 30,
                ]
            );
        }
    }
}
