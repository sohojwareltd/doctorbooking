<?php

namespace App\Models;

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
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function prescription(): HasOne
    {
        return $this->hasOne(Prescription::class);
    }
}
