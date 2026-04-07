<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Compounder profile — one-to-one with User (role: compounder).
 * Replaces the old "admin" role. Manages clinic day-to-day operations.
 */
class Compounder extends Model
{
    protected $fillable = ['user_id', 'designation'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
