<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionMessage extends Model
{
    protected $fillable = [
        'prescription_id',
        'doctor_id',
        'phone',
        'message',
    ];

    public function prescription(): BelongsTo
    {
        return $this->belongsTo(Prescription::class);
    }

    public function doctor(): BelongsTo
    {
        return $this->belongsTo(Doctor::class, 'doctor_id');
    }
}
