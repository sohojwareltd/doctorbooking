<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Medicine extends Model
{
    protected $fillable = ['name', 'strength', 'generic_id', 'supplier_id', 'category_id'];
    protected $table = 'medicines';

    public function generic()
    {
        return $this->belongsTo(Generic::class, 'generic_id');
    }

    public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
}
