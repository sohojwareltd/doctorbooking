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
        $investigationItems = $this->resolveInvestigationItems();

        return [
            'id'               => $this->id,
            'uuid'             => $this->uuid,
            'appointment_id'   => $this->appointment_id,
            'user_id'          => $this->user_id,
            'doctor_id'        => $this->doctor_id,
            'visit_type'       => $this->visit_type,
            'template_type'    => $this->template_type,
            'specialty_data'   => $this->specialty_data,
            'diagnosis'        => $this->diagnosis,
            'medications'      => $this->medications,
            'dose'             => $this->dose,
            'instructions'     => $this->instructions,
            'tests'            => $this->tests,
            // Keep the original tests text for backward compatibility.
            'tests_items'      => collect($investigationItems)->pluck('name')->values(),
            'investigation_items' => $investigationItems,
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

    private function resolveInvestigationItems(): array
    {
        if ($this->relationLoaded('investigationItems')) {
            return $this->investigationItems
                ->map(fn ($item) => [
                    'id' => $item->id,
                    'name' => $item->name,
                    'note' => $item->note,
                    'sort_order' => $item->sort_order,
                ])
                ->values()
                ->all();
        }

        return collect(preg_split('/[\r\n,;]+/', strip_tags((string) ($this->tests ?? ''))) ?: [])
            ->map(fn ($line) => trim((string) $line))
            ->filter(fn ($line) => $line !== '')
            ->values()
            ->map(fn ($line, $index) => [
                'id' => null,
                'name' => $line,
                'note' => null,
                'sort_order' => $index,
            ])
            ->all();
    }
}
