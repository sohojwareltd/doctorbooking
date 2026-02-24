<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('chambers', function (Blueprint $table) {
            if (!Schema::hasColumn('chambers', 'google_maps_url')) {
                $table->string('google_maps_url', 2048)->nullable()->after('location');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chambers', function (Blueprint $table) {
            if (Schema::hasColumn('chambers', 'google_maps_url')) {
                $table->dropColumn('google_maps_url');
            }
        });
    }
};

