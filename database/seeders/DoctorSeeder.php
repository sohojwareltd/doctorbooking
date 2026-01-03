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
                'name' => 'Dr. Fatima Ahmed',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '+880 1712-345678',
                'address' => 'Gulshan, Dhaka',
                'gender' => 'female',
                'date_of_birth' => '1985-08-20',
                'specialization' => 'MBBS, FCPS (Medicine), Consultant Physician',
                'degree' => 'MBBS, FCPS - Dhaka Medical College',
                'registration_no' => 'BM-54321',
                'bio' => 'Dr. Fatima Ahmed is a highly experienced consultant physician with over 15 years of medical practice. She specializes in general medicine, diabetes care, hypertension management, and women\'s health. Known for her compassionate approach and thorough diagnosis, she is dedicated to providing personalized care to all her patients.',
                'profile_picture' => null,
                'email_verified_at' => now(),
            ]
        );

        // Default schedule: Sat-Thu 09:00-17:00, Fri closed (Bangladesh weekend).
        for ($dow = 0; $dow <= 6; $dow++) {
            $isClosed = ($dow === 5); // Friday closed

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
