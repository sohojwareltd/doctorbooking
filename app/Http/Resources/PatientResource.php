<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Patient
 */
class PatientResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'user_id'       => $this->user_id,
            'name'          => $this->user?->name,
            'username'      => $this->user?->username,
            'email'         => $this->user?->email,
            'phone'         => $this->user?->phone,
            'date_of_birth' => $this->date_of_birth?->toDateString(),
            'age'           => $this->age,
            'gender'        => $this->gender,
            'weight'        => $this->weight,
            'address'       => $this->address,
            'created_at'    => $this->created_at?->toDateTimeString(),
        ];
    }
}
