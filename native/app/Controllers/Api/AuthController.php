<?php

declare(strict_types=1);

namespace App\Controllers\Api;

use App\Core\Auth;
use App\Core\Controller;
use App\Core\Database;
use App\Core\Logger;
use App\Core\Request;
use App\Core\Response;
use App\Core\ValidationException;
use App\Models\Patient;
use App\Models\Role;
use App\Models\User;

final class AuthController extends Controller
{
    public function login(Request $request): Response
    {
        $validated = $this->validate($request, [
            'username' => 'required|string|max:255',
            'password' => 'required|string',
            'device_name' => 'nullable|string|max:255',
        ]);

        $identifier = trim((string) $validated['username']);
        $row = Database::getInstance()->fetch(
            'SELECT * FROM users WHERE username = :identifier OR email = :identifier OR phone = :identifier LIMIT 1',
            ['identifier' => $identifier]
        );
        $user = $row ? User::hydrate($row) : null;

        if (! $user instanceof User || ! $user->verifyPassword((string) $validated['password'])) {
            throw new ValidationException([
                'username' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = Auth::getInstance()->createToken($user, (string) ($validated['device_name'] ?? 'api-client'));

        return $this->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->toResourceArray(),
        ]);
    }

    public function register(Request $request): Response
    {
        $validated = $this->validate($request, [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255|unique:users,email|unique:users,username',
            'phone' => 'nullable|string|max:50|unique:users,phone|unique:users,username',
            'password' => 'required|confirmed|min:8',
            'device_name' => 'nullable|string|max:255',
        ]);

        if (empty($validated['email']) && empty($validated['phone'])) {
            throw new ValidationException([
                'email' => ['Provide at least an email or a phone number.'],
            ]);
        }

        $username = $validated['email'] ?? $validated['phone'];
        $isPhoneOnly = empty($validated['email']) && ! empty($validated['phone']);

        $patientRole = Role::query()->where('name', 'patient')->first();

        if (! $patientRole) {
            abort(500, 'Patient role not configured.');
        }

        $user = new User([
            'name' => $validated['name'],
            'username' => $username,
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'role_id' => $patientRole->id,
            'email_verified_at' => $isPhoneOnly ? now()->format('Y-m-d H:i:s') : null,
        ]);
        $user->setPassword((string) $validated['password']);
        $user->save();

        Patient::create(['user_id' => $user->id]);

        $token = Auth::getInstance()->createToken($user, (string) ($validated['device_name'] ?? 'mobile-app'));

        return $this->json([
            'message' => 'Account created successfully.',
            'username' => $username,
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user->toResourceArray(),
        ], 201);
    }

    public function me(Request $request): Response
    {
        $user = Auth::getInstance()->user();

        return $this->json(['user' => $user?->toResourceArray()]);
    }

    public function logout(Request $request): Response
    {
        Auth::getInstance()->revokeCurrentToken($request->bearerToken());

        return $this->json(['message' => 'Logged out successfully.']);
    }

    public function forgotPassword(Request $request): Response
    {
        $validated = $this->validate($request, [
            'username' => 'required|string|max:255',
        ]);

        $user = User::query()
            ->where('username', $validated['username'])
            ->orWhere('email', $validated['username'])
            ->first();

        if ($user instanceof User && $user->email) {
            // Password reset mail integration hooks into native mail service (Phase 4).
            Logger::info('Password reset requested', ['email' => $user->email]);
        }

        return $this->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ]);
    }

    public function resetPassword(Request $request): Response
    {
        $validated = $this->validate($request, [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|confirmed|min:8',
        ]);

        $row = Database::getInstance()->fetch(
            'SELECT email, token FROM password_reset_tokens WHERE email = :email LIMIT 1',
            ['email' => $validated['email']]
        );

        if (! $row || ! hash_equals((string) $row['token'], hash('sha256', (string) $validated['token']))) {
            return $this->json(['message' => 'This password reset token is invalid.'], 422);
        }

        $user = User::query()->where('email', $validated['email'])->first();

        if (! $user instanceof User) {
            return $this->json(['message' => 'This password reset token is invalid.'], 422);
        }

        $user->setPassword((string) $validated['password']);
        $user->save();

        Database::getInstance()->delete('password_reset_tokens', 'email = :email', ['email' => $validated['email']]);

        return $this->json(['message' => 'Your password has been reset.']);
    }

    public function csrfCookie(Request $request): Response
    {
        return response('')->withHeader('Content-Type', 'application/json');
    }
}
