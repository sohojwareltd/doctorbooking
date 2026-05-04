<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PrescriptionTemplate extends Model
{
    protected $fillable = [
        'name',
        'chief_complaints',
        'oe',
        'investigations',
        'instructions',
        'created_by',
    ];

    protected $casts = [
        'chief_complaints' => 'array',
        'investigations' => 'array',
    ];

    public function medicines(): HasMany
    {
        return $this->hasMany(PrescriptionTemplateMedicine::class, 'template_id')->orderBy('id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
