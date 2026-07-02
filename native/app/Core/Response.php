<?php

declare(strict_types=1);

namespace App\Core;

final class Response
{
    public function __construct(
        private mixed $content = '',
        private int $status = 200,
        private array $headers = [],
    ) {}

    public static function json(mixed $data, int $status = 200, array $headers = []): self
    {
        $headers['Content-Type'] = 'application/json; charset=UTF-8';

        return new self(json_encode($data, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR), $status, $headers);
    }

    public static function redirect(string $url, int $status = 302): self
    {
        return new self('', $status, ['Location' => $url]);
    }

    public static function noContent(int $status = 204): self
    {
        return new self('', $status);
    }

    public function withHeader(string $name, string $value): self
    {
        $clone = clone $this;
        $clone->headers[$name] = $value;

        return $clone;
    }

    public function withCookie(
        string $name,
        string $value,
        int $expires,
        string $path = '/',
        ?string $domain = null,
        bool $secure = false,
        bool $httpOnly = true,
        string $sameSite = 'Lax',
    ): self {
        $clone = clone $this;
        $clone->headers['Set-Cookie'][] = rawurlencode($name) . '=' . rawurlencode($value)
            . '; Expires=' . gmdate('D, d M Y H:i:s T', $expires)
            . '; Path=' . $path
            . ($domain ? '; Domain=' . $domain : '')
            . ($secure ? '; Secure' : '')
            . ($httpOnly ? '; HttpOnly' : '')
            . '; SameSite=' . $sameSite;

        return $clone;
    }

    /** @return array<string, mixed> */
    public function getHeaders(): array
    {
        return $this->headers;
    }

    public function send(): void
    {
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            if ($name === 'Set-Cookie' && is_array($value)) {
                foreach ($value as $cookie) {
                    header('Set-Cookie: ' . $cookie, false);
                }

                continue;
            }

            header($name . ': ' . $value, true);
        }

        if ($this->content !== '' && $this->content !== null) {
            if (is_string($this->content)) {
                echo $this->content;
            } else {
                echo (string) $this->content;
            }
        }
    }
}
