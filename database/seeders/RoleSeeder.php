<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'doctor',     'display_name' => 'Doctor'],
            ['name' => 'patient',    'display_name' => 'Patient'],
            ['name' => 'compounder', 'display_name' => 'Compounder'],
        ];

        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role['name']], ['display_name' => $role['display_name']]);
        }
    }
}
