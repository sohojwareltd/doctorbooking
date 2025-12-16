<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        $doctor = User::firstOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Default Doctor',
                'password' => Hash::make('password'),
                'role' => 'doctor',
            ]
        );

        $patient = User::firstOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'Demo Patient',
                'password' => Hash::make('password'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );

        // Create a few appointments
        $a1 = Appointment::firstOrCreate([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00:00',
        ], [
            'status' => 'pending',
            'symptoms' => 'Skin irritation and dryness',
        ]);

        $a2 = Appointment::firstOrCreate([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->copy()->addDays(1)->toDateString(),
            'appointment_time' => '11:00:00',
        ], [
            'status' => 'approved',
            'symptoms' => 'Acne treatment follow-up',
        ]);

        $a3 = Appointment::firstOrCreate([
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->copy()->subDays(3)->toDateString(),
            'appointment_time' => '14:00:00',
        ], [
            'status' => 'completed',
            'symptoms' => 'Routine check-up',
        ]);

        // Prescription for completed appointment
        Prescription::firstOrCreate([
            'appointment_id' => $a3->id,
            'user_id' => $patient->id,
            'doctor_id' => $doctor->id,
        ], [
            'diagnosis' => 'Mild dermatitis',
            'medications' => "Hydrocortisone 1% cream\nMoisturizer twice daily",
            'instructions' => 'Avoid harsh soaps, use lukewarm water.',
            'tests' => 'None',
            'next_visit_date' => now()->addWeeks(2)->toDateString(),
        ]);
    }
}
