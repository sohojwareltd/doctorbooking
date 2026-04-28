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
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'dose')) {
                $table->text('dose')->nullable()->after('medications');
            }
        });

        if (Schema::hasColumn('prescriptions', 'medicine_items') && Schema::hasColumn('prescriptions', 'dose')) {
            DB::table('prescriptions')
                ->select(['id', 'medicine_items'])
                ->orderBy('id')
                ->chunkById(200, function ($rows): void {
                    foreach ($rows as $row) {
                        $items = json_decode($row->medicine_items ?? '[]', true);
                        if (!is_array($items) || empty($items)) {
                            continue;
                        }

                        $doses = collect($items)
                            ->map(fn ($item) => trim((string) ($item['strength'] ?? $item['dose'] ?? '')))
                            ->filter(fn ($value) => $value !== '')
                            ->values()
                            ->all();

                        if (empty($doses)) {
                            continue;
                        }

                        DB::table('prescriptions')
                            ->where('id', $row->id)
                            ->update(['dose' => implode("\n", $doses)]);
                    }
                });
        }

        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'medicine_items')) {
                $table->dropColumn('medicine_items');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('prescriptions', 'medicine_items')) {
                $table->json('medicine_items')->nullable()->after('medications');
            }

            if (Schema::hasColumn('prescriptions', 'dose')) {
                $table->dropColumn('dose');
            }
        });
    }
};
