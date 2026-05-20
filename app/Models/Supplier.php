<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    protected $fillable = [
        'name',
        'logo',
        'registration_number',
        'vat_number',
        'industry_type',
        'contact_person',
        'contact_person_designation',
        'contact_person_email',
        'contact_person_phone',
        'company_email',
        'company_phone',
        'address',
        'city',
        'country',
        'website',
    ];

    protected $table = 'suppliers';

    public function medicines()
    {
        return $this->hasMany(Medicine::class, 'supplier_id');
    }
}
