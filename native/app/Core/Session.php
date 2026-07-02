<?php

declare(strict_types=1);

namespace App\Core;

final class Session
{
    private static ?self $instance = null;

    private string $id;

    /** @var array<string, mixed> */
    private array $data = [];

    private bool $started = false;

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function start(): void
    {
        if ($this->started) {
            return;
        }

        $cookieName = $this->cookieName();
        $this->id = $_COOKIE[$cookieName] ?? $this->generateId();

        if (config('session.driver') === 'database') {
            $this->loadFromDatabase();
        } else {
            $this->data = $_SESSION ?? [];
        }

        if (! isset($this->data['_token'])) {
            $this->data['_token'] = bin2hex(random_bytes(32));
        }

        $this->started = true;
    }

    public function id(): string
    {
        return $this->id;
    }

    public function get(string $key, mixed $default = null): mixed
    {
        return $this->data[$key] ?? $default;
    }

    public function put(string $key, mixed $value): void
    {
        $this->data[$key] = $value;
    }

    public function forget(string $key): void
    {
        unset($this->data[$key]);
    }

    public function pull(string $key, mixed $default = null): mixed
    {
        $value = $this->get($key, $default);
        $this->forget($key);

        return $value;
    }

    public function flash(string $key, mixed $value): void
    {
        $this->data['_flash'][$key] = $value;
    }

    public function getFlash(string $key, mixed $default = null): mixed
    {
        return $this->data['_flash'][$key] ?? $default;
    }

    public function csrfToken(): string
    {
        return (string) $this->get('_token', '');
    }

    public function regenerate(): void
    {
        $this->id = $this->generateId();
    }

    public function save(): void
    {
        if (! $this->started) {
            return;
        }

        $lifetime = (int) config('session.lifetime', 120);
        $expires = time() + ($lifetime * 60);

        if (config('session.driver') === 'database') {
            $table = (string) config('session.table', 'sessions');
            $payload = base64_encode(serialize($this->data));
            $userId = $this->getAuthUserId();
            $db = Database::getInstance();

            $existing = $db->fetch(
                'SELECT id FROM `' . $table . '` WHERE id = :id',
                ['id' => $this->id]
            );

            if ($existing) {
                $db->update(
                    $table,
                    [
                        'user_id' => $userId,
                        'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                        'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
                        'payload' => $payload,
                        'last_activity' => time(),
                    ],
                    'id = :session_id',
                    ['session_id' => $this->id]
                );
            } else {
                $db->insert($table, [
                    'id' => $this->id,
                    'user_id' => $userId,
                    'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
                    'user_agent' => substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 500),
                    'payload' => $payload,
                    'last_activity' => time(),
                ]);
            }
        }

        $this->queueCookie($expires);
    }

    public function queueCookie(int $expires): Response
    {
        return response('')->withCookie(
            $this->cookieName(),
            $this->id,
            $expires,
            '/',
            config('session.domain') ?: null,
            (bool) config('session.secure', false),
            true,
            ucfirst((string) config('session.same_site', 'lax'))
        );
    }

    public function getAuthUserId(): ?int
    {
        foreach ($this->data as $key => $value) {
            if (is_string($key) && str_starts_with($key, 'login_web_') && is_numeric($value)) {
                return (int) $value;
            }
        }

        return isset($this->data['auth_user_id']) ? (int) $this->data['auth_user_id'] : null;
    }

    public function login(int $userId): void
    {
        $this->data['auth_user_id'] = $userId;
        $this->data['login_web_' . sha1('App\\Models\\User')] = $userId;
    }

    public function logout(): void
    {
        foreach (array_keys($this->data) as $key) {
            if (is_string($key) && (str_starts_with($key, 'login_web_') || $key === 'auth_user_id')) {
                unset($this->data[$key]);
            }
        }
    }

    private function cookieName(): string
    {
        $configured = (string) config('session.cookie', '');

        if ($configured !== '') {
            return $configured;
        }

        $slug = strtolower(preg_replace('/[^a-z0-9]+/i', '_', (string) config('app.name', 'app')) ?? 'app');

        return $slug . '_session';
    }

    private function generateId(): string
    {
        return bin2hex(random_bytes(20));
    }

    private function loadFromDatabase(): void
    {
        $table = (string) config('session.table', 'sessions');
        $row = Database::getInstance()->fetch(
            'SELECT payload, last_activity FROM `' . $table . '` WHERE id = :id',
            ['id' => $this->id]
        );

        if (! $row) {
            $this->data = [];

            return;
        }

        $lifetime = (int) config('session.lifetime', 120);

        if ((int) $row['last_activity'] < time() - ($lifetime * 60)) {
            $this->data = [];

            return;
        }

        $decoded = base64_decode((string) $row['payload'], true);
        $unserialized = @unserialize($decoded ?: '');

        $this->data = is_array($unserialized) ? $unserialized : [];
    }
}
