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
        // First, update existing data to map old statuses to new ones
        DB::table('appointments')->where('status', 'pending')->update(['status' => 'scheduled']);
        DB::table('appointments')->where('status', 'approved')->update(['status' => 'arrived']);
        DB::table('appointments')->where('status', 'completed')->update(['status' => 'prescribed']);

        // Check if using MySQL/MariaDB (enum support)
        $connection = DB::getDriverName();
        
        if ($connection === 'mysql' || $connection === 'mariadb') {
            // For MySQL/MariaDB, we need to modify the enum column
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'arrived', 'in_consultation', 'awaiting_tests', 'prescribed', 'cancelled') DEFAULT 'scheduled'");
        } else {
            // For SQLite and other databases, we just need to ensure the column accepts the new values
            // SQLite doesn't enforce enum constraints, so we can just update the default
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
