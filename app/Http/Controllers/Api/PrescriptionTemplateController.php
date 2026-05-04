<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrescriptionTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PrescriptionTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $templates = PrescriptionTemplate::query()
            ->where('created_by', $user->id)
            ->with('medicines')
            ->orderBy('name')
            ->get();

        return response()->json([
            'templates' => $templates,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'chief_complaints' => ['nullable', 'array'],
            'chief_complaints.*' => ['nullable', 'string', 'max:1000'],
            'oe' => ['nullable', 'string', 'max:10000'],
            'investigations' => ['nullable', 'array'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'medicines' => ['nullable', 'array'],
            'medicines.*.medicine_name' => ['required_with:medicines', 'string', 'max:255'],
            'medicines.*.dose' => ['nullable', 'string', 'max:255'],
            'medicines.*.duration' => ['nullable', 'string', 'max:255'],
            'medicines.*.instruction' => ['nullable', 'string', 'max:1000'],
        ]);

        $template = DB::transaction(function () use ($validated, $user) {
            $template = PrescriptionTemplate::create([
                'name' => trim((string) $validated['name']),
                'category' => null,
                'chief_complaints' => $this->normalizeStringArray($validated['chief_complaints'] ?? []),
                'oe' => $this->nullableTrimmed($validated['oe'] ?? null),
                'investigations' => $this->normalizeStringArray($validated['investigations'] ?? []),
                'instructions' => $this->nullableTrimmed($validated['instructions'] ?? null),
                'created_by' => $user->id,
            ]);

            $template->medicines()->createMany(
                $this->normalizeMedicines($validated['medicines'] ?? [])
            );

            return $template;
        });

        $template->load('medicines');

        return response()->json([
            'message' => 'Prescription template created successfully.',
            'template' => $template,
        ], 201);
    }

    public function show(Request $request, PrescriptionTemplate $template): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);
        $this->authorizeOwner($template, $user->id);

        $template->load('medicines');

        return response()->json([
            'template' => $template,
        ]);
    }

    public function update(Request $request, PrescriptionTemplate $template): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);
        $this->authorizeOwner($template, $user->id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'chief_complaints' => ['nullable', 'array'],
            'chief_complaints.*' => ['nullable', 'string', 'max:1000'],
            'oe' => ['nullable', 'string', 'max:10000'],
            'investigations' => ['nullable', 'array'],
            'instructions' => ['nullable', 'string', 'max:10000'],
            'medicines' => ['nullable', 'array'],
            'medicines.*.medicine_name' => ['required_with:medicines', 'string', 'max:255'],
            'medicines.*.dose' => ['nullable', 'string', 'max:255'],
            'medicines.*.duration' => ['nullable', 'string', 'max:255'],
            'medicines.*.instruction' => ['nullable', 'string', 'max:1000'],
        ]);

        DB::transaction(function () use ($template, $validated) {
            $template->update([
                'name' => trim((string) $validated['name']),
                'category' => null,
                'chief_complaints' => $this->normalizeStringArray($validated['chief_complaints'] ?? []),
                'oe' => $this->nullableTrimmed($validated['oe'] ?? null),
                'investigations' => $this->normalizeStringArray($validated['investigations'] ?? []),
                'instructions' => $this->nullableTrimmed($validated['instructions'] ?? null),
            ]);

            $template->medicines()->delete();
            $template->medicines()->createMany(
                $this->normalizeMedicines($validated['medicines'] ?? [])
            );
        });

        $template->load('medicines');

        return response()->json([
            'message' => 'Prescription template updated successfully.',
            'template' => $template,
        ]);
    }

    public function destroy(Request $request, PrescriptionTemplate $template): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);
        $this->authorizeOwner($template, $user->id);

        $template->delete();

        return response()->json([
            'message' => 'Prescription template deleted successfully.',
        ]);
    }

    private function authorizeOwner(PrescriptionTemplate $template, int $userId): void
    {
        abort_unless($template->created_by === $userId, 403);
    }

    private function nullableTrimmed(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    private function normalizeStringArray(array $values): array
    {
        return array_values(array_filter(array_map(function ($value) {
            return $this->nullableTrimmed($value);
        }, $values)));
    }

    private function normalizeMedicines(array $rows): array
    {
        $normalized = [];

        foreach ($rows as $row) {
            $name = $this->nullableTrimmed($row['medicine_name'] ?? null);
            if ($name === null) {
                continue;
            }

            $normalized[] = [
                'medicine_name' => $name,
                'dose' => $this->nullableTrimmed($row['dose'] ?? null),
                'duration' => $this->nullableTrimmed($row['duration'] ?? null),
                'instruction' => $this->nullableTrimmed($row['instruction'] ?? null),
            ];
        }

        return $normalized;
    }
}
