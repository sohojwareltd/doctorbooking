<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property int|null $user_id
 * @property int|null $doctor_id
 * @property int|null $chamber_id
 * @property \Illuminate\Support\Carbon|null $appointment_date
 * @property string|null $appointment_time
 * @property int|null $serial_no
 * @property string|null $estimated_start_time
 * @property string|null $status
 * @property string|null $symptoms
 * @property string|null $notes
 * @property string|null $name
 * @property string|null $phone
 * @property string|null $email
 * @property int|null $age
 * @property string|null $gender
 * @property bool|null $is_guest
 * @property-read \App\Models\User|null $user
 * @property-read \App\Models\User|null $doctor
 * @property-read \App\Models\Prescription|null $prescription
 */
class Appointment extends Model
{
    protected $fillable = [
        'user_id',
        'doctor_id',
        'chamber_id',
        'appointment_date',
        'appointment_time',
        'serial_no',
        'estimated_start_time',
        'status',
        'symptoms',
        'notes',
        // Guest appointment fields
        'name',
        'phone',
        'email',
        'age',
        'gender',
        'is_guest',
        'address',
    ];

    protected $casts = [
        'appointment_date' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    public function chamber(): BelongsTo
    {
        return $this->belongsTo(Chamber::class);
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }

    /**
     * Convenience: returns the patient display name regardless of guest/registered.
     */
    public function getPatientNameAttribute(): string
    {
        return $this->user?->name ?? $this->name ?? '';
    }

    /**
     * Check if a patient already has a non-cancelled booking
     * in the same chamber on the same date.
     */
    public static function hasDuplicatePatientBooking(
        int $doctorId,
        string $dateString,
        ?int $chamberId,
        ?int $userId = null,
        ?string $phone = null,
        ?string $email = null,
    ): bool {
        $query = static::query()
            ->where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $dateString)
            ->whereNotIn('status', ['cancelled'])
            ->when(
                $chamberId !== null,
                fn (Builder $q) => $q->where('chamber_id', $chamberId),
                fn (Builder $q) => $q->whereNull('chamber_id')
            );

        if ($userId !== null) {
            return $query->where('user_id', $userId)->exists();
        }

        $normalizedPhone = $phone !== null ? preg_replace('/\s+/', '', trim($phone)) : null;
        $normalizedEmail = $email !== null ? trim($email) : null;

        if ($normalizedPhone === null && $normalizedEmail === null) {
            return false;
        }

        return $query->where(function (Builder $q) use ($normalizedPhone, $normalizedEmail) {
            if ($normalizedPhone !== null && $normalizedPhone !== '') {
                $q->orWhereRaw('REPLACE(phone, " ", "") = ?', [$normalizedPhone]);
            }
            if ($normalizedEmail !== null && $normalizedEmail !== '') {
                $q->orWhereRaw('LOWER(email) = ?', [strtolower($normalizedEmail)]);
            }
        })->exists();
    }
}
