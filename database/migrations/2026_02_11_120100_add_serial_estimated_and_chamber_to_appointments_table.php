<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Optional link to a chamber/location for the visit
            $table->foreignId('chamber_id')->nullable()->after('doctor_id');

            // Simple serial number for the day (per doctor + chamber + date)
            $table->unsignedInteger('serial_no')->nullable()->after('appointment_time');

            // Estimated start time for the visit (separate from raw appointment_time if needed)
            $table->time('estimated_start_time')->nullable()->after('serial_no');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'estimated_start_time')) {
                $table->dropColumn('estimated_start_time');
            }
            if (Schema::hasColumn('appointments', 'serial_no')) {
                $table->dropColumn('serial_no');
            }
            if (Schema::hasColumn('appointments', 'chamber_id')) {
                $table->dropConstrainedForeignId('chamber_id');
            }
        });
    }
};

