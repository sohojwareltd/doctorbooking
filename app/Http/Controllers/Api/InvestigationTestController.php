<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\InvestigationTest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvestigationTestController extends Controller
{
    /** GET /api/doctor/investigation-tests */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $items = InvestigationTest::query()
            ->latest('id')
            ->limit(50)
            ->get(['id', 'name'])
            ->map(fn (InvestigationTest $item) => [
                'id' => $item->id,
                'name' => $item->name,
            ])
            ->values();

        return response()->json(['items' => $items]);
    }

    /** POST /api/doctor/investigation-tests */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $item = InvestigationTest::create([
            'name' => trim((string) $validated['name']),
        ]);

        return response()->json([
            'message' => 'Investigation test created successfully.',
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
            ],
        ], 201);
    }

    /** PUT /api/doctor/investigation-tests/{item} */
    public function update(Request $request, InvestigationTest $item): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $item->update([
            'name' => trim((string) $validated['name']),
        ]);

        return response()->json([
            'message' => 'Investigation test updated successfully.',
            'item' => [
                'id' => $item->id,
                'name' => $item->name,
            ],
        ]);
    }

    /** DELETE /api/doctor/investigation-tests/{item} */
    public function destroy(Request $request, InvestigationTest $item): JsonResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole('doctor') || $user->hasRole('compounder'), 403);

        $item->delete();

        return response()->json(['message' => 'Investigation test deleted successfully.']);
    }
}
