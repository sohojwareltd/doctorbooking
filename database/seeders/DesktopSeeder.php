<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Minimal seed for offline desktop — roles, admin, doctor, chambers only.
 * No demo patients or appointments.
 */
class DesktopSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            AdminSeeder::class,
            DoctorSeeder::class,
            SiteContentSeeder::class,
        ]);
    }
}
