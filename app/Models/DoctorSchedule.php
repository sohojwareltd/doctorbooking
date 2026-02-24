<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DoctorSchedule extends Model
{
    protected $fillable = [
        'doctor_id',
        'chamber_id',
        'day_of_week',
        'start_time',
        'end_time',
        'slot_minutes',
        'is_closed',
    ];

    protected $casts = [
        'is_closed' => 'boolean',
        'day_of_week' => 'integer',
        'slot_minutes' => 'integer',
    ];

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function ranges(): HasMany
    {
        return $this->hasMany(DoctorScheduleRange::class, 'doctor_id', 'doctor_id')
            ->where('day_of_week', $this->day_of_week)
            ->orderBy('start_time');
    }
}
