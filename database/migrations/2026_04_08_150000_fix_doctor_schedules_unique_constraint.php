<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Fix the unique constraint on doctor_schedules to include chamber_id
     * so that a doctor can have different schedules for different chambers on the same day.
     */
    public function up(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->unique(['doctor_id', 'chamber_id', 'day_of_week'], 'doctor_schedules_doctor_chamber_day_unique');
        });

        $connection = Schema::getConnection()->getDriverName();
        if ($connection === 'mysql' || $connection === 'mariadb') {
            DB::statement('ALTER TABLE doctor_schedules DROP INDEX doctor_schedules_doctor_id_day_of_week_unique');
        } else {
            Schema::table('doctor_schedules', function (Blueprint $table) {
                $table->dropUnique('doctor_schedules_doctor_id_day_of_week_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            $table->unique(['doctor_id', 'day_of_week']);
        });

        $connection = Schema::getConnection()->getDriverName();
        if ($connection === 'mysql' || $connection === 'mariadb') {
            DB::statement('ALTER TABLE doctor_schedules DROP INDEX doctor_schedules_doctor_chamber_day_unique');
        } else {
            Schema::table('doctor_schedules', function (Blueprint $table) {
                $table->dropUnique('doctor_schedules_doctor_chamber_day_unique');
            });
        }
    }
};
