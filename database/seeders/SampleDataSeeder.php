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
        $doctor = User::where('email', 'doctor@example.com')->first();
        
        if (!$doctor) {
            $this->command->error('Doctor not found. Please run DoctorSeeder first.');
            return;
        }

        // Create 15 patients with diverse Bangladesh names and realistic data
        $patientsData = [
            [
                'name' => 'Md. Karim Hossain',
                'email' => 'karim.hossain@example.com',
                'phone' => '+880 1712-111222',
                'gender' => 'male',
                'date_of_birth' => '1988-03-15',
                'address' => 'Mirpur, Dhaka',
                'weight' => '75 kg',
            ],
            [
                'name' => 'Nasrin Sultana',
                'email' => 'nasrin.sultana@example.com',
                'phone' => '+880 1713-222333',
                'gender' => 'female',
                'date_of_birth' => '1992-07-22',
                'address' => 'Dhanmondi, Dhaka',
                'weight' => '58 kg',
            ],
            [
                'name' => 'Abdullah Al Mamun',
                'email' => 'abdullah.mamun@example.com',
                'phone' => '+880 1714-333444',
                'gender' => 'male',
                'date_of_birth' => '1985-11-10',
                'address' => 'Uttara, Dhaka',
                'weight' => '82 kg',
            ],
            [
                'name' => 'Taslima Akter',
                'email' => 'taslima.akter@example.com',
                'phone' => '+880 1715-444555',
                'gender' => 'female',
                'date_of_birth' => '1995-02-18',
                'address' => 'Banani, Dhaka',
                'weight' => '55 kg',
            ],
            [
                'name' => 'Rafiqul Islam',
                'email' => 'rafiqul.islam@example.com',
                'phone' => '+880 1716-555666',
                'gender' => 'male',
                'date_of_birth' => '1978-09-25',
                'address' => 'Mohammadpur, Dhaka',
                'weight' => '78 kg',
            ],
            [
                'name' => 'Shirin Akhter',
                'email' => 'shirin.akhter@example.com',
                'phone' => '+880 1717-666777',
                'gender' => 'female',
                'date_of_birth' => '1990-06-12',
                'address' => 'Bashundhara, Dhaka',
                'weight' => '62 kg',
            ],
            [
                'name' => 'Habibur Rahman',
                'email' => 'habibur.rahman@example.com',
                'phone' => '+880 1718-777888',
                'gender' => 'male',
                'date_of_birth' => '1983-12-30',
                'address' => 'Gulshan, Dhaka',
                'weight' => '85 kg',
            ],
            [
                'name' => 'Farhana Yasmin',
                'email' => 'farhana.yasmin@example.com',
                'phone' => '+880 1719-888999',
                'gender' => 'female',
                'date_of_birth' => '1993-04-08',
                'address' => 'Lalmatia, Dhaka',
                'weight' => '60 kg',
            ],
            [
                'name' => 'Mizanur Rahman',
                'email' => 'mizan.rahman@example.com',
                'phone' => '+880 1720-999111',
                'gender' => 'male',
                'date_of_birth' => '1987-01-20',
                'address' => 'Khilgaon, Dhaka',
                'weight' => '70 kg',
            ],
            [
                'name' => 'Sharmin Jahan',
                'email' => 'sharmin.jahan@example.com',
                'phone' => '+880 1721-111222',
                'gender' => 'female',
                'date_of_birth' => '1991-08-14',
                'address' => 'Rampura, Dhaka',
                'weight' => '56 kg',
            ],
            [
                'name' => 'Jahangir Alam',
                'email' => 'jahangir.alam@example.com',
                'phone' => '+880 1722-222333',
                'gender' => 'male',
                'date_of_birth' => '1980-05-05',
                'address' => 'Motijheel, Dhaka',
                'weight' => '88 kg',
            ],
            [
                'name' => 'Rokeya Begum',
                'email' => 'rokeya.begum@example.com',
                'phone' => '+880 1723-333444',
                'gender' => 'female',
                'date_of_birth' => '1986-10-28',
                'address' => 'Shantinagar, Dhaka',
                'weight' => '65 kg',
            ],
            [
                'name' => 'Anwar Hossain',
                'email' => 'anwar.hossain@example.com',
                'phone' => '+880 1724-444555',
                'gender' => 'male',
                'date_of_birth' => '1994-03-17',
                'address' => 'Tejgaon, Dhaka',
                'weight' => '72 kg',
            ],
            [
                'name' => 'Sultana Parvin',
                'email' => 'sultana.parvin@example.com',
                'phone' => '+880 1725-555666',
                'gender' => 'female',
                'date_of_birth' => '1989-12-02',
                'address' => 'Badda, Dhaka',
                'weight' => '59 kg',
            ],
            [
                'name' => 'Mahmudul Hasan',
                'email' => 'mahmudul.hasan@example.com',
                'phone' => '+880 1726-666777',
                'gender' => 'male',
                'date_of_birth' => '1982-07-19',
                'address' => 'Jatrabari, Dhaka',
                'weight' => '80 kg',
            ],
        ];

        $patients = [];
        foreach ($patientsData as $patientData) {
            $patients[] = User::firstOrCreate(
                ['email' => $patientData['email']],
                array_merge($patientData, [
                    'password' => Hash::make('password'),
                    'role' => 'user',
                    'email_verified_at' => now(),
                ])
            );
        }

        // Realistic symptoms and diagnoses in Bangladesh context
        $symptomsData = [
            'জ্বর এবং মাথা ব্যথা (Fever and headache)',
            'পেট ব্যথা এবং বমি বমি ভাব (Stomach pain and nausea)',
            'সর্দি কাশি এবং গলা ব্যথা (Cold, cough and sore throat)',
            'শরীর ব্যথা এবং দুর্বলতা (Body ache and weakness)',
            'উচ্চ রক্তচাপ নিয়ন্ত্রণ (Blood pressure control)',
            'ডায়াবেটিস ফলো আপ (Diabetes follow-up)',
            'বুকে ব্যথা এবং শ্বাসকষ্ট (Chest pain and breathing difficulty)',
            'চর্মরোগ এবং চুলকানি (Skin disease and itching)',
            'মাইগ্রেন এবং মাথা ঘোরা (Migraine and dizziness)',
            'অ্যালার্জি এবং হাঁচি (Allergy and sneezing)',
            'পিঠ ব্যথা এবং ঘাড় ব্যথা (Back and neck pain)',
            'নিয়মিত চেকআপ (Routine checkup)',
        ];

        $diagnosisData = [
            'ভাইরাল জ্বর (Viral Fever)',
            'গ্যাস্ট্রাইটিস (Gastritis)',
            'ঊর্ধ্ব শ্বাসনালীর সংক্রমণ (Upper Respiratory Tract Infection)',
            'টাইপ-২ ডায়াবেটিস মেলিটাস (Type 2 Diabetes Mellitus)',
            'উচ্চ রক্তচাপ (Hypertension)',
            'মাইগ্রেন (Migraine)',
            'অ্যালার্জিক রাইনাইটিস (Allergic Rhinitis)',
            'মাসকুলোস্কেলেটাল পেইন (Musculoskeletal Pain)',
            'একজিমা (Eczema)',
            'ব্রঙ্কাইটিস (Bronchitis)',
        ];

        $medicationsData = [
            "Napa 500mg\n1+0+1 (খাবারের পরে / After meals)\nDuration: 5 days",
            "Omeprazole 20mg\n1+0+0 (খালি পেটে / Empty stomach)\nDuration: 7 days\n\nGaviscon Syrup\n2 চামচ (2 spoons) খাবারের পরে\nDuration: 7 days",
            "Metformin 500mg\n0+0+1 (খাবারের সাথে / With food)\nDuration: 30 days\n\nGlucose monitoring required",
            "Amlodipine 5mg\n1+0+0 (সকালে / Morning)\nDuration: 30 days",
            "Ace 100mg\n1+0+0 (রাতে / At night)\nDuration: 5 days",
            "Cetirizine 10mg\n0+0+1 (রাতে / At night)\nDuration: 7 days",
            "Fusidic Acid Cream\nপ্রতিদিন ২ বার (2 times daily)\nDuration: 10 days",
            "Montelukast 10mg\n0+0+1 (রাতে / At night)\nDuration: 14 days\n\nSalbutamol Inhaler\nAs needed for breathing",
        ];

        $instructionsData = [
            'পর্যাপ্ত বিশ্রাম নিন এবং পানি পান করুন। Avoid cold foods. (Take adequate rest and drink water)',
            'মসলাযুক্ত ও তৈলাক্ত খাবার এড়িয়ে চলুন। খাবার সময়মতো খান। (Avoid spicy and oily food. Eat on time)',
            'নিয়মিত ব্যায়াম করুন এবং হাঁটুন। মিষ্টি ও ভাত কম খান। (Regular exercise and walking. Reduce sugar and rice)',
            'লবণ কম খান এবং নিয়মিত রক্তচাপ মাপুন। (Reduce salt intake and monitor BP regularly)',
            'ধুলাবালি এড়িয়ে চলুন এবং মাস্ক ব্যবহার করুন। (Avoid dust and use mask)',
            'সাবান দিয়ে ঘন ঘন গোসল করবেন না। ময়েশ্চারাইজার ব্যবহার করুন। (Avoid frequent bathing with soap. Use moisturizer)',
        ];

        $testsData = [
            'CBC (Complete Blood Count)',
            'RBS (Random Blood Sugar)',
            'HbA1c, Lipid Profile',
            'Chest X-ray',
            'ECG',
            'Urine R/E',
            null,
            null,
        ];

        $availableSlots = [
            '09:00:00', '09:30:00', '10:00:00', '10:30:00', '11:00:00', '11:30:00',
            '12:00:00', '12:30:00', '13:00:00', '13:30:00', '14:00:00', '14:30:00',
            '15:00:00', '15:30:00', '16:00:00', '16:30:00',
        ];

        $usedSlotsByDate = [];
        $today = now()->startOfDay();

        // Create appointments and prescriptions for each patient
        foreach ($patients as $index => $patient) {
            // Each patient gets 2-4 appointments
            $appointmentCount = random_int(2, 4);

            for ($i = 0; $i < $appointmentCount; $i++) {
                $attempts = 0;
                $date = null;
                $time = null;

                // Find available slot
                while ($attempts < 50) {
                    $attempts++;
                    $date = now()->copy()->addDays(random_int(-30, 14))->toDateString();

                    // Skip Friday (day 5)
                    $dayOfWeek = now()->parse($date)->dayOfWeek;
                    if ($dayOfWeek === 5) {
                        continue;
                    }

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
                
                // Determine status based on date - new status flow
                if ($appointmentDay->lt($today)) {
                    // Past appointments: mostly prescribed, some cancelled
                    $statusPool = ['prescribed', 'prescribed', 'prescribed', 'prescribed', 'cancelled'];
                } elseif ($appointmentDay->eq($today)) {
                    // Today's appointments: mix of scheduled, arrived, in consultation, awaiting tests
                    $statusPool = ['scheduled', 'scheduled', 'arrived', 'arrived', 'in_consultation', 'awaiting_tests'];
                } else {
                    // Future appointments: mostly scheduled
                    $statusPool = ['scheduled', 'scheduled', 'scheduled', 'scheduled', 'arrived'];
                }

                $status = $statusPool[array_rand($statusPool)];

                $appointment = Appointment::create([
                    'user_id' => $patient->id,
                    'doctor_id' => $doctor->id,
                    'appointment_date' => $date,
                    'appointment_time' => $time,
                    'status' => $status,
                    'symptoms' => $symptomsData[array_rand($symptomsData)],
                    'notes' => null,
                ]);

                // Create prescription for 80% of prescribed appointments
                if ($appointment->status === 'prescribed' && random_int(1, 100) <= 80) {
                    $hasNextVisit = random_int(1, 100) <= 60;
                    
                    Prescription::create([
                        'appointment_id' => $appointment->id,
                        'user_id' => $patient->id,
                        'doctor_id' => $doctor->id,
                        'diagnosis' => $diagnosisData[array_rand($diagnosisData)],
                        'medications' => $medicationsData[array_rand($medicationsData)],
                        'instructions' => $instructionsData[array_rand($instructionsData)],
                        'tests' => $testsData[array_rand($testsData)],
                        'next_visit_date' => $hasNextVisit ? now()->addDays(random_int(7, 30))->toDateString() : null,
                    ]);
                }
            }
        }

        $this->command->info('Sample data seeded successfully!');
        $this->command->info('Total Patients: ' . count($patients));
        $this->command->info('Total Appointments: ' . Appointment::count());
        $this->command->info('Total Prescriptions: ' . Prescription::count());
    }
}
