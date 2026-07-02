<?php

declare(strict_types=1);

namespace App\Core;

abstract class Model
{
    protected static string $table = '';

    protected static string $primaryKey = 'id';

    protected array $attributes = [];

    protected array $original = [];

    protected bool $exists = false;

    protected static bool $timestamps = true;

    protected static ?string $deletedAtColumn = null;

    public function __construct(array $attributes = [])
    {
        $this->fill($attributes);
    }

    public static function table(): string
    {
        if (static::$table !== '') {
            return static::$table;
        }

        $class = static::class;
        $base = substr(strrchr($class, '\\') ?: $class, 1);

        return strtolower(preg_replace('/(?<!^)[A-Z]/', '_$0', $base) ?? $base) . 's';
    }

    public static function query(): QueryBuilder
    {
        return new QueryBuilder(static::class);
    }

  /** @return static|null */
    public static function find(mixed $id): ?static
    {
        return static::query()->where(static::$primaryKey, $id)->first();
    }

  /** @return static */
    public static function findOrFail(mixed $id): static
    {
        $model = static::find($id);

        if ($model === null) {
            abort(404, class_basename(static::class) . ' not found.');
        }

        return $model;
    }

  /** @return static */
    public static function create(array $attributes): static
    {
        $model = new static($attributes);

        return $model->save() ? $model : throw new \RuntimeException('Failed to create model.');
    }

    public function fill(array $attributes): static
    {
        foreach ($attributes as $key => $value) {
            $this->attributes[$key] = $value;
        }

        return $this;
    }

    public function __get(string $key): mixed
    {
        return $this->attributes[$key] ?? null;
    }

    public function __set(string $key, mixed $value): void
    {
        $this->attributes[$key] = $value;
    }

    public function getAttributes(): array
    {
        return $this->attributes;
    }

    public function toArray(): array
    {
        return $this->attributes;
    }

    public function save(): bool
    {
        $db = Database::getInstance();

        if (static::$timestamps) {
            $now = now()->format('Y-m-d H:i:s');

            if (! $this->exists) {
                $this->attributes['created_at'] ??= $now;
            }

            $this->attributes['updated_at'] = $now;
        }

        if ($this->exists) {
            $id = $this->attributes[static::$primaryKey];
            $data = $this->attributes;
            unset($data[static::$primaryKey]);

            $db->update(static::table(), $data, static::$primaryKey . ' = :id', ['id' => $id]);
            $this->original = $this->attributes;

            return true;
        }

        $id = $db->insert(static::table(), $this->attributes);
        $this->attributes[static::$primaryKey] = $id;
        $this->exists = true;
        $this->original = $this->attributes;

        return true;
    }

    public function delete(): bool
    {
        if (! $this->exists) {
            return false;
        }

        $db = Database::getInstance();

        if (static::$deletedAtColumn) {
            $this->attributes[static::$deletedAtColumn] = now()->format('Y-m-d H:i:s');

            return $this->save();
        }

        $db->delete(
            static::table(),
            static::$primaryKey . ' = :id',
            ['id' => $this->attributes[static::$primaryKey]]
        );

        $this->exists = false;

        return true;
    }

    public static function hydrate(array $row): static
    {
        $model = new static($row);
        $model->exists = true;
        $model->original = $row;

        return $model;
    }

    public function relation(string $related, string $foreignKey, string $localKey = 'id'): ?Model
    {
        $value = $this->attributes[$localKey] ?? null;

        if ($value === null) {
            return null;
        }

        /** @var class-string<Model> $related */
        return $related::query()->where($foreignKey, $value)->first();
    }

    public function hasMany(string $related, string $foreignKey, string $localKey = 'id'): array
    {
        $value = $this->attributes[$localKey] ?? null;

        if ($value === null) {
            return [];
        }

        /** @var class-string<Model> $related */
        return $related::query()->where($foreignKey, $value)->get();
    }
}
