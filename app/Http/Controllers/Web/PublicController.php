<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Chamber;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PublicController extends Controller
{
    public function home(): Response
    {
        $homeContent = null;
        $chambers    = [];

        if (Schema::hasTable('site_contents')) {
            $homeContent = SiteContent::where('key', 'home')->first()?->value;
        }
        $homeContent = SiteContent::normalizeValue($homeContent);

        $doctor = null;
        if (Schema::hasTable('users')) {
            $doctor = User::whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();

            if ($doctor && Schema::hasTable('chambers')) {
                $chambers = Chamber::where('doctor_id', $doctor->doctorId())
                    ->where('is_active', true)
                    ->orderBy('name')
                    ->get(['id', 'name', 'location', 'phone', 'google_maps_url'])
                    ->map(fn ($c) => [
                        'id'              => $c->id,
                        'name'            => $c->name,
                        'location'        => $c->location,
                        'phone'           => $c->phone,
                        'google_maps_url' => $c->google_maps_url,
                    ])
                    ->all();
            }
        }

        return Inertia::render('Welcome', [
            'home'     => $homeContent,
            'doctor'   => $doctor,
            'chambers' => $chambers,
        ]);
    }

    public function about(): Response
    {
        return Inertia::render('public/About');
    }

    public function contact(): Response
    {
        return Inertia::render('public/Contact');
    }

    public function bookAppointment(): \Illuminate\Http\RedirectResponse|Response
    {
        $user = auth()->user();

        if ($user?->hasRole('compounder')) {
            return redirect()->route('compounder.book-appointment');
        }

        if ($user?->hasRole('patient')) {
            return redirect()->route('patient.book-appointment');
        }

        return Inertia::render('public/BookAppointment');
    }
}
