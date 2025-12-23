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
                'phone' => '0123456789',
                'email_verified_at' => now(),
            ]
        );

        $demoPatient = User::firstOrCreate(
            ['email' => 'patient@example.com'],
            [
                'name' => 'Demo Patient',
                'password' => Hash::make('password'),
                'role' => 'user',
                'phone' => '01700000000',
                'email_verified_at' => now(),
            ]
        );

        $availableSlots = [
            '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
            '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
            '15:00:00', '15:30:00', '16:00:00', '16:30:00', '17:00:00',
        ];

        // Track used slots per date to avoid double-booking the single doctor.
        $usedSlotsByDate = [];

        // Keep a few deterministic appointments for the demo patient
        $completedAppointment = Appointment::firstOrCreate([
            'user_id' => $demoPatient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->copy()->subDays(3)->toDateString(),
            'appointment_time' => '14:00:00',
        ], [
            'status' => 'completed',
            'symptoms' => 'Routine check-up',
        ]);

        $usedSlotsByDate[$completedAppointment->appointment_date->toDateString()][] = $completedAppointment->appointment_time;

        $pendingAppointment = Appointment::firstOrCreate([
            'user_id' => $demoPatient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->toDateString(),
            'appointment_time' => '10:00:00',
        ], [
            'status' => 'pending',
            'symptoms' => 'Skin irritation and dryness',
        ]);

        $usedSlotsByDate[$pendingAppointment->appointment_date->toDateString()][] = $pendingAppointment->appointment_time;

        $approvedAppointment = Appointment::firstOrCreate([
            'user_id' => $demoPatient->id,
            'doctor_id' => $doctor->id,
            'appointment_date' => now()->copy()->addDays(1)->toDateString(),
            'appointment_time' => '11:00:00',
        ], [
            'status' => 'approved',
            'symptoms' => 'Acne treatment follow-up',
        ]);

        $usedSlotsByDate[$approvedAppointment->appointment_date->toDateString()][] = $approvedAppointment->appointment_time;

        Prescription::firstOrCreate([
            'appointment_id' => $completedAppointment->id,
            'user_id' => $demoPatient->id,
            'doctor_id' => $doctor->id,
        ], [
            'diagnosis' => 'Mild dermatitis',
            'medications' => "Hydrocortisone 1% cream\nMoisturizer twice daily",
            'instructions' => 'Avoid harsh soaps, use lukewarm water.',
            'tests' => 'None',
            'next_visit_date' => now()->addWeeks(2)->toDateString(),
        ]);

        // Dynamic data for dashboards/lists
        // Exactly 10 patients total: 9 random + demo patient.
        $patientCount = 9;
        $patients = User::factory()
            ->count($patientCount)
            ->withoutTwoFactor()
            ->create([
                'role' => 'user',
            ]);

        $patients->push($demoPatient);

        $symptomSamples = [
            'Headache and dizziness',
            'Fever and sore throat',
            'Back pain and stiffness',
            'Allergy flare-up and sneezing',
            'Stomach pain after meals',
            'Follow-up consultation',
            'Routine check-up',
            'Skin rash and itching',
        ];

        $diagnosisSamples = [
            'Common cold',
            'Migraine',
            'Seasonal allergies',
            'Gastritis',
            'Dermatitis',
            'Muscle strain',
        ];

        $medicationSamples = [
            "Paracetamol 500mg\n1 tab after meals (3x daily)",
            "Cetirizine 10mg\n1 tab at night",
            "Omeprazole 20mg\n1 cap before breakfast",
            "Ibuprofen 400mg\n1 tab after meals as needed",
            "Hydrocortisone 1% cream\nApply twice daily",
        ];

        $today = now()->startOfDay();

        foreach ($patients as $patient) {
            $existingCount = Appointment::where('user_id', $patient->id)
                ->where('doctor_id', $doctor->id)
                ->count();

            // Exactly 5 appointments per patient.
            $appointmentsToCreate = max(0, 5 - $existingCount);

            for ($i = 0; $i < $appointmentsToCreate; $i++) {
                $attempts = 0;
                $date = null;
                $time = null;

                while ($attempts < 30) {
                    $attempts++;
                    $date = now()->copy()->addDays(random_int(-14, 21))->toDateString();

                    $dateSlots = $usedSlotsByDate[$date] ?? [];
                    $freeSlots = array_values(array_diff($availableSlots, $dateSlots));
                    if (count($freeSlots) === 0) {
                        continue;
                    }

                    $time = $freeSlots[array_rand($freeSlots)];
                    $usedSlotsByDate[$date][] = $time;
                    break;
                }

                if (!$date || !$time) {
                    continue;
                }

                $appointmentDay = now()->parse($date)->startOfDay();
                if ($appointmentDay->lt($today)) {
                    $statusPool = ['completed', 'completed', 'approved', 'cancelled'];
                } else {
                    $statusPool = ['pending', 'pending', 'approved', 'cancelled'];
                }

                $status = $statusPool[array_rand($statusPool)];

                $appointment = Appointment::create([
                    'user_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'appointment_date' => $date,
                    'appointment_time' => $time,
                    'status' => $status,
                    'symptoms' => $symptomSamples[array_rand($symptomSamples)],
                    'notes' => null,
                ]);

                if ($appointment->status === 'completed' && random_int(1, 100) <= 70) {
                    Prescription::create([
                        'appointment_id' => $appointment->id,
                        'user_id' => $patient->id,
                        'doctor_id' => $doctor->id,
                        'diagnosis' => $diagnosisSamples[array_rand($diagnosisSamples)],
                        'medications' => $medicationSamples[array_rand($medicationSamples)],
                        'instructions' => 'Rest well, drink water, and follow the dosage instructions.',
                        'tests' => random_int(1, 100) <= 35 ? 'CBC, Blood pressure check' : null,
                        'next_visit_date' => random_int(1, 100) <= 50 ? now()->addDays(random_int(7, 30))->toDateString() : null,
                    ]);
                }
            }
        }
    }
}
