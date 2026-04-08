<?php

namespace Database\Seeders;

use App\Models\Chamber;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    public function run(): void
    {
        $doctorRole = Role::where('name', 'doctor')->first();

        $doctorUser = User::updateOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name'              => 'Dr. Fatima Ahmed',
                'username'          => 'doctor@example.com',
                'password'          => Hash::make('password'),
                'role_id'           => $doctorRole?->id,
                'phone'             => '+880 1712-345678',
                'email_verified_at' => now(),
            ]
        );

        // Create or update Doctor profile (specialization etc.)
        $doctorProfile = Doctor::updateOrCreate(
            ['user_id' => $doctorUser->id],
            [
                'specialization' => 'MBBS, FCPS (Medicine), Consultant Physician',
                'degree'         => 'MBBS, FCPS - Dhaka Medical College',
                'registration_no'=> 'BM-54321',
                'experience'     => 15,
                'bio'            => 'Dr. Fatima Ahmed is a highly experienced consultant physician with over 15 years of medical practice. She specializes in general medicine, diabetes care, hypertension management, and women\'s health.',
            ]
        );

        $doctorId = $doctorProfile->id; // doctors.id — used as FK on all related tables

        // Default Main Chamber
        $mainChamber = Chamber::firstOrCreate(
            ['doctor_id' => $doctorId, 'name' => 'Main Chamber'],
            [
                'location'        => 'Demo Clinic, 123 Main Street, Dhaka',
                'google_maps_url' => null,
                'phone'           => $doctorUser->phone,
                'is_active'       => true,
            ]
        );

        // Default schedule: Sat–Thu 09:00–17:00, Fri closed (Bangladesh weekend)
        for ($dow = 0; $dow <= 6; $dow++) {
            $isClosed = ($dow === 5); // Friday closed

            $schedule = DoctorSchedule::updateOrCreate(
                ['doctor_id' => $doctorId, 'day_of_week' => $dow],
                [
                    'chamber_id'   => $mainChamber->id,
                    'is_closed'    => $isClosed,
                    'start_time'   => $isClosed ? null : '09:00:00',
                    'end_time'     => $isClosed ? null : '17:00:00',
                    'slot_minutes' => 30,
                ]
            );

            if (! $isClosed) {
                DoctorScheduleRange::where('doctor_id', $doctorId)
                    ->where('day_of_week', $dow)
                    ->delete();

                DoctorScheduleRange::create([
                    'doctor_id'  => $doctorId,
                    'chamber_id' => $mainChamber->id,
                    'day_of_week'=> $dow,
                    'start_time' => '09:00:00',
                    'end_time'   => '17:00:00',
                ]);
            } else {
                DoctorScheduleRange::where('doctor_id', $doctorId)
                    ->where('day_of_week', $dow)
                    ->delete();
            }
        }
    }
}

