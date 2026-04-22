<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with username + password.
     * username is the email or phone used during registration.
     *
     * POST /api/auth/login
     * Body: { username, password, device_name? }
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'username'    => ['required', 'string'],
            'password'    => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $user = User::with('role')
            ->where('username', $request->username)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        $deviceName = $request->device_name ?? 'api-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
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
     *   password     string  required – min 8 chars, 1 uppercase, 1 number
     *   password_confirmation  string  required
     *   device_name  string  optional (defaults to "mobile-app")
     *
     * The value sent (email or phone) is stored as `username`.
     * Login uses: POST /api/auth/login  { username, password }
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'email'       => ['nullable', 'email:rfc,dns', 'max:255', 'unique:users,email', 'unique:users,username'],
            'phone'       => ['nullable', 'string', 'max:50', 'unique:users,phone', 'unique:users,username'],
            'password'    => [
                'required',
                'confirmed',
                Password::min(8)->mixedCase()->numbers(),
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

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        $user = User::create([
            'name'     => $validated['name'],
            'username' => $username,
            'email'    => $validated['email'] ?? null,
            'phone'    => $validated['phone'] ?? null,
            'password' => $validated['password'],
            'role_id'  => $patientRole->id,
        ]);

        $user->load('role');

        $deviceName = $validated['device_name'] ?? 'mobile-app';
        $tokenResult = $user->createToken($deviceName);

        return response()->json([
            'message'    => 'Account created successfully.',
            'username'   => $username,
            'token'      => $tokenResult->plainTextToken,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
        ], 201);
    }

    /**
     * Return authenticated user's booking pre-fill data (name, phone, age, gender, address).
     * Used by the public booking page to pre-fill the patient info form.
     */
    public function bookingProfile(Request $request): JsonResponse
    {
        $user    = $request->user();
        $profile = $user->patientProfile;

        return response()->json([
            'name'    => $user->name,
            'phone'   => $user->phone,
            'email'   => $user->email,
            'age'     => $profile?->age,
            'gender'  => $profile?->gender,
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
}
