<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescription_template_medicines', function (Blueprint $table) {
            $table->string('category_name')->nullable()->after('medicine_name');
            $table->string('strength', 60)->nullable()->after('category_name');
        });
    }

    public function down(): void
    {
        Schema::table('prescription_template_medicines', function (Blueprint $table) {
            $table->dropColumn(['category_name', 'strength']);
        });
    }
};
