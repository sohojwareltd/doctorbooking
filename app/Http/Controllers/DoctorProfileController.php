<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class DoctorProfileController extends Controller
{
    /**
     * Show the doctor's profile.
     */
    public function show()
    {
        $user = Auth::user();

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
            ],
        ]);
    }

    /**
     * Update the doctor's profile.
     */
    public function update(Request $request)
    {
        $user = Auth::user();

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
        ]);

        $user->update($validated);

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

        $user = Auth::user();

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
        $user = Auth::user();

        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        $user->update(['profile_picture' => null]);

        return back()->with('success', 'Profile photo removed successfully.');
    }
}
