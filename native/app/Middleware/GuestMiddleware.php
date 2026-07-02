<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

final class GuestMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        if (Auth::getInstance()->check()) {
            $user = Auth::getInstance()->user();
            $role = $user?->roleName();

            $redirect = match ($role) {
                'doctor', 'compounder' => '/doctor/dashboard',
                'patient' => '/patient/dashboard',
                default => '/dashboard',
            };

            return Response::redirect($redirect);
        }

        return $next($request);
    }
}
