<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

final class RoleMiddleware implements MiddlewareInterface
{
    public function __construct(private readonly string $roles = '')
    {
    }

    public function handle(Request $request, callable $next): Response
    {
        $user = Auth::getInstance()->user();
        $allowed = array_filter(array_map('trim', explode(',', $this->roles)));
        $wantsJson = $request->expectsJson() || $request->is('api/*');

        if (! $user) {
            if ($wantsJson) {
                return Response::json(['message' => 'Unauthenticated.'], 401);
            }

            return Response::redirect('/login');
        }

        $roleName = $user->roleName();

        if (! in_array($roleName, $allowed, true)) {
            if ($wantsJson) {
                return Response::json(['message' => 'Forbidden.'], 403);
            }

            $redirectTo = match ($roleName) {
                'doctor', 'compounder' => '/doctor/dashboard',
                'patient' => '/patient/dashboard',
                default => '/dashboard',
            };

            return Response::redirect($redirectTo);
        }

        return $next($request);
    }
}
