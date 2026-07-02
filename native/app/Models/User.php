<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class User extends Model
{
    protected static string $table = 'users';

    protected static bool $timestamps = true;

    private ?Role $roleCache = null;

    public function roleName(): string
    {
        return $this->role()?->name ?? '';
    }

    public function role(): ?Role
    {
        if ($this->roleCache) {
            return $this->roleCache;
        }

        $roleId = $this->attributes['role_id'] ?? null;

        if (! $roleId) {
            return null;
        }

        $this->roleCache = Role::find($roleId);

        return $this->roleCache;
    }

    public function hasRole(string $roleName): bool
    {
        return $this->roleName() === $roleName;
    }

    public function doctorId(): ?int
    {
        $row = \App\Core\Database::getInstance()->fetch(
            'SELECT id FROM doctors WHERE user_id = :user_id LIMIT 1',
            ['user_id' => $this->id]
        );

        return $row ? (int) $row['id'] : null;
    }

    public function patientProfile(): ?Patient
    {
        return $this->relation(Patient::class, 'user_id', 'id');
    }

    public function toResourceArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'username' => $this->username,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->roleName(),
            'email_verified_at' => $this->email_verified_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    public function setPassword(string $plain): void
    {
        $this->attributes['password'] = password_hash($plain, PASSWORD_BCRYPT, [
            'cost' => (int) env('BCRYPT_ROUNDS', 12),
        ]);
    }

    public function verifyPassword(string $plain): bool
    {
        return password_verify($plain, (string) ($this->attributes['password'] ?? ''));
    }
}
