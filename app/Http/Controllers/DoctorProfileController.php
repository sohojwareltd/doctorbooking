<?php

namespace App\Http\Controllers;

use App\Models\SiteContent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DoctorProfileController extends Controller
{
    private function currentDoctor(): User
    {
        return User::with('doctorProfile')->findOrFail((int) Auth::id());
    }

    /**
     * Show the doctor''s profile.
     */
    public function show()
    {
        $user   = $this->currentDoctor();
        $doctor = $user->doctorProfile;
        $about  = $doctor?->about_content ?? [];

        $aboutParagraphs = isset($about['paragraphs']) && is_array($about['paragraphs'])
            ? array_values(array_filter($about['paragraphs'], fn ($item) => filled($item)))
            : [];

        return Inertia::render('doctor/Profile', [
            'doctor' => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'phone'            => $user->phone,
                'specialization'   => $doctor?->specialization,
                'degree'           => $doctor?->degree,
                'registration_no'  => $doctor?->registration_no,
                'profile_picture'  => $doctor?->profile_picture ? asset('storage/' . $doctor->profile_picture) : null,
                'hero_image'       => $doctor?->hero_image ? asset('storage/' . $doctor->hero_image) : null,
                'bio'              => $doctor?->bio,
                'about_subtitle'              => $about['subtitle'] ?? null,
                'about_bio_details'           => !empty($aboutParagraphs)
                    ? implode("\n\n", $aboutParagraphs)
                    : ($doctor?->bio ?? null),
                'about_credentials_title'     => $about['credentialsTitle'] ?? null,
                'about_credentials_text'      => isset($about['credentials']) && is_array($about['credentials'])
                    ? implode("\n", $about['credentials'])
                    : null,
                'about_highlight_value'              => $about['highlight']['value'] ?? null,
                'about_highlight_label'              => $about['highlight']['label'] ?? null,
                'about_stats_patients_treated'       => $about['stats'][0]['value'] ?? null,
                'about_stats_years_experience'       => $about['stats'][1]['value'] ?? null,
                'about_stats_patient_satisfaction'   => $about['stats'][2]['value'] ?? null,
                'about_stats_medical_cases'          => $about['stats'][3]['value'] ?? null,
            ],
            'branding' => $this->getBrandingFromHomeContent(),
        ]);
    }

    private function getBrandingFromHomeContent(): array
    {
        if (!Schema::hasTable('site_contents')) {
            return [
                'favicon_url' => null,
                'brand_logo_url' => null,
                'sidebar_logo_url' => null,
                'chamber_icon_url' => null,
            ];
        }

        $homeContent = SiteContent::where('key', 'home')->first()?->value;
        $homeContent = SiteContent::normalizeValue($homeContent);

        return [
            'favicon_url' => data_get($homeContent, 'branding.faviconUrl') ?: null,
            'brand_logo_url' => data_get($homeContent, 'branding.brandLogoUrl') ?: null,
            'sidebar_logo_url' => data_get($homeContent, 'branding.sidebarLogoUrl') ?: null,
            'chamber_icon_url' => data_get($homeContent, 'branding.chamberIconUrl') ?: null,
        ];
    }

    public function updateBrandingIcons(Request $request)
    {
        $validated = $request->validate([
            'favicon_url' => ['nullable', 'string', 'max:2048'],
            'brand_logo_url' => ['nullable', 'string', 'max:2048'],
            'sidebar_logo_url' => ['nullable', 'string', 'max:2048'],
            'chamber_icon_url' => ['nullable', 'string', 'max:2048'],
        ]);

        if (!Schema::hasTable('site_contents')) {
            return back()->with('error', 'Site content table not found.');
        }

        $home = SiteContent::where('key', 'home')->first()?->value;
        $home = SiteContent::normalizeValue($home);
        $home = is_array($home) ? $home : [];

        $branding = [
            'faviconUrl' => $validated['favicon_url'] ?? null,
            'brandLogoUrl' => $validated['brand_logo_url'] ?? null,
            'sidebarLogoUrl' => $validated['sidebar_logo_url'] ?? null,
            'chamberIconUrl' => $validated['chamber_icon_url'] ?? null,
        ];

        $home['branding'] = $branding;

        SiteContent::updateOrCreate(
            ['key' => 'home'],
            ['value' => $home]
        );

        return back()->with('success', 'Branding icons updated successfully.');
    }

    public function uploadBrandingImage(Request $request): JsonResponse
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

    /**
     * Update the doctor''s profile.
     */
    public function update(Request $request)
    {
        $user = $this->currentDoctor();

        $validated = $request->validate([
            'name'                              => ['required', 'string', 'max:255'],
            'email'                             => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone'                             => ['nullable', 'string', 'max:20'],
            'specialization'                    => ['nullable', 'string', 'max:255'],
            'degree'                            => ['nullable', 'string', 'max:500'],
            'registration_no'                   => ['nullable', 'string', 'max:100'],
            'about_subtitle'                    => ['nullable', 'string', 'max:255'],
            'about_bio_details'                 => ['nullable', 'string', 'max:6000'],
            'about_credentials_title'           => ['nullable', 'string', 'max:255'],
            'about_credentials_text'            => ['nullable', 'string', 'max:4000'],
            'about_highlight_value'             => ['nullable', 'string', 'max:50'],
            'about_highlight_label'             => ['nullable', 'string', 'max:100'],
            'about_stats_patients_treated'      => ['nullable', 'string', 'max:50'],
            'about_stats_years_experience'      => ['nullable', 'string', 'max:50'],
            'about_stats_patient_satisfaction'  => ['nullable', 'string', 'max:50'],
            'about_stats_medical_cases'         => ['nullable', 'string', 'max:50'],
        ]);

        $paragraphs = collect(
            preg_split('/\r\n\s*\r\n|\r\s*\r|\n\s*\n/', (string) ($validated['about_bio_details'] ?? ''))
        )
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();

        $credentials = collect(preg_split('/\r\n|\r|\n/', (string) ($validated['about_credentials_text'] ?? '')))
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();

        $aboutContent = [
            'subtitle'          => $validated['about_subtitle'] ?? null,
            'paragraphs'        => $paragraphs,
            'credentialsTitle'  => $validated['about_credentials_title'] ?? null,
            'credentials'       => $credentials,
            'highlight'         => [
                'value' => $validated['about_highlight_value'] ?? null,
                'label' => $validated['about_highlight_label'] ?? null,
            ],
            'stats' => [
                ['icon' => 'Users',    'value' => $validated['about_stats_patients_treated']      ?? null, 'label' => 'Patients Treated'],
                ['icon' => 'Award',    'value' => $validated['about_stats_years_experience']       ?? null, 'label' => 'Years Experience'],
                ['icon' => 'Heart',    'value' => $validated['about_stats_patient_satisfaction']   ?? null, 'label' => 'Patient Satisfaction'],
                ['icon' => 'BookOpen', 'value' => $validated['about_stats_medical_cases']          ?? null, 'label' => 'Medical Cases'],
            ],
        ];

        // Update lean user columns
        $user->update([
            'name'  => $validated['name'],
            'email' => $validated['email'] ?? $user->email,
            'phone' => $validated['phone'] ?? null,
        ]);

        // Update or create doctor profile
        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            [
                'specialization' => $validated['specialization'] ?? null,
                'degree'         => $validated['degree'] ?? null,
                'registration_no'=> $validated['registration_no'] ?? null,
                'bio'            => $paragraphs[0] ?? null,
                'about_content'  => $aboutContent,
            ]
        );

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Upload profile picture.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:10240'],
        ]);

        $user   = $this->currentDoctor();
        $doctor = $user->doctorProfile;

        // Delete old photo if exists
        if ($doctor?->profile_picture && Storage::disk('public')->exists($doctor->profile_picture)) {
            Storage::disk('public')->delete($doctor->profile_picture);
        }

        $path = $request->file('photo')->store('profile-pictures', 'public');

        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            ['profile_picture' => $path]
        );

        return back()->with('success', 'Profile photo updated successfully.');
    }

    /**
     * Delete profile picture.
     */
    public function deletePhoto()
    {
        $user   = $this->currentDoctor();
        $doctor = $user->doctorProfile;

        if ($doctor?->profile_picture && Storage::disk('public')->exists($doctor->profile_picture)) {
            Storage::disk('public')->delete($doctor->profile_picture);
        }

        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            ['profile_picture' => null]
        );

        return back()->with('success', 'Profile photo removed successfully.');
    }

    public function uploadHeroImage(Request $request)
    {
        $request->validate([
            'hero_image' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:4096'],
        ]);

        $user = $this->currentDoctor();
        $doctor = $user->doctorProfile;

        if ($doctor?->hero_image && Storage::disk('public')->exists($doctor->hero_image)) {
            Storage::disk('public')->delete($doctor->hero_image);
        }

        $path = $request->file('hero_image')->store('hero-images', 'public');

        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            ['hero_image' => $path]
        );

        return back()->with('success', 'Hero image updated successfully.');
    }

    public function deleteHeroImage()
    {
        $user = $this->currentDoctor();
        $doctor = $user->doctorProfile;

        if ($doctor?->hero_image && Storage::disk('public')->exists($doctor->hero_image)) {
            Storage::disk('public')->delete($doctor->hero_image);
        }

        $user->doctorProfile()->updateOrCreate(
            ['user_id' => $user->id],
            ['hero_image' => null]
        );

        return back()->with('success', 'Hero image removed successfully.');
    }
}
