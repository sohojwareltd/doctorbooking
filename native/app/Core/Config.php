<?php

declare(strict_types=1);

namespace App\Core;

final class Config
{
    private static array $cache = [];

    private static bool $envLoaded = false;

    public static function loadEnv(string $path): void
    {
        if (self::$envLoaded || ! is_file($path)) {
            return;
        }

        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];

        foreach ($lines as $line) {
            $line = trim($line);

            if ($line === '' || str_starts_with($line, '#')) {
                continue;
            }

            if (! str_contains($line, '=')) {
                continue;
            }

            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);

            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"'))
                || (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $value = str_replace('${APP_NAME}', $_ENV['APP_NAME'] ?? $_SERVER['APP_NAME'] ?? '', $value);

            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
            putenv($name . '=' . $value);
        }

        self::$envLoaded = true;
    }

    public static function env(string $key, mixed $default = null): mixed
    {
        if (array_key_exists($key, $_ENV)) {
            return self::castEnvValue($_ENV[$key]);
        }

        if (array_key_exists($key, $_SERVER)) {
            return self::castEnvValue($_SERVER[$key]);
        }

        $value = getenv($key);

        if ($value === false) {
            return $default;
        }

        return self::castEnvValue($value);
    }

    private static function castEnvValue(mixed $value): mixed
    {
        if (! is_string($value)) {
            return $value;
        }

        return match (strtolower($value)) {
            'true', '(true)' => true,
            'false', '(false)' => false,
            'null', '(null)' => null,
            'empty', '(empty)' => '',
            default => $value,
        };
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        if (isset(self::$cache[$key])) {
            return self::$cache[$key];
        }

        $segments = explode('.', $key);
        $file = array_shift($segments);
        $configPath = base_path('config/' . $file . '.php');

        if (! is_file($configPath)) {
            return $default;
        }

        $data = require $configPath;

        foreach ($segments as $segment) {
            if (! is_array($data) || ! array_key_exists($segment, $data)) {
                return $default;
            }

            $data = $data[$segment];
        }

        self::$cache[$key] = $data;

        return $data;
    }

    public static function clear(): void
    {
        self::$cache = [];
    }
}
