<?php

namespace Database\Seeders;

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
        User::firstOrCreate(
            ['email' => 'doctor@example.com'],
            [
                'name' => 'Default Doctor',
                'password' => Hash::make('password'),
                'role' => 'doctor',
                'phone' => '0123456789',
            ]
        );
    }
}
