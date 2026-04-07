<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Change doctor_id on all tables from users.id → doctors.id.
 *
 * Tables affected:
 *   chambers, doctor_schedules, doctor_schedule_ranges,
 *   doctor_unavailable_ranges, appointments, prescriptions
 */
return new class extends Migration
{
    private array $tables = [
        'chambers'                  => 'chambers_doctor_id_foreign',
        'doctor_schedules'          => 'doctor_schedules_doctor_id_foreign',
        'doctor_schedule_ranges'    => 'doctor_schedule_ranges_doctor_id_foreign',
        'doctor_unavailable_ranges' => 'doctor_unavailable_ranges_doctor_id_foreign',
        'appointments'              => 'appointments_doctor_id_foreign',
        'prescriptions'             => 'prescriptions_doctor_id_foreign',
    ];

    public function up(): void
    {
        // ── 1. Drop all doctor_id FK constraints ────────────────────────────
        foreach ($this->tables as $table => $constraint) {
            Schema::table($table, function (Blueprint $t) use ($constraint) {
                $t->dropForeign($constraint);
            });
        }

        // ── 2. Migrate data: users.id → doctors.id ──────────────────────────
        // Build a mapping: users.id => doctors.id
        $map = DB::table('doctors')->pluck('id', 'user_id'); // [user_id => doctors.id]

        foreach (array_keys($this->tables) as $table) {
            foreach ($map as $userId => $doctorId) {
                DB::table($table)
                    ->where('doctor_id', $userId)
                    ->update(['doctor_id' => $doctorId]);
            }
        }

        // ── 3. Re-add FK constraints pointing to doctors.id ─────────────────
        foreach (array_keys($this->tables) as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreign('doctor_id')
                    ->references('id')
                    ->on('doctors')
                    ->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        // Drop new constraints
        foreach (array_keys($this->tables) as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropForeign(['doctor_id']);
            });
        }

        // Revert data: doctors.id → users.id
        $map = DB::table('doctors')->pluck('user_id', 'id'); // [doctors.id => user_id]

        foreach (array_keys($this->tables) as $table) {
            foreach ($map as $doctorId => $userId) {
                DB::table($table)
                    ->where('doctor_id', $doctorId)
                    ->update(['doctor_id' => $userId]);
            }
        }

        // Restore original FK constraints to users.id
        foreach (array_keys($this->tables) as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->foreign('doctor_id')
                    ->references('id')
                    ->on('users')
                    ->onDelete('cascade');
            });
        }
    }
};
