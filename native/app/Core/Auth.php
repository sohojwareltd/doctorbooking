<?php

declare(strict_types=1);

namespace App\Core;

use App\Models\User;

final class Auth
{
    private static ?self $instance = null;

    private ?User $user = null;

    private bool $resolved = false;

    private function __construct() {}

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function user(): ?User
    {
        if ($this->resolved) {
            return $this->user;
        }

        $this->resolved = true;

        $token = request()?->bearerToken();

        if ($token) {
            $this->user = $this->userFromToken($token);

            return $this->user;
        }

        if ($this->isStatefulRequest()) {
            $userId = Session::getInstance()->getAuthUserId();

            if ($userId) {
                $this->user = User::find($userId);
            }
        }

        return $this->user;
    }

    public function id(): ?int
    {
        return $this->user()?->id;
    }

    public function check(): bool
    {
        return $this->user() !== null;
    }

    public function login(User $user): void
    {
        Session::getInstance()->login((int) $user->id);
        $this->user = $user;
        $this->resolved = true;
    }

    public function logout(): void
    {
        Session::getInstance()->logout();
        $this->user = null;
        $this->resolved = true;
    }

    public function createToken(User $user, string $name = 'api-client'): string
    {
        $plainText = bin2hex(random_bytes(20));
        $tokenId = Database::getInstance()->insert(config('auth.sanctum.token_table', 'personal_access_tokens'), [
            'tokenable_type' => 'App\\Models\\User',
            'tokenable_id' => $user->id,
            'name' => $name,
            'token' => hash('sha256', $plainText),
            'abilities' => '["*"]',
            'created_at' => now()->format('Y-m-d H:i:s'),
            'updated_at' => now()->format('Y-m-d H:i:s'),
        ]);

        return $tokenId . '|' . $plainText;
    }

    public function revokeCurrentToken(?string $bearerToken): void
    {
        if (! $bearerToken || ! str_contains($bearerToken, '|')) {
            return;
        }

        [$id] = explode('|', $bearerToken, 2);
        Database::getInstance()->delete(
            config('auth.sanctum.token_table', 'personal_access_tokens'),
            'id = :id',
            ['id' => (int) $id]
        );
    }

    private function userFromToken(string $bearerToken): ?User
    {
        if (! str_contains($bearerToken, '|')) {
            return null;
        }

        [$id, $plain] = explode('|', $bearerToken, 2);
        $hash = hash('sha256', $plain);

        $row = Database::getInstance()->fetch(
            'SELECT tokenable_id FROM `' . config('auth.sanctum.token_table', 'personal_access_tokens') . '` WHERE id = :id AND token = :token LIMIT 1',
            ['id' => (int) $id, 'token' => $hash]
        );

        if (! $row) {
            return null;
        }

        return User::find((int) $row['tokenable_id']);
    }

    private function isStatefulRequest(): bool
    {
        $host = $_SERVER['HTTP_HOST'] ?? '';
        $domains = config('auth.sanctum.stateful_domains', []);

        foreach ($domains as $domain) {
            if ($domain !== '' && (str_contains($host, $domain) || $host === $domain)) {
                return true;
            }
        }

        return false;
    }
}
