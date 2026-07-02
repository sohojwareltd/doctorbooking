<?php

declare(strict_types=1);

/**
 * Global helper functions for Native PHP MVC.
 */

use App\Core\Application;
use App\Core\Auth;
use App\Core\Config;
use App\Core\Response;
use App\Core\Session;
use App\Core\View;

if (! function_exists('app')) {
    function app(?string $key = null): mixed
    {
        $app = Application::getInstance();

        return $key === null ? $app : $app->make($key);
    }
}

if (! function_exists('env')) {
    function env(string $key, mixed $default = null): mixed
    {
        return Config::env($key, $default);
    }
}

if (! function_exists('config')) {
    function config(string $key, mixed $default = null): mixed
    {
        return Config::get($key, $default);
    }
}

if (! function_exists('base_path')) {
    function base_path(string $path = ''): string
    {
        $base = dirname(__DIR__);

        return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
    }
}

if (! function_exists('storage_path')) {
    function storage_path(string $path = ''): string
    {
        $base = env('STORAGE_PATH') ?: base_path('storage');

        return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
    }
}

if (! function_exists('public_path')) {
    function public_path(string $path = ''): string
    {
        $base = env('PUBLIC_PATH') ?: base_path('public');

        return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
    }
}

if (! function_exists('laravel_root')) {
    function laravel_root(string $path = ''): string
    {
        $base = env('LARAVEL_ROOT') ?: dirname(base_path());

        return $path === '' ? $base : $base . DIRECTORY_SEPARATOR . ltrim($path, '/\\');
    }
}

if (! function_exists('view')) {
    function view(string $name, array $data = []): Response
    {
        return View::render($name, $data);
    }
}

if (! function_exists('redirect')) {
    function redirect(string $url, int $status = 302): Response
    {
        return Response::redirect($url, $status);
    }
}

if (! function_exists('back')) {
    function back(int $status = 302): Response
    {
        $referer = $_SERVER['HTTP_REFERER'] ?? '/';

        return Response::redirect($referer, $status);
    }
}

if (! function_exists('url')) {
    function url(string $path = ''): string
    {
        $base = rtrim((string) config('app.url'), '/');
        $path = ltrim($path, '/');

        return $path === '' ? $base : $base . '/' . $path;
    }
}

if (! function_exists('asset')) {
    function asset(string $path): string
    {
        return url(ltrim($path, '/'));
    }
}

if (! function_exists('session')) {
    function session(?string $key = null, mixed $default = null): mixed
    {
        if ($key === null) {
            return Session::getInstance();
        }

        return Session::getInstance()->get($key, $default);
    }
}

if (! function_exists('auth')) {
    function auth(): Auth
    {
        return Auth::getInstance();
    }
}

if (! function_exists('abort')) {
    function abort(int $code, string $message = ''): never
    {
        throw new \App\Core\HttpException($code, $message ?: match ($code) {
            401 => 'Unauthorized',
            403 => 'Forbidden',
            404 => 'Not Found',
            405 => 'Method Not Allowed',
            419 => 'Page Expired',
            429 => 'Too Many Requests',
            default => 'Error',
        });
    }
}

if (! function_exists('response')) {
    function response(mixed $content = '', int $status = 200, array $headers = []): Response
    {
        return new Response($content, $status, $headers);
    }
}

if (! function_exists('json')) {
    function json(mixed $data, int $status = 200, array $headers = []): Response
    {
        return Response::json($data, $status, $headers);
    }
}

if (! function_exists('old')) {
    function old(string $key, mixed $default = ''): mixed
    {
        return Session::getInstance()->getFlash('_old.' . $key, $default);
    }
}

if (! function_exists('now')) {
    function now(): \DateTimeImmutable
    {
        return new \DateTimeImmutable('now', new \DateTimeZone((string) config('app.timezone', 'UTC')));
    }
}

if (! function_exists('csrf_token')) {
    function csrf_token(): string
    {
        return Session::getInstance()->csrfToken();
    }
}

if (! function_exists('csrf_field')) {
    function csrf_field(): string
    {
        $token = htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8');

        return '<input type="hidden" name="_token" value="' . $token . '">';
    }
}

if (! function_exists('request')) {
    function request(): ?\App\Core\Request
    {
        return $GLOBALS['native_request'] ?? null;
    }
}
