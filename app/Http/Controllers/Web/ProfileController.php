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

    /** GET /patient/profile */
    public function patientShow(): Response
    {
        return Inertia::render('user/Profile');
    }
}
