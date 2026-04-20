<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Prescription
 */
class PrescriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'appointment_id'   => $this->appointment_id,
            'user_id'          => $this->user_id,
            'doctor_id'        => $this->doctor_id,
            'visit_type'       => $this->visit_type,
            'template_type'    => $this->template_type,
            'specialty_data'   => $this->specialty_data,
            'diagnosis'        => $this->diagnosis,
            'medications'      => $this->medications,
            'instructions'     => $this->instructions,
            'tests'            => $this->tests,
            'next_visit_date'  => $this->next_visit_date?->toDateString(),

            // Snapshot fields stored on the prescription (immutable patient info at time of visit)
            'patient_name'     => $this->patient_name,
            'patient_age'      => $this->patient_age,
            'patient_age_unit' => $this->patient_age_unit ?? 'years',
            'patient_gender'   => $this->patient_gender,
            'patient_weight'   => $this->patient_weight,
            'patient_contact'  => $this->patient_contact,

            // Relationships (only when loaded)
            'user'             => $this->whenLoaded('user', fn () => $this->user ? [
                'id'     => $this->user->id,
                'name'   => $this->user->name,
                'email'  => $this->user->email,
                'phone'  => $this->user->phone,
            ] : null),
            'doctor'           => $this->whenLoaded('doctor', fn () => $this->doctor ? [
                'id'   => $this->doctor->id,
                'name' => $this->doctor->user?->name,
            ] : null),
            'appointment'      => $this->whenLoaded('appointment', fn () => $this->appointment ? [
                'id'               => $this->appointment->id,
                'appointment_date' => (string) $this->appointment->appointment_date,
                'appointment_time' => substr((string) $this->appointment->appointment_time, 0, 5),
                'status'           => $this->appointment->status,
            ] : null),

            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
