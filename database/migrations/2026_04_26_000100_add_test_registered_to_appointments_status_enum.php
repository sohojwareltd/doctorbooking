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
        $connection = DB::getDriverName();

        if ($connection === 'mysql' || $connection === 'mariadb') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'arrived', 'in_consultation', 'test_registered', 'awaiting_tests', 'prescribed', 'cancelled') DEFAULT 'scheduled'");
        } else {
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
        DB::table('appointments')->where('status', 'test_registered')->update(['status' => 'awaiting_tests']);

        $connection = DB::getDriverName();

        if ($connection === 'mysql' || $connection === 'mariadb') {
            DB::statement("ALTER TABLE appointments MODIFY COLUMN status ENUM('scheduled', 'arrived', 'in_consultation', 'awaiting_tests', 'prescribed', 'cancelled') DEFAULT 'scheduled'");
        } else {
            Schema::table('appointments', function (Blueprint $table) {
                $table->string('status')->default('scheduled')->change();
            });
        }
    }
};
