<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Patient profile — one-to-one with User (role: patient).
 */
class Patient extends Model
{
    protected $fillable = [
        'user_id',
        'date_of_birth',
        'age',
        'gender',
        'weight',
        'address',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
