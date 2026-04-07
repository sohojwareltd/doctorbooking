<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Chamber;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ChamberController extends Controller
{
    /** GET /doctor/chambers */
    public function index(): Response
    {
        $doctor   = Auth::user();
        $chambers = Chamber::where('doctor_id', $doctor->doctorId())
            ->orderBy('name')
            ->get()
            ->map(fn ($c) => [
                'id'              => $c->id,
                'name'            => $c->name,
                'location'        => $c->location,
                'phone'           => $c->phone,
                'google_maps_url' => $c->google_maps_url,
                'is_active'       => (bool) $c->is_active,
            ]);

        return Inertia::render('doctor/Chambers', ['chambers' => $chambers]);
    }

    /** POST /doctor/chambers */
    public function save(Request $request): RedirectResponse
    {
        $doctor    = Auth::user();
        $validated = $request->validate([
            'id'              => ['nullable', 'integer'],
            'name'            => ['required', 'string', 'max:255'],
            'location'        => ['nullable', 'string', 'max:255'],
            'phone'           => ['nullable', 'string', 'max:50'],
            'google_maps_url' => ['nullable', 'string', 'max:2048'],
            'is_active'       => ['sometimes', 'boolean'],
        ]);

        $data = [
            'doctor_id'       => $doctor->doctorId(),
            'name'            => $validated['name'],
            'location'        => $validated['location'] ?? null,
            'phone'           => $validated['phone'] ?? null,
            'google_maps_url' => $validated['google_maps_url'] ?? null,
            'is_active'       => $validated['is_active'] ?? true,
        ];

        if (! empty($validated['id'])) {
            Chamber::where('doctor_id', $doctor->doctorId())->where('id', $validated['id'])->firstOrFail()->update($data);
        } else {
            Chamber::create($data);
        }

        return redirect()->back()->with('success', 'Chamber saved successfully.');
    }

    /** DELETE /doctor/chambers/{chamber} */
    public function destroy(Chamber $chamber): RedirectResponse
    {
        abort_unless($chamber->doctor_id === Auth::user()->doctorId(), 403);
        $chamber->delete();

        return redirect()->back()->with('success', 'Chamber deleted successfully.');
    }
}
