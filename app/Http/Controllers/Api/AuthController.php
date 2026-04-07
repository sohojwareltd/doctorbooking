<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Login with email OR phone + password.
     * Returns a Sanctum personal access token.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'identifier'  => ['required', 'string'],   // email or phone
            'password'    => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $identifier = $request->identifier;

        $user = User::with('role')
            ->where('username', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'identifier' => ['The provided credentials are incorrect.'],
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
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone'    => ['nullable', 'string', 'max:50'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // At least one contact is required
        if (empty($request->email) && empty($request->phone)) {
            return response()->json([
                'message' => 'Provide at least an email or a phone number.',
            ], 422);
        }

        // Derive username from email (preferred) or phone
        $username = $request->email ?? $request->phone;

        // Ensure username is unique
        if (User::where('username', $username)->exists()) {
            return response()->json([
                'message' => 'This identifier is already registered.',
            ], 422);
        }

        $patientRole = Role::where('name', 'patient')->firstOrFail();

        $user = User::create([
            'name'     => $request->name,
            'username' => $username,
            'email'    => $request->email,
            'phone'    => $request->phone,
            'password' => $request->password,
            'role_id'  => $patientRole->id,
        ]);

        $user->load('role');
        $token = $user->createToken('api-client')->plainTextToken;

        return response()->json([
            'token'      => $token,
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
