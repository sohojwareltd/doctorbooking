<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();       // doctor, patient, compounder
            $table->string('display_name');
            $table->timestamps();
        });

        DB::table('roles')->insert([
            ['name' => 'doctor',     'display_name' => 'Doctor',     'created_at' => now(), 'updated_at' => now()],
            ['name' => 'patient',    'display_name' => 'Patient',    'created_at' => now(), 'updated_at' => now()],
            ['name' => 'compounder', 'display_name' => 'Compounder', 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
