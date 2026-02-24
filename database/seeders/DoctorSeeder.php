<?php

namespace Database\Seeders;

use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\Chamber;
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

        // Ensure at least one active chamber exists for this doctor so
        // the public booking page (/book-appointment) can show it.
        Chamber::firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'name' => 'Main Chamber',
            ],
            [
                'location' => 'Demo Clinic, 123 Main Street',
                'google_maps_url' => 'https://www.google.com/maps/dir/?api=1&destination=Demo+Clinic,+123+Main+Street',
                'phone' => $doctor->phone,
                'is_active' => true,
            ]
        );

        // Default schedule: Sat-Thu 09:00-17:00, Fri closed (Bangladesh weekend).
        // Also create matching continuous ranges so the new slot system works.
        for ($dow = 0; $dow <= 6; $dow++) {
            $isClosed = ($dow === 5); // Friday closed

            $schedule = DoctorSchedule::updateOrCreate(
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

            // For open days, ensure there is a single continuous range.
            if (!$isClosed) {
                DoctorScheduleRange::where('doctor_id', $doctor->id)
                    ->where('day_of_week', $dow)
                    ->delete();

                DoctorScheduleRange::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $dow,
                    'start_time' => $schedule->start_time ?? '09:00:00',
                    'end_time' => $schedule->end_time ?? '17:00:00',
                ]);
            } else {
                // Closed days should have no active ranges
                DoctorScheduleRange::where('doctor_id', $doctor->id)
                    ->where('day_of_week', $dow)
                    ->delete();
            }
        }
    }
}
