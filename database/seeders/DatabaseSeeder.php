<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Medicine;
class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed dynamic data
        $medicines = DB::connection('mysql2')->table('products')->select('name', 'strength')->get()->toArray();
        foreach($medicines as $medicine){
            Medicine::create([
                'name'=>$medicine->name,
                'strength'=>$medicine->strength,
            ]);
        }
        $this->call([
            AdminSeeder::class,
            DoctorSeeder::class,
            SampleDataSeeder::class,
            SiteContentSeeder::class,
        ]);
    }
}
