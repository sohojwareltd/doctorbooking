<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with username + password.
     * username can be username, email, or phone used during registration.
     *
     * POST /api/auth/login
     * Body: { username, password, device_name? }
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $identifier = trim((string) $request->username);
        $user = User::with('role')
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        $deviceName = $request->device_name ?? 'api-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Register a new patient account.
     *
     * POST /api/auth/register
     * Body (JSON):
     *   name         string  required
     *   email        string  required if phone absent  (unique)
     *   phone        string  required if email absent  (unique)
     *   password     string  required – minimum 8 characters
     *   password_confirmation  string  required
     *   device_name  string  optional (defaults to "mobile-app")
     *
     * The value sent (email or phone) is stored as `username`.
     * Login uses: POST /api/auth/login  { username, password }
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['nullable', 'email:rfc,dns', 'max:255', 'unique:users,email', 'unique:users,username'],
            'phone' => ['nullable', 'string', 'max:50', 'unique:users,phone', 'unique:users,username'],
            'password' => [
                'required',
                'confirmed',
                PasswordRule::min(8),
            ],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        // At least one of email or phone is required
        if (empty($validated['email']) && empty($validated['phone'])) {
            throw ValidationException::withMessages([
                'email' => ['Provide at least an email or a phone number.'],
            ]);
        }

        // email takes priority as username; falls back to phone
        $username = $validated['email'] ?? $validated['phone'];
        $isPhoneOnly = empty($validated['email']) && ! empty($validated['phone']);

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        $user = User::create([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role_id' => $patientRole->id,
            'email_verified_at' => $isPhoneOnly ? now() : null,
        ]);

        Patient::create(['user_id' => $user->id]);

        event(new Registered($user));

        $user->load('role');

        $deviceName = $validated['device_name'] ?? 'mobile-app';
        $tokenResult = $user->createToken($deviceName);

        return response()->json([
            'message' => 'Account created successfully.',
            'username' => $username,
            'token' => $tokenResult->plainTextToken,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ], 201);
    }

    /**
     * Return authenticated user's booking pre-fill data (name, phone, age, gender, address).
     * Used by the public booking page to pre-fill the patient info form.
     */
    public function bookingProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $profile = $user->patientProfile;

        return response()->json([
            'name' => $user->name,
            'phone' => $user->phone,
            'email' => $user->email,
            'age' => $profile?->age,
            'gender' => $profile?->gender,
            'address' => $profile?->address,
        ]);
    }

    /**
     * Return authenticated user info.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('role');

        return response()->json(['user' => new UserResource($user)]);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Request a password reset link (JSON). Uses the account email on file.
     *
     * POST /api/auth/forgot-password
     * Body: { "username": "email@example.com" }  (email or registered username)
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'username' => ['required', 'string', 'max:255'],
        ]);

        $user = User::query()
            ->where('username', $request->username)
            ->orWhere('email', $request->username)
            ->first();

        if ($user && $user->email) {
            Password::sendResetLink(['email' => $user->email]);
        }

        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    /**
     * Complete password reset with token from email.
     *
     * POST /api/auth/reset-password
     * Body: { "email", "token", "password", "password_confirmation" }
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password): void {
                $user->forceFill([
                    'password' => $password,
                ])->save();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json(['message' => __($status)]);
        }

        return response()->json(['message' => __($status)], 422);
    }

    /**
     * Resend email verification (authenticated).
     *
     * POST /api/auth/email/resend
     */
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        if (! $user->getEmailForVerification()) {
            return response()->json(['message' => 'No email address on file to verify.'], 422);
        }

        $user->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }
}
