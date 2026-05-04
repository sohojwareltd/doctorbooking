<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prescription_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category')->nullable();
            $table->json('chief_complaints')->nullable();
            $table->text('oe')->nullable();
            $table->json('investigations')->nullable();
            $table->text('instructions')->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();

            $table->index(['created_by', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prescription_templates');
    }
};
