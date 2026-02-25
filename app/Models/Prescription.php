<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int|null $appointment_id
 * @property int|null $user_id
 * @property int $doctor_id
 * @property string|null $visit_type
 * @property string|null $diagnosis
 * @property string|null $medications
 * @property string|null $instructions
 * @property string|null $tests
 * @property \Illuminate\Support\Carbon|null $next_visit_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Prescription extends Model
{
    protected $fillable = [
        'appointment_id',
        'user_id',
        'doctor_id',
        'visit_type',
        'diagnosis',
        'medications',
        'instructions',
        'tests',
        'next_visit_date',
    ];

    protected $casts = [
        'next_visit_date' => 'date',
    ];

    public function appointment(): BelongsTo
    {
        return $this->belongsTo(Appointment::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }
}
