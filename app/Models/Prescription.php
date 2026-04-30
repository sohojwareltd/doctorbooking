<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int|null $appointment_id
 * @property int|null $user_id
 * @property int $doctor_id
 * @property string|null $visit_type
 * @property string|null $chief_complaints
 * @property array<int, array<string, mixed>>|null $oe_data
 * @property string|null $diagnosis
 * @property string|null $medications
 * @property string|null $dose
 * @property string|null $instructions
 * @property string|null $tests
 * @property \Illuminate\Support\Carbon|null $next_visit_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Prescription extends Model
{
    protected $fillable = [
        'uuid',
        'appointment_id',
        'user_id',
        'doctor_id',
        'patient_name',
        'patient_age',
        'patient_age_unit',
        'patient_gender',
        'patient_weight',
        'patient_contact',
        'name',
        'phone',
        'gender',
        'age',
        'address',
        'visit_type',
        'template_type',
        'specialty_data',
        'chief_complaints',
        'oe_data',
        'diagnosis',
        'medications',
        'dose',
        'instructions',
        'tests',
        'next_visit_date',
    ];

    protected $casts = [
        'next_visit_date' => 'date',
        'specialty_data' => 'array',
        'oe_data' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $prescription): void {
            if (empty($prescription->uuid)) {
                $prescription->uuid = (string) Str::uuid();
            }
        });
    }

    public function resolveRouteBinding($value, $field = null): ?Model
    {
        $resolvedField = $field ?? $this->getRouteKeyName();

        if ($resolvedField === $this->getRouteKeyName()) {
            return $this->newQuery()
                ->where('uuid', $value)
                ->orWhere($this->getRouteKeyName(), $value)
                ->firstOrFail();
        }

        return parent::resolveRouteBinding($value, $field);
    }

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
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }

    public function reports(): HasMany
    {
        return $this->hasMany(PatientReport::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(PrescriptionMessage::class);
    }

    public function investigationItems(): HasMany
    {
        return $this->hasMany(PrescriptionInvestigationItem::class)->orderBy('sort_order');
    }
}
