<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doctors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('specialization')->nullable();
            $table->string('degree')->nullable();
            $table->string('registration_no')->nullable();
            $table->string('profile_picture')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedSmallInteger('experience')->nullable()->comment('Years of experience');
            $table->json('about_content')->nullable();
            $table->timestamps();
        });

        // Migrate existing doctor profile data from users table (if present)
        // The old columns were dropped in the previous migration, so this only inserts
        // an empty doctor profile row to establish the FK relationship.
        $doctorRoleId = DB::table('roles')->where('name', 'doctor')->value('id');
        if ($doctorRoleId) {
            DB::table('users')
                ->where('role_id', $doctorRoleId)
                ->get(['id'])
                ->each(function ($u) {
                    DB::table('doctors')->insertOrIgnore([
                        'user_id'    => $u->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('doctors');
    }
};
