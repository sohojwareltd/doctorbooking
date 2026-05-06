<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = ['name', 'strength', 'generic_id'];
    protected $table = 'medicines';

    public function generic()
    {
        return $this->belongsTo(Generic::class, 'generic_id');
    }
}
