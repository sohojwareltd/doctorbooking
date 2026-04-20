<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Models\Chamber;
use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
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
            $doctor = User::with('doctorProfile')->whereHas('role', fn ($q) => $q->where('name', 'doctor'))->first();

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
            'doctor'   => $doctor ? $this->transformDoctorForPublicPage($doctor) : null,
            'chambers' => $chambers,
        ]);
    }

    private function transformDoctorForPublicPage(User $doctor): array
    {
        $profile = $doctor->doctorProfile;
        $about = $profile?->about_content ?? [];
        $aboutParagraphs = isset($about['paragraphs']) && is_array($about['paragraphs'])
            ? array_values(array_filter($about['paragraphs'], fn ($item) => filled($item)))
            : [];

        return [
            'id'                              => $doctor->id,
            'name'                            => $doctor->name,
            'email'                           => $doctor->email,
            'phone'                           => $doctor->phone,
            'specialization'                  => $profile?->specialization,
            'degree'                          => $profile?->degree,
            'registration_no'                 => $profile?->registration_no,
            'profile_picture'                 => $profile?->profile_picture ? asset('storage/' . $profile->profile_picture) : null,
            'hero_image'                      => $profile?->hero_image ? asset('storage/' . $profile->hero_image) : null,
            'bio'                             => $profile?->bio,
            'experience'                      => $profile?->experience,
            'about_subtitle'                  => $about['subtitle'] ?? null,
            'about_bio_details'               => !empty($aboutParagraphs)
                ? implode("\n\n", $aboutParagraphs)
                : ($profile?->bio ?? null),
            'about_credentials_title'         => $about['credentialsTitle'] ?? null,
            'about_credentials_text'          => isset($about['credentials']) && is_array($about['credentials'])
                ? implode("\n", $about['credentials'])
                : null,
            'about_highlight_value'           => $about['highlight']['value'] ?? null,
            'about_highlight_label'           => $about['highlight']['label'] ?? null,
            'about_stats_patients_treated'    => $about['stats'][0]['value'] ?? null,
            'about_stats_years_experience'    => $about['stats'][1]['value'] ?? null,
            'about_stats_patient_satisfaction'=> $about['stats'][2]['value'] ?? null,
            'about_stats_medical_cases'       => $about['stats'][3]['value'] ?? null,
        ];
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
        /** @var User|null $user */
        $user = Auth::user();

        if ($user?->hasRole('compounder')) {
            return redirect()->route('compounder.book-appointment');
        }

        if ($user?->hasRole('patient')) {
            return redirect()->route('patient.book-appointment');
        }

        return Inertia::render('public/BookAppointment');
    }
}
