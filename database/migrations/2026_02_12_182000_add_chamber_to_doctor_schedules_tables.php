<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (!Schema::hasColumn('doctor_schedules', 'chamber_id')) {
                $table->foreignId('chamber_id')->nullable()->after('doctor_id')->constrained('chambers')->nullOnDelete();
            }
        });

        Schema::table('doctor_schedule_ranges', function (Blueprint $table) {
            if (!Schema::hasColumn('doctor_schedule_ranges', 'chamber_id')) {
                $table->foreignId('chamber_id')->nullable()->after('doctor_id')->constrained('chambers')->nullOnDelete();
            }

            $table->index(['doctor_id', 'chamber_id', 'day_of_week'], 'doctor_schedule_ranges_doctor_chamber_day_index');
        });
    }

    public function down(): void
    {
        Schema::table('doctor_schedule_ranges', function (Blueprint $table) {
            if (Schema::hasColumn('doctor_schedule_ranges', 'chamber_id')) {
                $table->dropForeign(['chamber_id']);
                $table->dropColumn('chamber_id');
            }
            $table->dropIndex('doctor_schedule_ranges_doctor_chamber_day_index');
        });

        Schema::table('doctor_schedules', function (Blueprint $table) {
            if (Schema::hasColumn('doctor_schedules', 'chamber_id')) {
                $table->dropForeign(['chamber_id']);
                $table->dropColumn('chamber_id');
            }
        });
    }
};

