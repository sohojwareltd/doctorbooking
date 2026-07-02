<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;
use App\Core\Session;

final class CsrfMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
            return $next($request);
        }

        if ($request->is('api/*') && $request->bearerToken()) {
            return $next($request);
        }

        $token = $request->input('_token') ?? $request->header('X-CSRF-TOKEN') ?? $request->header('X-XSRF-TOKEN');
        $sessionToken = Session::getInstance()->csrfToken();

        if (! $token || ! hash_equals($sessionToken, (string) $token)) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return Response::json(['message' => 'CSRF token mismatch.'], 419);
            }

            abort(419, 'Page Expired');
        }

        return $next($request);
    }
}
