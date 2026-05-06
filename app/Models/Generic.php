<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Generic extends Model
{
    protected $fillable = ['name', 'descriptions'];

    public function medicines()
    {
        return $this->hasMany(Medicine::class, 'generic_id');
    }
}
