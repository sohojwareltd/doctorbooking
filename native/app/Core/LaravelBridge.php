<?php

declare(strict_types=1);

namespace App\Core;

/**
 * Delegates unmigrated routes to the existing Laravel application during phased migration.
 */
final class LaravelBridge
{
    public static function shouldFallback(Request $request): bool
    {
        return filter_var(env('LARAVEL_BRIDGE', true), FILTER_VALIDATE_BOOLEAN);
    }

    public static function handle(Request $request): void
    {
        $laravelPublic = laravel_root('public/index.php');

        if (! is_file($laravelPublic)) {
            http_response_code(503);
            echo 'Laravel bridge enabled but Laravel public/index.php was not found.';
            exit;
        }

        chdir(laravel_root('public'));
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $_SERVER['SCRIPT_FILENAME'] = $laravelPublic;

        require $laravelPublic;
        exit;
    }
}
