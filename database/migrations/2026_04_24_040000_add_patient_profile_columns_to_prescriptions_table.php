<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('prescriptions', 'patient_name')) {
                $table->string('patient_name')->nullable()->after('doctor_id');
            }
            if (! Schema::hasColumn('prescriptions', 'patient_age')) {
                $table->string('patient_age', 10)->nullable()->after('patient_name');
            }
            if (! Schema::hasColumn('prescriptions', 'patient_age_unit')) {
                $table->string('patient_age_unit', 20)->nullable()->after('patient_age');
            }
            if (! Schema::hasColumn('prescriptions', 'patient_gender')) {
                $table->string('patient_gender', 20)->nullable()->after('patient_age_unit');
            }
            if (! Schema::hasColumn('prescriptions', 'patient_weight')) {
                $table->string('patient_weight', 20)->nullable()->after('patient_gender');
            }
            if (! Schema::hasColumn('prescriptions', 'patient_contact')) {
                $table->string('patient_contact', 50)->nullable()->after('patient_weight');
            }
        });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            $dropColumns = [];
            foreach (['patient_name', 'patient_age', 'patient_age_unit', 'patient_gender', 'patient_weight', 'patient_contact'] as $column) {
                if (Schema::hasColumn('prescriptions', $column)) {
                    $dropColumns[] = $column;
                }
            }

            if (! empty($dropColumns)) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};
