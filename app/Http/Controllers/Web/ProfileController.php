<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Http\Controllers\DoctorProfileController;
use App\Http\Controllers\DoctorScheduleController;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Thin wrapper that delegates to the existing profile/schedule controllers.
 * All Inertia rendering happens in the dedicated legacy controllers until
 * those are eventually migrated to this Web namespace.
 */
class ProfileController extends Controller
{
    public function doctorShow(): Response
    {
        return app(DoctorProfileController::class)->show();
    }

    public function doctorUpdate(Request $request): RedirectResponse
    {
        return app(DoctorProfileController::class)->update($request);
    }

    public function doctorPhotoUpload(Request $request): mixed
    {
        return app(DoctorProfileController::class)->uploadPhoto($request);
    }

    public function doctorPhotoDelete(): mixed
    {
        return app(DoctorProfileController::class)->deletePhoto();
    }

    public function doctorHeroUpload(Request $request): mixed
    {
        return app(DoctorProfileController::class)->uploadHeroImage($request);
    }

    public function doctorHeroDelete(): mixed
    {
        return app(DoctorProfileController::class)->deleteHeroImage();
    }

    /** GET /patient/profile */
    public function patientShow(): Response
    {
        $user = Auth::user();
        $user->loadMissing('patientProfile');

        return Inertia::render('user/Profile', [
            'userData' => [
                'id'       => $user->id,
                'name'     => $user->name,
                'username' => $user->username,
                'email'    => $user->email,
                'phone'    => $user->phone,
            ],
            'profile' => $user->patientProfile ? [
                'date_of_birth' => $user->patientProfile->date_of_birth?->toDateString(),
                'age'           => $user->patientProfile->age,
                'gender'        => $user->patientProfile->gender,
                'weight'        => $user->patientProfile->weight,
                'address'       => $user->patientProfile->address,
            ] : null,
            'isSetup' => session('setup', false),
        ]);
    }
}
