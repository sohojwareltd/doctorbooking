<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Appointment
 */
class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'serial_no'        => $this->serial_no,
            'is_guest'         => (bool) $this->is_guest,
            'appointment_date' => $this->appointment_date?->toDateString(),
            'appointment_time' => substr((string) $this->appointment_time, 0, 5),
            'estimated_start_time' => $this->estimated_start_time
                ? substr((string) $this->estimated_start_time, 0, 5)
                : null,
            'status'           => $this->status,
            'symptoms'         => $this->symptoms,
            'notes'            => $this->notes,

            // Patient info — registered user takes priority, then guest fields
            'patient_name'     => $this->user?->name ?? $this->name,
            'patient_phone'    => $this->user?->phone ?? $this->phone,
            'patient_email'    => $this->user?->email ?? $this->email,
            'patient_age'      => $this->age,
            'patient_gender'   => $this->gender,

            // Relationships (only when loaded)
            'user'             => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'doctor'           => $this->whenLoaded('doctor', fn () => [
                'id'   => $this->doctor->id,
                'name' => $this->doctor->user?->name,
            ]),
            'chamber'          => $this->whenLoaded('chamber', fn () => $this->chamber
                ? ['id' => $this->chamber->id, 'name' => $this->chamber->name]
                : null),
            'has_prescription'  => $this->when(
                $this->relationLoaded('prescription'),
                fn () => $this->prescription !== null
            ),
            'prescription_id'  => $this->when(
                $this->relationLoaded('prescription'),
                fn () => $this->prescription?->id
            ),
            'created_at'       => $this->created_at?->toDateTimeString(),
        ];
    }
}
