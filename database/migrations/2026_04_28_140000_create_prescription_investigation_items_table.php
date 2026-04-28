<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('prescription_investigation_items')) {
            Schema::create('prescription_investigation_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('prescription_id')->constrained('prescriptions')->cascadeOnDelete();
                $table->string('name', 255);
                $table->string('note', 1000)->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['prescription_id', 'sort_order'], 'pii_prescription_sort_idx');
            });
        }

        DB::table('prescriptions')
            ->select(['id', 'tests'])
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                $insertRows = [];
                $now = now();

                foreach ($rows as $row) {
                    $lines = collect(explode("\n", (string) ($row->tests ?? '')))
                        ->map(fn ($line) => trim((string) $line))
                        ->filter(fn ($line) => $line !== '')
                        ->values();

                    foreach ($lines as $index => $line) {
                        $insertRows[] = [
                            'prescription_id' => $row->id,
                            'name' => $line,
                            'note' => null,
                            'sort_order' => $index,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ];
                    }
                }

                if (!empty($insertRows)) {
                    DB::table('prescription_investigation_items')->insert($insertRows);
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('prescription_investigation_items');
    }
};
