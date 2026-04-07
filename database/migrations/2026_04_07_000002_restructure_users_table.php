<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Step 1: Add new columns ─────────────────────────────────────────
        Schema::table('users', function (Blueprint $table) {
            // Primary login identifier (email or phone number)
            if (! Schema::hasColumn('users', 'username')) {
                $table->string('username')->nullable()->unique()->after('name');
            }

            // FK to roles (doctor / patient / compounder)
            if (! Schema::hasColumn('users', 'role_id')) {
                $table->foreignId('role_id')->nullable()->after('username')->constrained('roles')->nullOnDelete();
            }

            // Phone (some users may only have phone, no email)
            if (! Schema::hasColumn('users', 'phone')) {
                $table->string('phone')->nullable()->after('role_id');
            }
        });

        // ── Step 2: Backfill username & role_id from legacy columns ─────────
        $doctorId     = DB::table('roles')->where('name', 'doctor')->value('id');
        $patientId    = DB::table('roles')->where('name', 'patient')->value('id');
        $compounderId = DB::table('roles')->where('name', 'compounder')->value('id');

        // username ← email (primary identifier for existing users)
        DB::table('users')->whereNull('username')->update([
            'username' => DB::raw('email'),
        ]);

        // role_id ← legacy role string
        DB::table('users')->where('role', 'doctor')->update(['role_id' => $doctorId]);
        DB::table('users')->where('role', 'user')->update(['role_id' => $patientId]);
        DB::table('users')->where('role', 'admin')->update(['role_id' => $compounderId]);

        // Default any unmapped users to patient
        DB::table('users')->whereNull('role_id')->update(['role_id' => $patientId]);

        // ── Step 3: Make username NOT nullable; keep role_id nullable (FK uses SET NULL) ──
        Schema::table('users', function (Blueprint $table) {
            $table->string('username')->nullable(false)->change();

            // Email is now optional (users may authenticate via phone only)
            $table->string('email')->nullable()->change();
        });
        // role_id stays nullable — required by the nullOnDelete FK constraint.

        // ── Step 4: Drop columns that now live in profile tables ─────────────
        $legacyCols = [
            'role',
            'address',
            'date_of_birth',
            'age',
            'gender',
            'weight',
            'specialization',
            'degree',
            'registration_no',
            'profile_picture',
            'bio',
            'experience',
            'about_content',
            'two_factor_secret',
            'two_factor_recovery_codes',
            'two_factor_confirmed_at',
        ];

        $toDrop = array_filter($legacyCols, fn ($col) => Schema::hasColumn('users', $col));

        if (! empty($toDrop)) {
            Schema::table('users', function (Blueprint $table) use ($toDrop) {
                $table->dropColumn(array_values($toDrop));
            });
        }
    }

    public function down(): void
    {
        // Re-add legacy string role column
        Schema::table('users', function (Blueprint $table) {
            // Drop new columns
            if (Schema::hasColumn('users', 'username')) {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            }
            if (Schema::hasColumn('users', 'role_id')) {
                $table->dropConstrainedForeignId('role_id');
            }

            // Restore role enum
            $table->enum('role', ['user', 'doctor', 'admin'])->default('user');
            $table->string('email')->nullable(false)->change();
        });
    }
};
