<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Core\Request;
use App\Core\Response;

final class CorsMiddleware implements MiddlewareInterface
{
    public function handle(Request $request, callable $next): Response
    {
        $origins = (string) config('cors.allowed_origins', '*');
        $origin = $request->header('Origin', '*');
        $allowOrigin = $origins === '*' ? '*' : $origin;

        if ($request->method() === 'OPTIONS') {
            return response('')
                ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
                ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
                ->withHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN, X-XSRF-TOKEN, Accept')
                ->withHeader('Access-Control-Allow-Credentials', 'true');
        }

        $response = $next($request);

        return $response
            ->withHeader('Access-Control-Allow-Origin', $allowOrigin)
            ->withHeader('Access-Control-Allow-Credentials', 'true');
    }
}
