<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PrescriptionTemplateMedicine extends Model
{
    protected $fillable = [
        'template_id',
        'medicine_name',
        'dose',
        'duration',
        'instruction',
    ];

    public function template(): BelongsTo
    {
        return $this->belongsTo(PrescriptionTemplate::class, 'template_id');
    }
}
