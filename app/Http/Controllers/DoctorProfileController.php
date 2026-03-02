<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DoctorProfileController extends Controller
{
    private function currentDoctor(): User
    {
        return User::query()->findOrFail((int) Auth::id());
    }

    /**
     * Show the doctor's profile.
     */
    public function show()
    {
        $user = $this->currentDoctor();
        $about = $user->about_content ?? [];

        return Inertia::render('doctor/Profile', [
            'doctor' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'address' => $user->address,
                'date_of_birth' => $user->date_of_birth?->toDateString(),
                'gender' => $user->gender,
                'specialization' => $user->specialization,
                'degree' => $user->degree,
                'registration_no' => $user->registration_no,
                'profile_picture' => $user->profile_picture ? asset('storage/' . $user->profile_picture) : null,
                'bio' => $user->bio,
                'experience' => $user->experience,
                'about_subtitle' => $about['subtitle'] ?? null,
                'about_paragraph_1' => $about['paragraphs'][0] ?? null,
                'about_paragraph_2' => $about['paragraphs'][1] ?? null,
                'about_paragraph_3' => $about['paragraphs'][2] ?? null,
                'about_credentials_title' => $about['credentialsTitle'] ?? null,
                'about_credentials_text' => isset($about['credentials']) && is_array($about['credentials'])
                    ? implode("\n", $about['credentials'])
                    : null,
                'about_highlight_value' => $about['highlight']['value'] ?? null,
                'about_highlight_label' => $about['highlight']['label'] ?? null,
                'about_stats_patients_treated' => $about['stats'][0]['value'] ?? null,
                'about_stats_years_experience' => $about['stats'][1]['value'] ?? null,
                'about_stats_patient_satisfaction' => $about['stats'][2]['value'] ?? null,
                'about_stats_medical_cases' => $about['stats'][3]['value'] ?? null,
            ],
        ]);
    }

    /**
     * Update the doctor's profile.
     */
    public function update(Request $request)
    {
        $user = $this->currentDoctor();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'specialization' => ['nullable', 'string', 'max:255'],
            'degree' => ['nullable', 'string', 'max:500'],
            'registration_no' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:3000'],
            'experience' => ['nullable', 'integer', 'min:0', 'max:80'],
            'about_subtitle' => ['nullable', 'string', 'max:255'],
            'about_paragraph_1' => ['nullable', 'string', 'max:2000'],
            'about_paragraph_2' => ['nullable', 'string', 'max:2000'],
            'about_paragraph_3' => ['nullable', 'string', 'max:2000'],
            'about_credentials_title' => ['nullable', 'string', 'max:255'],
            'about_credentials_text' => ['nullable', 'string', 'max:4000'],
            'about_highlight_value' => ['nullable', 'string', 'max:50'],
            'about_highlight_label' => ['nullable', 'string', 'max:100'],
            'about_stats_patients_treated' => ['nullable', 'string', 'max:50'],
            'about_stats_years_experience' => ['nullable', 'string', 'max:50'],
            'about_stats_patient_satisfaction' => ['nullable', 'string', 'max:50'],
            'about_stats_medical_cases' => ['nullable', 'string', 'max:50'],
        ]);

        $paragraphs = collect([
            $validated['about_paragraph_1'] ?? null,
            $validated['about_paragraph_2'] ?? null,
            $validated['about_paragraph_3'] ?? null,
        ])->filter(fn ($item) => filled($item))->values()->all();

        $credentials = collect(preg_split('/\r\n|\r|\n/', (string) ($validated['about_credentials_text'] ?? '')))
            ->map(fn ($item) => trim((string) $item))
            ->filter(fn ($item) => $item !== '')
            ->values()
            ->all();

        $aboutContent = [
            'subtitle' => $validated['about_subtitle'] ?? null,
            'paragraphs' => $paragraphs,
            'credentialsTitle' => $validated['about_credentials_title'] ?? null,
            'credentials' => $credentials,
            'highlight' => [
                'value' => $validated['about_highlight_value'] ?? null,
                'label' => $validated['about_highlight_label'] ?? null,
            ],
            'stats' => [
                ['icon' => 'Users', 'value' => $validated['about_stats_patients_treated'] ?? null, 'label' => 'Patients Treated'],
                ['icon' => 'Award', 'value' => $validated['about_stats_years_experience'] ?? null, 'label' => 'Years Experience'],
                ['icon' => 'Heart', 'value' => $validated['about_stats_patient_satisfaction'] ?? null, 'label' => 'Patient Satisfaction'],
                ['icon' => 'BookOpen', 'value' => $validated['about_stats_medical_cases'] ?? null, 'label' => 'Medical Cases'],
            ],
        ];

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'date_of_birth' => $validated['date_of_birth'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'degree' => $validated['degree'] ?? null,
            'registration_no' => $validated['registration_no'] ?? null,
            'bio' => $validated['bio'] ?? null,
            'experience' => $validated['experience'] ?? null,
            'about_content' => $aboutContent,
        ]);

        return back()->with('success', 'Profile updated successfully.');
    }

    /**
     * Upload profile picture.
     */
    public function uploadPhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:2048'],
        ]);

        $user = $this->currentDoctor();

        // Delete old photo if exists
        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        // Store new photo
        $path = $request->file('photo')->store('profile-pictures', 'public');
        $user->update(['profile_picture' => $path]);

        return back()->with('success', 'Profile photo updated successfully.');
    }

    /**
     * Delete profile picture.
     */
    public function deletePhoto()
    {
        $user = $this->currentDoctor();

        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        $user->update(['profile_picture' => null]);

        return back()->with('success', 'Profile photo removed successfully.');
    }
}
