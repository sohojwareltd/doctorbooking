<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class SiteContentApiController extends Controller
{
    /**
     * Public: fetch the home site content JSON (used by Flutter/mobile).
     */
    public function home(): JsonResponse
    {
        if (!Schema::hasTable('site_contents')) {
            return response()->json([
                'key' => 'home',
                'value' => null,
            ]);
        }

        $home = SiteContent::where('key', 'home')->first()?->value;
        $home = SiteContent::normalizeValue($home);

        return response()->json([
            'key' => 'home',
            'value' => $home,
        ]);
    }

    /**
     * Admin: update the home site content JSON.
     */
    public function updateHome(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'home_json' => ['required', 'string'],
        ]);

        $decoded = json_decode($validated['home_json'], true);

        if (!is_array($decoded)) {
            return response()->json([
                'message' => 'Invalid JSON. Please provide a valid JSON object.',
                'errors' => ['home_json' => ['Invalid JSON. Please provide a valid JSON object.']],
            ], 422);
        }

        $decoded = SiteContent::normalizeValue($decoded);

        SiteContent::updateOrCreate(
            ['key' => 'home'],
            ['value' => $decoded]
        );

        return response()->json([
            'message' => 'Site content updated successfully.',
            'key' => 'home',
            'value' => $decoded,
        ]);
    }

    /**
     * Admin: upload an image and get a public URL.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => ['required', 'file', 'image', 'max:5120'],
        ]);

        $directory = public_path('site-content');
        File::ensureDirectoryExists($directory);

        $file = $validated['image'];
        $extension = $file->getClientOriginalExtension() ?: 'jpg';
        $filename = Str::random(40).'.'.$extension;

        $file->move($directory, $filename);

        return response()->json([
            'url' => '/site-content/'.$filename,
        ]);
    }
}
