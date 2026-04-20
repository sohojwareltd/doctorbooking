<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->string('template_type', 50)
                ->nullable()
                ->after('visit_type');
            $table->json('specialty_data')
                ->nullable()
                ->after('template_type');
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $table->dropColumn(['template_type', 'specialty_data']);
        });
    }
};