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
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();
        $wantsJson = $request->expectsJson() || $request->is('api/*');

        if (!$user) {
            if ($wantsJson) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }

            return redirect('/login');
        }

        if ($user->role !== $role) {
            if ($wantsJson) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            abort(403, 'Unauthorized access.');
        }

        return $next($request);
    }
}
