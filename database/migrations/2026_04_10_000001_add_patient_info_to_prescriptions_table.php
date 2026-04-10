<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->string('name')->nullable()->after('doctor_id');
            $table->string('phone')->nullable()->after('name');
            $table->string('gender')->nullable()->after('phone');
            $table->unsignedSmallInteger('age')->nullable()->after('gender');
            $table->string('address')->nullable()->after('age');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['name', 'phone', 'gender', 'age', 'address']);
        });
    }
};
