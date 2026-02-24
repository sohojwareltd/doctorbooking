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
            // Add guest contact fields only if they don't already exist
            if (!Schema::hasColumn('appointments', 'name')) {
                $table->string('name')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('appointments', 'phone')) {
                $table->string('phone', 50)->nullable()->after('name');
            }
            if (!Schema::hasColumn('appointments', 'email')) {
                $table->string('email')->nullable()->after('phone');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'email')) {
                $table->dropColumn('email');
            }
            if (Schema::hasColumn('appointments', 'phone')) {
                $table->dropColumn('phone');
            }
            if (Schema::hasColumn('appointments', 'name')) {
                $table->dropColumn('name');
            }
        });
    }
};

