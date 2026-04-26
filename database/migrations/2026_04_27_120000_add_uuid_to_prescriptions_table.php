<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (! Schema::hasColumn('prescriptions', 'uuid')) {
                $table->uuid('uuid')->nullable()->unique()->after('id');
            }
        });

        DB::table('prescriptions')
            ->select('id')
            ->whereNull('uuid')
            ->orderBy('id')
            ->chunkById(200, function ($rows) {
                foreach ($rows as $row) {
                    DB::table('prescriptions')
                        ->where('id', $row->id)
                        ->update(['uuid' => (string) Str::uuid()]);
                }
            });
    }

    public function down(): void
    {
        Schema::table('prescriptions', function (Blueprint $table) {
            if (Schema::hasColumn('prescriptions', 'uuid')) {
                $table->dropUnique(['uuid']);
                $table->dropColumn('uuid');
            }
        });
    }
};
