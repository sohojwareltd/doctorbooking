<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Doctor profile — one-to-one with User (role: doctor).
 * There is only ONE doctor in this system.
 */
class Doctor extends Model
{
    protected $fillable = [
        'user_id',
        'specialization',
        'degree',
        'registration_no',
        'preferred_template_type',
        'profile_picture',
        'hero_image',
        'bio',
        'experience',
        'about_content',
    ];

    protected $casts = [
        'about_content' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * All relationships below use doctors.id directly as the FK,
     * now that doctor_id on all tables references doctors.id.
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(DoctorSchedule::class, 'doctor_id');
    }

    public function chambers(): HasMany
    {
        return $this->hasMany(Chamber::class, 'doctor_id');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(Appointment::class, 'doctor_id');
    }

    public function prescriptions(): HasMany
    {
        return $this->hasMany(Prescription::class, 'doctor_id');
    }
}
