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
            // Make user_id nullable to support guest bookings
            $table->foreignId('user_id')->nullable()->change();
            
            // Add guest fields (name, phone, email already exist, adding age and gender)
            $table->integer('age')->nullable()->after('symptoms');
            $table->enum('gender', ['male', 'female', 'other'])->nullable()->after('age');
            
            // Track if this is a guest booking or authenticated user
            $table->boolean('is_guest')->default(false)->after('gender');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Revert user_id back to required (this might fail if there are NULL values)
            // You might need to handle this manually in production
            
            $table->dropColumn(['age', 'gender', 'is_guest']);
        });
    }
};
