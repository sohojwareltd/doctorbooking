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
        $doctor = User::updateOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Dr. Sarah Johnson',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+1 (555) 123-4567',
                'specialization' => 'Board-Certified Dermatologist',
                'degree' => 'MD, Harvard Medical School',
                'registration_no' => 'MD-12345',
                'experience' => 20,
                'bio' => 'Transform your skin with advanced dermatological care and aesthetic excellence. Over 20 years of expertise dedicated to your confidence and natural beauty. Dr. Sarah Johnson is a board-certified dermatologist and cosmetic surgeon with over 20 years of experience in transforming the lives of her patients through advanced skincare treatments and aesthetic procedures.',
                'profile_picture' => null,
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
