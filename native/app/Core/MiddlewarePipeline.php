<?php

declare(strict_types=1);

namespace App\Core;

use App\Middleware\MiddlewareInterface;

final class MiddlewarePipeline
{
    /**
     * @param list<string> $middleware e.g. AuthMiddleware or RoleMiddleware:doctor,patient
     */
    public static function wrap(array $middleware, callable $destination): callable
    {
        $layers = [];

        foreach ($middleware as $entry) {
            $layers[] = self::resolve($entry);
        }

        return array_reduce(
            array_reverse($layers),
            static fn (callable $next, MiddlewareInterface $mw) => static fn (Request $request) => $mw->handle($request, $next),
            $destination
        );
    }

    private static function resolve(string $entry): MiddlewareInterface
    {
        if (str_contains($entry, ':')) {
            [$class, $params] = explode(':', $entry, 2);

            if ($class === \App\Middleware\RoleMiddleware::class || $class === 'role') {
                return new \App\Middleware\RoleMiddleware($params);
            }
        }

        $class = $entry;

        if ($class === 'auth' || $class === 'auth:sanctum') {
            $class = \App\Middleware\AuthMiddleware::class;
        }

        if ($class === 'guest') {
            $class = \App\Middleware\GuestMiddleware::class;
        }

        if ($class === 'csrf') {
            $class = \App\Middleware\CsrfMiddleware::class;
        }

        if ($class === 'cors') {
            $class = \App\Middleware\CorsMiddleware::class;
        }

        if ($class === 'role') {
            return new \App\Middleware\RoleMiddleware('');
        }

        return new $class();
    }
}
