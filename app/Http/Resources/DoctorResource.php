<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Doctor
 */
class DoctorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'user_id'         => $this->user_id,
            'name'            => $this->user?->name,
            'email'           => $this->user?->email,
            'phone'           => $this->user?->phone,
            'specialization'  => $this->specialization,
            'degree'          => $this->degree,
            'registration_no' => $this->registration_no,
            'profile_picture' => $this->profile_picture,
            'hero_image'      => $this->hero_image,
            'bio'             => $this->bio,
            'experience'      => $this->experience,
            'about_content'   => $this->about_content,
        ];
    }
}
