<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('patient_reports', function (Blueprint $table) {
            $table->string('title', 255)->nullable()->after('prescription_id');
            $table->string('file_path')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('patient_reports', function (Blueprint $table) {
            $table->dropColumn('title');
            $table->string('file_path')->nullable(false)->change();
        });
    }
};
