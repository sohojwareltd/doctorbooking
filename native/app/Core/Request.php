<?php

declare(strict_types=1);

namespace App\Core;

final class Request
{
    private array $routeParams = [];

    private array $attributes = [];

    public function __construct(
        private readonly string $method,
        private readonly string $uri,
        private readonly array $query,
        private readonly array $post,
        private readonly array $server,
        private readonly array $cookies,
        private readonly array $files,
        private readonly string $rawBody,
    ) {}

    public static function capture(): self
    {
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
        $raw = file_get_contents('php://input') ?: '';

        return new self(
            $method,
            '/' . ltrim($uri, '/'),
            $_GET,
            $_POST,
            $_SERVER,
            $_COOKIE,
            $_FILES,
            $raw,
        );
    }

    public function method(): string
    {
        $override = $this->post['_method'] ?? $this->server['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;

        if ($override && in_array(strtoupper((string) $override), ['PUT', 'PATCH', 'DELETE'], true)) {
            return strtoupper((string) $override);
        }

        return $this->method;
    }

    public function uri(): string
    {
        return $this->uri;
    }

    public function path(): string
    {
        return $this->uri;
    }

    public function is(string $pattern): bool
    {
        $pattern = '/' . ltrim($pattern, '/');

        if (str_ends_with($pattern, '*')) {
            return str_starts_with($this->uri, rtrim($pattern, '*'));
        }

        return $this->uri === $pattern;
    }

    public function expectsJson(): bool
    {
        $accept = $this->header('Accept', '');

        return str_contains($accept, 'application/json') || $this->is('api/*');
    }

    public function header(string $name, ?string $default = null): ?string
    {
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));

        return $this->server[$key] ?? $default;
    }

    public function bearerToken(): ?string
    {
        $header = $this->header('Authorization');

        if ($header && preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
            return trim($matches[1]);
        }

        return null;
    }

    public function ip(): string
    {
        return $this->server['REMOTE_ADDR'] ?? '0.0.0.0';
    }

    public function userAgent(): string
    {
        return $this->server['HTTP_USER_AGENT'] ?? '';
    }

    public function fullUrl(): string
    {
        $scheme = (! empty($this->server['HTTPS']) && $this->server['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $this->server['HTTP_HOST'] ?? 'localhost';
        $query = $this->server['QUERY_STRING'] ?? '';

        return $scheme . '://' . $host . $this->uri . ($query !== '' ? '?' . $query : '');
    }

    public function input(string $key, mixed $default = null): mixed
    {
        $json = $this->json();

        if (is_array($json) && array_key_exists($key, $json)) {
            return $json[$key];
        }

        return $this->post[$key] ?? $this->query[$key] ?? $default;
    }

    public function all(): array
    {
        return array_merge($this->query, $this->post, $this->json() ?? []);
    }

    public function json(): ?array
    {
        if ($this->rawBody === '') {
            return null;
        }

        $decoded = json_decode($this->rawBody, true);

        return is_array($decoded) ? $decoded : null;
    }

    public function validate(array $rules): array
    {
        return Validator::make($this->all(), $rules)->validate();
    }

    public function setRouteParams(array $params): void
    {
        $this->routeParams = $params;
    }

    public function route(string $key, mixed $default = null): mixed
    {
        return $this->routeParams[$key] ?? $default;
    }

    public function setAttribute(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    public function getAttribute(string $key, mixed $default = null): mixed
    {
        return $this->attributes[$key] ?? $default;
    }

    public function user(): ?\App\Models\User
    {
        return Auth::getInstance()->user();
    }
}
