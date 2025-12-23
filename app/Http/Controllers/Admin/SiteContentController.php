<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SiteContentController extends Controller
{
    public function edit(Request $request): Response
    {
        $home = null;

        if (Schema::hasTable('site_contents')) {
            $home = SiteContent::where('key', 'home')->first()?->value;
        }

        $home = SiteContent::normalizeValue($home);

        return Inertia::render('admin/Settings', [
            'homeJson' => $home ? json_encode($home, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) : "{}",
            'status' => $request->session()->get('status'),
        ]);
    }

    public function updateHome(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'home_json' => ['required', 'string'],
        ]);

        $decoded = json_decode($validated['home_json'], true);

        if (! is_array($decoded)) {
            return back()->withErrors([
                'home_json' => 'Invalid JSON. Please provide a valid JSON object.',
            ]);
        }

        $decoded = SiteContent::normalizeValue($decoded);

        SiteContent::updateOrCreate(
            ['key' => 'home'],
            ['value' => $decoded]
        );

        return back()->with('status', 'Site content updated successfully.');
    }

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
