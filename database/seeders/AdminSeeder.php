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
                'name' => 'Site Admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'phone' => '0123456790',
                'email_verified_at' => now(),
            ]
        );
    }
}
