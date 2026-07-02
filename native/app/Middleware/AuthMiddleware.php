<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;

final class AuthMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        if (! Auth::getInstance()->check()) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return Response::json(['message' => 'Unauthenticated.'], 401);
            }

            return Response::redirect('/login');
        }

        return $next($request);
    }
}
