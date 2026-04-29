<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventResponseCaching
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        // Prevent stale cached HTML/Inertia responses from breaking CSRF/session flows.
        $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, private, max-age=0');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');

        $vary = $response->headers->get('Vary');
        $varyValues = array_filter(array_map('trim', explode(',', (string) $vary)));
        if (!in_array('Cookie', $varyValues, true)) {
            $varyValues[] = 'Cookie';
        }
        $response->headers->set('Vary', implode(', ', array_filter($varyValues)));

        return $response;
    }
}
