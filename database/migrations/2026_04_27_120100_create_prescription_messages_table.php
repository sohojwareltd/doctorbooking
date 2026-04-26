<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
            $table->foreignId('doctor_id')->constrained('doctors')->cascadeOnDelete();
            $table->string('phone', 50);
            $table->text('message');
            $table->timestamps();

            $table->index(['prescription_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_messages');
    }
};
