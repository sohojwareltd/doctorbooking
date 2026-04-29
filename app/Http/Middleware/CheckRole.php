<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();
        $wantsJson = $request->expectsJson() || $request->is('api/*');

        if (!$user) {
            if ($wantsJson) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/login');
        }

        $user->loadMissing('role');

        if (!in_array($user->role?->name, $roles, true)) {
            if ($wantsJson) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            $redirectTo = $this->defaultPathForRole($user->role?->name);

            if ('/' . ltrim($request->path(), '/') === $redirectTo) {
                abort(403, 'Unauthorized access.');
            }

            return redirect()->to($redirectTo)->with('error', 'You do not have permission to access that page.');
        }

        return $next($request);
    }

    private function defaultPathForRole(?string $roleName): string
    {
        return match ($roleName) {
            'doctor', 'compounder' => '/doctor/dashboard',
            'patient' => '/patient/dashboard',
            default => '/dashboard',
        };
    }
}
