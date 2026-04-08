<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Chamber;
use App\Models\Compounder;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\DoctorScheduleRange;
use App\Models\Patient;
use App\Models\Prescription;
use App\Models\Role;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * Comprehensive Bangladeshi demo seeder.
 *
 * Creates:
 *  - 2 Compounders
 *  - 4 Chambers (Dhanmondi, Uttara, Gulshan, Mirpur)
 *  - Chamber-specific schedules (realistic Bangladesh timings)
 *  - 12 Patients with full profiles
 *  - 30+ Appointments across past / today / future
 *  - Prescriptions for all "prescribed" appointments
 *
 * Depends on DoctorSeeder having already run (doctor@example.com + doctors row must exist).
 */
class BangladeshiDemoSeeder extends Seeder
{
    public function run(): void
    {
        // ──────────────────────────────────────────────────────────────────────
        // 0. Resolve existing doctor
        // ──────────────────────────────────────────────────────────────────────
        $doctorUser = User::where('email', 'doctor@example.com')->first();

        if (! $doctorUser) {
            $this->command->error('Doctor (doctor@example.com) not found. Run DoctorSeeder first.');
            return;
        }

        $doctorProfile = $doctorUser->doctorProfile;
        if (! $doctorProfile) {
            $this->command->error('Doctor profile row missing. Run DoctorSeeder first.');
            return;
        }

        $doctorId = $doctorProfile->id; // doctors.id — FK for all related tables

        $patientRole    = Role::where('name', 'patient')->firstOrFail();
        $compoundRole   = Role::where('name', 'compounder')->firstOrFail();

        // ──────────────────────────────────────────────────────────────────────
        // 1. Compounders
        // ──────────────────────────────────────────────────────────────────────
        $compoundersData = [
            [
                'name'        => 'Md. Imran Hossain',
                'email'       => 'imran.compounder@example.com',
                'phone'       => '+88 01831-456789',
                'designation' => 'সিনিয়র কম্পাউন্ডার (Senior Compounder)',
            ],
            [
                'name'        => 'Fatema Khatun',
                'email'       => 'fatema.compounder@example.com',
                'phone'       => '+88 01932-567890',
                'designation' => 'সহকারী কম্পাউন্ডার (Assistant Compounder)',
            ],
        ];

        foreach ($compoundersData as $cd) {
            $user = User::firstOrCreate(
                ['email' => $cd['email']],
                [
                    'name'              => $cd['name'],
                    'username'          => $cd['email'],
                    'phone'             => $cd['phone'],
                    'password'          => Hash::make('password'),
                    'role_id'           => $compoundRole->id,
                    'email_verified_at' => now(),
                ]
            );
            Compounder::firstOrCreate(
                ['user_id' => $user->id],
                ['designation' => $cd['designation']]
            );
        }

        $this->command->info('✓ 2 Compounders created.');

        // ──────────────────────────────────────────────────────────────────────
        // 2. Chambers (4 real Dhaka locations)
        // ──────────────────────────────────────────────────────────────────────
        $chambersData = [
            [
                'name'            => 'ধানমন্ডি চেম্বার',
                'location'        => 'ফ্ল্যাট ৩/বি, বাড়ি ২৪, রোড ৭/এ, ধানমন্ডি, ঢাকা ১২০৫',
                'phone'           => '+88 01712-345678',
                'google_maps_url' => 'https://www.google.com/maps/search/Dhanmondi+Dhaka',
                'is_active'       => true,
            ],
            [
                'name'            => 'উত্তরা স্পেশালিস্ট ক্লিনিক',
                'location'        => 'রোড ১৩, সেক্টর ৬, উত্তরা, ঢাকা ১২৩০',
                'phone'           => '+88 01755-678901',
                'google_maps_url' => 'https://www.google.com/maps/search/Uttara+Dhaka',
                'is_active'       => true,
            ],
            [
                'name'            => 'গুলশান মেডিকেল সেন্টার',
                'location'        => 'প্লট ১৮, রোড ৯০, গুলশান-২, ঢাকা ১২১২',
                'phone'           => '+88 01811-789012',
                'google_maps_url' => 'https://www.google.com/maps/search/Gulshan+Dhaka',
                'is_active'       => true,
            ],
            [
                'name'            => 'মিরপুর জেনারেল চেম্বার',
                'location'        => 'বাড়ি ৫, রোড ২, মিরপুর-১০, ঢাকা ১২১৬',
                'phone'           => '+88 01644-890123',
                'google_maps_url' => 'https://www.google.com/maps/search/Mirpur+Dhaka',
                'is_active'       => true,
            ],
        ];

        $chambers = [];
        foreach ($chambersData as $cd) {
            $chambers[] = Chamber::firstOrCreate(
                ['doctor_id' => $doctorId, 'name' => $cd['name']],
                $cd + ['doctor_id' => $doctorId]
            );
        }

        [$chamberDhanmondi, $chamberUttara, $chamberGulshan, $chamberMirpur] = $chambers;

        $this->command->info('✓ 4 Chambers created.');

        // ──────────────────────────────────────────────────────────────────────
        // 3. Doctor Schedules per Chamber
        //
        // Bangladesh week: Friday = main holiday (DOW 5)
        //   Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
        //
        //  Chamber           Days                      Slots
        //  ──────────────────────────────────────────────────────
        //  Dhanmondi         Sat,Mon,Tue,Wed (eve)    5pm–9pm  20min
        //  Uttara Clinic     Sun,Thu         (morn)   9am–1pm  15min
        //  Gulshan Medical   Mon,Wed,Thu     (eve)    6pm–9pm  20min
        //  Mirpur General    Sat,Sun         (morn)   9am–12pm 20min
        // ──────────────────────────────────────────────────────────────────────
        $scheduleConfig = [
            // [chamber, open_days, start, end, slot_minutes]
            [$chamberDhanmondi, [6, 1, 2, 3], '17:00:00', '21:00:00', 20],
            [$chamberUttara,    [0, 4],        '09:00:00', '13:00:00', 15],
            [$chamberGulshan,   [1, 3, 4],     '18:00:00', '21:00:00', 20],
            [$chamberMirpur,    [6, 0],        '09:00:00', '12:00:00', 20],
        ];

        foreach ($scheduleConfig as [$chamber, $openDays, $startTime, $endTime, $slotMin]) {
            for ($dow = 0; $dow <= 6; $dow++) {
                $isOpen   = in_array($dow, $openDays, true);
                $isClosed = ! $isOpen;

                // updateOrCreate uses [doctor_id, day_of_week] as unique key
                // So we update existing schedules from DoctorSeeder if they exist
                $schedule = DoctorSchedule::updateOrCreate(
                    ['doctor_id' => $doctorId, 'day_of_week' => $dow],
                    [
                        'chamber_id'   => $chamber->id,
                        'is_closed'    => $isClosed,
                        'start_time'   => $isOpen ? $startTime : null,
                        'end_time'     => $isOpen ? $endTime : null,
                        'slot_minutes' => $slotMin,
                    ]
                );

                // Delete old ranges then recreate for open days
                DoctorScheduleRange::where('doctor_id', $doctorId)
                    ->where('chamber_id', $chamber->id)
                    ->where('day_of_week', $dow)
                    ->delete();

                if ($isOpen) {
                    DoctorScheduleRange::create([
                        'doctor_id'   => $doctorId,
                        'chamber_id'  => $chamber->id,
                        'day_of_week' => $dow,
                        'start_time'  => $startTime,
                        'end_time'    => $endTime,
                    ]);
                }
            }
        }

        $this->command->info('✓ Chamber schedules created.');

        // ──────────────────────────────────────────────────────────────────────
        // 4. Patients (12 realistic Bangladeshi profiles)
        // ──────────────────────────────────────────────────────────────────────
        $patientsData = [
            // name, email, phone, dob, age, gender, weight_kg, address
            ['Md. Karim Hossain',       'karim.hossain@example.com',      '+88 01811-112233', '1988-03-15', 38, 'male',   75.5, 'বাড়ি ১২, রোড ৫, মিরপুর-২, ঢাকা'],
            ['Nasrin Sultana',           'nasrin.sultana@example.com',      '+88 01912-223344', '1992-07-22', 33, 'female', 58.0, 'ফ্ল্যাট ৫/এ, ধানমন্ডি-৮, ঢাকা'],
            ['Abdullah Al Mamun',        'abdullah.mamun@example.com',      '+88 01713-334455', '1985-11-10', 40, 'male',   82.0, 'বাড়ি ৭, সেক্টর ৪, উত্তরা, ঢাকা'],
            ['Taslima Akter',            'taslima.akter@example.com',       '+88 01514-445566', '1995-02-18', 31, 'female', 55.0, 'বাড়ি ৩, রোড ২১, বনানী, ঢাকা'],
            ['Rafiqul Islam',            'rafiqul.islam@example.com',       '+88 01816-556677', '1978-09-25', 47, 'male',   78.5, 'বাড়ি ৪৫, মোহাম্মদপুর টাউন হল, ঢাকা'],
            ['Shirin Akhter',            'shirin.akhter@example.com',       '+88 01717-667788', '1990-06-12', 35, 'female', 62.0, 'ফ্ল্যাট ৩, বাশুন্ধরা আর/এ, ঢাকা'],
            ['Habibur Rahman',           'habibur.rahman@example.com',      '+88 01618-778899', '1983-12-30', 42, 'male',   85.0, 'গুলশান-১, ঢাকা ১২১২'],
            ['Farhana Yasmin',           'farhana.yasmin@example.com',      '+88 01819-889900', '1993-04-08', 33, 'female', 60.0, 'বাড়ি ২২, লালমাটিয়া, ঢাকা'],
            ['Mizanur Rahman',           'mizan.rahman@example.com',        '+88 01720-990011', '1987-01-20', 39, 'male',   70.0, 'বাড়ি ৬, খিলগাঁও, ঢাকা'],
            ['Sharmin Jahan',            'sharmin.jahan@example.com',       '+88 01821-001122', '1991-08-14', 34, 'female', 56.0, 'রামপুরা, ঢাকা ১২১৯'],
            ['Jahangir Alam',            'jahangir.alam@example.com',       '+88 01622-112233', '1980-05-05', 45, 'male',   88.0, 'মতিঝিল, ঢাকা ১০০০'],
            ['Rokeya Begum',             'rokeya.begum@example.com',        '+88 01923-223344', '1986-10-28', 39, 'female', 65.0, 'শান্তিনগর, ঢাকা ১২১৭'],
        ];

        $patients = [];
        foreach ($patientsData as [$name, $email, $phone, $dob, $age, $gender, $weight, $address]) {
            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'              => $name,
                    'username'          => $email,
                    'phone'             => $phone,
                    'password'          => Hash::make('password'),
                    'role_id'           => $patientRole->id,
                    'email_verified_at' => now(),
                ]
            );

            Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'date_of_birth' => $dob,
                    'age'           => $age,
                    'gender'        => $gender,
                    'weight'        => $weight,
                    'address'       => $address,
                ]
            );

            $patients[] = ['user' => $user, 'name' => $name, 'age' => $age, 'gender' => $gender, 'phone' => $phone, 'weight' => $weight];
        }

        $this->command->info('✓ 12 Patients created.');

        // ──────────────────────────────────────────────────────────────────────
        // 5. Appointment & Prescription data pools
        // ──────────────────────────────────────────────────────────────────────
        $symptomsPool = [
            'জ্বর, মাথাব্যথা ও শরীরে ব্যথা (Fever, headache and body ache)',
            'পেটব্যথা, বমিভাব ও ক্ষুধামন্দা (Stomach pain, nausea and loss of appetite)',
            'সর্দি, কাশি ও গলাব্যথা (Cold, cough and sore throat)',
            'উচ্চ রক্তচাপ নিয়ন্ত্রণ (Blood pressure management)',
            'ডায়াবেটিস ফলো-আপ ও HbA1c পর্যবেক্ষণ (Diabetes follow-up)',
            'বুকে ব্যথা ও শ্বাসকষ্ট (Chest pain and shortness of breath)',
            'চর্মরোগ — চুলকানি ও র‍্যাশ (Skin disease — itching and rash)',
            'মাইগ্রেন ও মাথা ঘোরা (Migraine and dizziness)',
            'অ্যালার্জি ও ঘন ঘন হাঁচি (Allergy and frequent sneezing)',
            'পিঠব্যথা ও ঘাড়ব্যথা (Back pain and neck pain)',
            'প্রস্রাবে জ্বালাপোড়া (Burning sensation during urination)',
            'ওজন বৃদ্ধি ও থাইরয়েড সমস্যা (Weight gain and thyroid issues)',
            'নিয়মিত স্বাস্থ্য পরীক্ষা (Routine health checkup)',
            'ঘুমের সমস্যা ও উদ্বেগ (Sleep disorder and anxiety)',
        ];

        $diagnosesPool = [
            'ভাইরাল জ্বর (Viral Fever)',
            'ব্যাকটেরিয়াল টনসিলাইটিস (Bacterial Tonsillitis)',
            'গ্যাস্ট্রাইটিস / পেপটিক আলসার রোগ (Gastritis / Peptic Ulcer Disease)',
            'টাইপ-২ ডায়াবেটিস মেলিটাস — নিয়ন্ত্রিত (Type 2 Diabetes Mellitus — controlled)',
            'টাইপ-২ ডায়াবেটিস মেলিটাস — অনিয়ন্ত্রিত (Type 2 Diabetes Mellitus — uncontrolled)',
            'প্রাথমিক উচ্চ রক্তচাপ (Essential Hypertension)',
            'সংযুক্ত উচ্চ রক্তচাপ ও ডায়াবেটিস (Hypertension with Diabetes)',
            'মাইগ্রেন উইথআউট অরা (Migraine without Aura)',
            'অ্যালার্জিক রাইনাইটিস (Allergic Rhinitis)',
            'ঊর্ধ্ব শ্বাসনালীর সংক্রমণ — URTI (Upper Respiratory Tract Infection)',
            'তীব্র ব্রঙ্কাইটিস (Acute Bronchitis)',
            'একজিমা / ডার্মাটাইটিস (Eczema / Dermatitis)',
            'মাস্কুলোস্কেলেটাল পেইন — লো-ব্যাক (Musculoskeletal Pain — lower back)',
            'ইউটিআই (মূত্রনালীর সংক্রমণ) — UTI (Urinary Tract Infection)',
            'আয়রন-ডেফিসিয়েন্সি অ্যানেমিয়া (Iron-Deficiency Anaemia)',
            'হাইপোথাইরয়েডিজম (Hypothyroidism)',
            'তীব্র গ্যাস্ট্রোএন্টেরাইটিস (Acute Gastroenteritis)',
        ];

        // Medications stored as: "MedicineName Strength - dosage - duration - timing"
        $medicationsPool = [
            // Viral fever
            "Napa Extend 665mg - 1+0+1 - 5 দিন - After meal\nAce Plus 500mg - 1+1+1 (জ্বর ১০১+ হলে / if fever >101°F) - 3 দিন - After meal",

            // Tonsillitis / URTI
            "Amoxicillin 500mg - 1+1+1 - 7 দিন - After meal\nNapa 500mg - 1+0+1 - 5 দিন - After meal\nAnti 20mg - 1+0+0 - 14 দিন - After meal",

            // Gastritis
            "Seclo 20mg - 1+0+1 - 14 দিন - Before meal\nGaviscon Advance সিরাপ - 10ml করে - 10 মিলি - After meal\nDomperidone 10mg - 1+0+1 - 7 দিন - Before meal",

            // Diabetes (controlled)
            "Metformin 500mg - 0+1+1 - 30 দিন - After meal\nGlipizide 5mg - 1+0+0 - 30 দিন - Before meal",

            // Diabetes (uncontrolled)
            "Metformin XR 1000mg - 1+0+1 - 30 দিন - After meal\nGliclazide MR 60mg - 1+0+0 - 30 দিন - Before meal\nRosuvastatin 10mg - 0+0+1 - 30 দিন - After meal",

            // Hypertension
            "Amlodipine 5mg - 1+0+0 - 30 দিন - After meal\nLosartan 50mg - 1+0+0 - 30 দিন - After meal",

            // Hypertension + Diabetes combined
            "Amlodipine 5mg - 1+0+0 - 30 দিন - After meal\nMetformin 500mg - 0+0+1 - 30 দিন - After meal\nRosuvastatin 10mg - 0+0+1 - 30 দিন - After meal",

            // Migraine
            "Sumatriptan 50mg - 1 (মাইগ্রেন শুরু হলে / at onset) - As needed - After meal\nTopiramate 25mg - 0+0+1 - 30 দিন - After meal\nNaproxen 250mg - 1+0+1 - 5 দিন - After meal",

            // Allergic Rhinitis
            "Fexofenadine 120mg - 1+0+0 - 7 দিন - After meal\nNazal Aqua নেজাল স্প্রে - 2 puffs each nostril - 14 দিন - After meal\nMontelukast 10mg - 0+0+1 - 14 দিন - After meal",

            // Bronchitis
            "Azithromycin 500mg - 1+0+0 - 5 দিন - After meal\nSalbutamol 2mg - 1+1+1 - 7 দিন - After meal\nAmbrolite সিরাপ - 10ml - 10 মিলি - After meal",

            // Eczema
            "Cetirizine 10mg - 0+0+1 - 14 দিন - After meal\nMometasone Cream - পাতলা প্রলেপ - 14 দিন - After meal\nEmollient লোশন - সকাল ও রাতে",

            // Lower back pain
            "Etoricoxib 90mg - 0+0+1 - 7 দিন - After meal\nMethocarbamol 500mg - 1+1+1 - 5 দিন - After meal\nOmeprazole 20mg - 1+0+0 - 7 দিন - Before meal",

            // UTI
            "Nitrofurantoin 100mg - 1+0+1 - 7 দিন - After meal\nCiprofloxacin 500mg - 1+0+1 - 5 দিন - After meal\nAlkaline mixture - 10ml - তিনবার",

            // Anaemia
            "Ferrous Fumarate 200mg - 0+1+0 - 30 দিন - After meal\nFolic Acid 5mg - 1+0+0 - 30 দিন - After meal\nVitamin C 500mg - 1+0+0 - 30 দিন - After meal",

            // Hypothyroidism
            "Thyroxine 50mcg - 1+0+0 - 30 দিন - Before meal\nCalcium + Vit-D3 - 0+0+1 - 30 দিন - After meal",
        ];

        $instructionsPool = [
            'পর্যাপ্ত পানি পান করুন (দৈনিক ৮-১০ গ্লাস)। বিশ্রাম নিন। ঠাণ্ডা ও মসলাজাতীয় খাবার এড়িয়ে চলুন। (Drink 8–10 glasses of water daily. Take rest. Avoid cold and spicy foods.)',
            'সময়মতো খাবার খান। খালি পেটে থাকবেন না। চা-কফি ও ধূমপান বর্জন করুন। (Eat on time. Do not skip meals. Avoid tea, coffee and smoking.)',
            'প্রতিদিন সকালে ৩০ মিনিট হাঁটুন। মিষ্টি, ভাত ও সাদা আটা কম খান। কাঁচা শাকসবজি ও ফল বেশি খান। (Walk 30 minutes daily. Reduce sweets, rice and refined flour. Eat more vegetables and fruits.)',
            'লবণ কম খান (দৈনিক ৫গ্রামের কম)। নিয়মিত রক্তচাপ মাপুন। মানসিক চাপ কম রাখুন। ধূমপান ও মদ পরিহার করুন। (Reduce salt intake [< 5g/day]. Monitor BP regularly. Reduce stress. Avoid smoking and alcohol.)',
            'ধুলাবালি ও ধোঁয়া এড়িয়ে চলুন। মাস্ক পরুন। ঠাণ্ডা পানি পান করবেন না। বিছানা ও বালিশের কভার নিয়মিত ধুন। (Avoid dust and smoke. Use mask. Do not drink cold water. Wash bed covers regularly.)',
            'ঘামানোর পরে সাথে সাথে গোসল করবেন না। ত্বক শুকনো রাখুন। অ্যালকোহলযুক্ত সাবান ব্যবহার করবেন না। (Do not bathe immediately after sweating. Keep skin dry. Avoid alcohol-based soap.)',
            'পর্যাপ্ত ঘুমান (রাতে ৭–৮ ঘণ্টা)। স্ক্রিন টাইম কমান। নিয়মিত ব্যায়াম করুন। অ্যান্টিবায়োটিক কোর্স সম্পূর্ণ করুন। (Sleep 7–8 hours at night. Reduce screen time. Exercise regularly. Complete the antibiotic course.)',
            'পানিশূন্যতা এড়াতে ঘন ঘন পানি ও ওরস্যালাইন পান করুন। বাইরের খাবার খাবেন না। ফুটানো পানি পান করুন। (Frequently drink water and ORS to prevent dehydration. Avoid outside food. Drink boiled water.)',
            'থাইরয়েড ওষুধ খালি পেটে, সকালে নিন। ক্যালসিয়াম ও আয়রন থাইরয়েড ওষুধের সাথে এক সময়ে নেবেন না। (Take thyroid medication on empty stomach in the morning. Do not take calcium or iron at the same time as thyroid medication.)',
            'রক্তশূন্যতার জন্য আয়রনযুক্ত খাবার বেশি খান: কলা, খেজুর, কচু, ডাল, পালংশাক। ভিটামিন সি সমৃদ্ধ ফল (লেবু, আমলকী) খান। (Eat iron-rich foods: banana, dates, taro, lentils, spinach. Eat citrus fruits rich in Vitamin C.)',
        ];

        $testsPool = [
            'CBC (সম্পূর্ণ রক্তগণনা), ESR',
            'RBS (এলোমেলো রক্ত শর্করা), HbA1c',
            'FBS (ফাস্টিং ব্লাড সুগার), 2h PPG',
            'HbA1c, Lipid Profile (TC, TG, LDL, HDL)',
            'Serum Creatinine, eGFR, Urine R/E',
            'Chest X-ray PA view',
            'ECG (১২-লিড)',
            'Urine R/E, Urine C/S',
            'Thyroid Function Test (TSH, Free T3, Free T4)',
            'Liver Function Test (LFT)',
            'S. Calcium, Vitamin D3 level',
            null,
            null,
            null,
        ];

        // ──────────────────────────────────────────────────────────────────────
        // 6. Generate appointments
        //    Each patient gets 2–4 appointments distributed across chambers
        // ──────────────────────────────────────────────────────────────────────
        $today           = Carbon::today();
        $usedSlotsByDate = []; // [date][chamber_id] => [time, ...]
        $appointmentCount = 0;
        $prescriptionCount = 0;

        // Map chamber → available time slots based on schedule
        $chamberSlots = [
            $chamberDhanmondi->id => ['17:00:00','17:20:00','17:40:00','18:00:00','18:20:00','18:40:00','19:00:00','19:20:00','19:40:00','20:00:00','20:20:00','20:40:00'],
            $chamberUttara->id    => ['09:00:00','09:15:00','09:30:00','09:45:00','10:00:00','10:15:00','10:30:00','10:45:00','11:00:00','11:15:00','11:30:00','11:45:00','12:00:00','12:15:00','12:30:00','12:45:00'],
            $chamberGulshan->id   => ['18:00:00','18:20:00','18:40:00','19:00:00','19:20:00','19:40:00','20:00:00','20:20:00','20:40:00'],
            $chamberMirpur->id    => ['09:00:00','09:20:00','09:40:00','10:00:00','10:20:00','10:40:00','11:00:00','11:20:00','11:40:00'],
        ];

        // Map chamber → open days-of-week
        $chamberOpenDays = [
            $chamberDhanmondi->id => [1, 2, 3, 6],
            $chamberUttara->id    => [0, 4],
            $chamberGulshan->id   => [1, 3, 4],
            $chamberMirpur->id    => [0, 6],
        ];

        foreach ($patients as $pidx => $patientInfo) {
            /** @var User $patient */
            $patient    = $patientInfo['user'];
            $apptCount  = ($pidx < 4) ? 4 : (($pidx < 8) ? 3 : 2); // first 4 patients get more history

            for ($i = 0; $i < $apptCount; $i++) {
                // Pick a random chamber
                $chamber     = $chambers[array_rand($chambers)];
                $chamberId   = $chamber->id;
                $openDays    = $chamberOpenDays[$chamberId];
                $slotOptions = $chamberSlots[$chamberId];

                // Find available date + slot
                $date = null;
                $time = null;
                $attempts = 0;

                while ($attempts < 80) {
                    $attempts++;

                    // Spread across: past 45 days → today → future 20 days
                    $offset = ($i === 0 || $i === 1)
                        ? random_int(-45, -3)   // history
                        : (($i === $apptCount - 1) ? random_int(1, 20) : random_int(-2, 5)); // future / today area

                    $candidate = Carbon::today()->addDays($offset)->toDateString();
                    $dow       = Carbon::parse($candidate)->dayOfWeek;

                    if (! in_array($dow, $openDays, true)) {
                        continue;
                    }

                    $usedKey   = "{$candidate}:{$chamberId}";
                    $usedTimes = $usedSlotsByDate[$usedKey] ?? [];
                    $freeTimes = array_values(array_diff($slotOptions, $usedTimes));

                    if (empty($freeTimes)) {
                        continue;
                    }

                    $date = $candidate;
                    $time = $freeTimes[array_rand($freeTimes)];
                    $usedSlotsByDate[$usedKey][] = $time;
                    break;
                }

                if (! $date || ! $time) {
                    continue;
                }

                $appointmentDay = Carbon::parse($date)->startOfDay();

                if ($appointmentDay->lt($today)) {
                    $statusPool = ['prescribed', 'prescribed', 'prescribed', 'cancelled'];
                } elseif ($appointmentDay->eq($today)) {
                    $statusPool = ['scheduled', 'arrived', 'in_consultation', 'awaiting_tests'];
                } else {
                    $statusPool = ['scheduled', 'scheduled', 'scheduled'];
                }

                $status = $statusPool[array_rand($statusPool)];

                // Compute serial number per date+chamber
                $serial = count($usedSlotsByDate["{$date}:{$chamberId}"] ?? []);

                $appointment = Appointment::create([
                    'user_id'          => $patient->id,
                    'doctor_id'        => $doctorId,
                    'chamber_id'       => $chamberId,
                    'appointment_date' => $date,
                    'appointment_time' => $time,
                    'serial_no'        => $serial,
                    'status'           => $status,
                    'symptoms'         => $symptomsPool[array_rand($symptomsPool)],
                    'age'              => $patientInfo['age'],
                    'gender'           => $patientInfo['gender'],
                ]);

                $appointmentCount++;

                // ── Prescriptions for "prescribed" appointments ──────────────
                if ($status === 'prescribed') {
                    $hasFollowUp = (random_int(1, 100) <= 65);
                    $diag        = $diagnosesPool[array_rand($diagnosesPool)];
                    $meds        = $medicationsPool[array_rand($medicationsPool)];
                    $instr       = $instructionsPool[array_rand($instructionsPool)];
                    $tests       = $testsPool[array_rand($testsPool)];

                    Prescription::create([
                        'appointment_id'  => $appointment->id,
                        'user_id'         => $patient->id,
                        'doctor_id'       => $doctorId,
                        'visit_type'      => (random_int(0, 1) ? 'Follow-up' : 'New'),
                        'diagnosis'       => $diag,
                        'medications'     => $meds,
                        'instructions'    => $instr,
                        'tests'           => $tests,
                        'next_visit_date' => $hasFollowUp
                            ? Carbon::parse($date)->addDays(random_int(7, 30))->toDateString()
                            : null,
                    ]);

                    $prescriptionCount++;
                }
            }
        }

        // ──────────────────────────────────────────────────────────────────────
        // 7. Summary
        // ──────────────────────────────────────────────────────────────────────
        $this->command->info("✓ {$appointmentCount} Appointments created.");
        $this->command->info("✓ {$prescriptionCount} Prescriptions created.");
        $this->command->newLine();
        $this->command->info('═══════════════════════════════════════════════');
        $this->command->info('  Bangladeshi Demo Seeder — সম্পন্ন হয়েছে ✓');
        $this->command->info('═══════════════════════════════════════════════');
        $this->command->table(
            ['Role', 'Email', 'Password'],
            [
                ['Admin',      'admin@example.com',            'password'],
                ['Doctor',     'doctor@example.com',           'password'],
                ['Compounder', 'imran.compounder@example.com', 'password'],
                ['Compounder', 'fatema.compounder@example.com','password'],
                ['Patient',    'karim.hossain@example.com',    'password'],
                ['Patient',    'nasrin.sultana@example.com',   'password'],
                ['Patient',    '(+ 10 more patients)',         'password'],
            ]
        );
    }
}
