<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Check if using MySQL/MariaDB (enum support)
        $connection = DB::getDriverName();
        
        if ($connection === 'mysql' || $connection === 'mariadb') {
            // First, temporarily change the column to VARCHAR to allow data updates
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status VARCHAR(50)");
            
            // Now update existing data to map old statuses to new ones
            DB::table('appointments')->where('status', 'pending')->update(['status' => 'scheduled']);
            DB::table('appointments')->where('status', 'approved')->update(['status' => 'arrived']);
            DB::table('appointments')->where('status', 'completed')->update(['status' => 'prescribed']);
            
            // Finally, set the new enum with the updated values
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'arrived', 'in_consultation', 'awaiting_tests', 'prescribed', 'cancelled') DEFAULT 'scheduled'");
        } else {
            // For SQLite and other databases
            // First update the data
            DB::table('appointments')->where('status', 'pending')->update(['status' => 'scheduled']);
            DB::table('appointments')->where('status', 'approved')->update(['status' => 'arrived']);
            DB::table('appointments')->where('status', 'completed')->update(['status' => 'prescribed']);
            
            // Then update the column definition
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('status')->default('scheduled')->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Map new statuses back to old ones
        DB::table('appointments')->where('status', 'scheduled')->update(['status' => 'pending']);
        DB::table('appointments')->where('status', 'arrived')->update(['status' => 'approved']);
        DB::table('appointments')->whereIn('status', ['in_consultation', 'awaiting_tests'])->update(['status' => 'approved']);
        DB::table('appointments')->where('status', 'prescribed')->update(['status' => 'completed']);

        $connection = DB::getDriverName();
        
        if ($connection === 'mysql' || $connection === 'mariadb') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('pending', 'approved', 'completed', 'cancelled') DEFAULT 'pending'");
        } else {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('status')->default('pending')->change();
            });
        }
    }
};
