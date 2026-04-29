<?php

namespace App\Http\Responses;

use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Return a role-safe redirect after successful authentication.
     */
    public function toResponse($request)
    {
        $user = $request->user();
        $user?->loadMissing('role');

        $intended = (string) $request->session()->pull('url.intended', '');
        $redirectTo = $this->resolveRedirectPath($user?->role?->name, $intended);

        return $request->wantsJson()
            ? response()->json(['two_factor' => false, 'redirect' => $redirectTo])
            : redirect()->to($redirectTo);
    }

    private function resolveRedirectPath(?string $roleName, string $intended): string
    {
        $default = $this->defaultPathForRole($roleName);

        if ($intended === '') {
            return $default;
        }

        $path = parse_url($intended, PHP_URL_PATH);
        if (!is_string($path) || $path === '') {
            return $default;
        }

        $normalizedPath = '/' . ltrim($path, '/');

        return $this->isPathAllowedForRole($roleName, $normalizedPath)
            ? $normalizedPath
            : $default;
    }

    private function defaultPathForRole(?string $roleName): string
    {
        return match ($roleName) {
            'doctor', 'compounder' => '/doctor/dashboard',
            'patient' => '/patient/dashboard',
            default => '/dashboard',
        };
    }

    private function isPathAllowedForRole(?string $roleName, string $path): bool
    {
        $sharedPrefixes = ['/dashboard', '/settings'];

        foreach ($sharedPrefixes as $prefix) {
            if (str_starts_with($path, $prefix)) {
                return true;
            }
        }

        return match ($roleName) {
            'doctor', 'compounder' => str_starts_with($path, '/doctor/'),
            'patient' => str_starts_with($path, '/patient/') || str_starts_with($path, '/user/'),
            default => false,
        };
    }
}
