<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        // Ensure admin role exists
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Admin']
        );

        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Ayesha Rahman',
                'username' => 'admin@example.com',
                'password' => Hash::make('password'),
                'role_id' => $adminRole->id,
                'phone' => '+880 1711-234567',
                'email_verified_at' => now(),
            ]
        );
    }
}
