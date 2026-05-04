<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_template_medicines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained('prescription_templates')->cascadeOnDelete();
            $table->string('medicine_name');
            $table->string('dose')->nullable();
            $table->string('duration')->nullable();
            $table->string('instruction')->nullable();
            $table->timestamps();

            $table->index('template_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_template_medicines');
    }
};
