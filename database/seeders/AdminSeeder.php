<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Ayesha Rahman',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '+880 1711-234567',
                'address' => 'Dhaka, Bangladesh',
                'gender' => 'female',
                'date_of_birth' => '1990-05-15',
                'email_verified_at' => now(),
            ]
        );
    }
}
