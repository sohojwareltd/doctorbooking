<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed dynamic data
        $this->call([
            AdminSeeder::class,
            DoctorSeeder::class,
            SampleDataSeeder::class,
            SiteContentSeeder::class,
        ]);
    }
}
