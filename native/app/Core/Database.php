<?php

declare(strict_types=1);

namespace App\Core;

use PDO;
use PDOException;

final class Database
{
    private static ?self $instance = null;

    private PDO $pdo;

    private function __construct()
    {
        $connection = (string) config('database.default', 'mysql');
        $config = config('database.connections.' . $connection);

        if (! is_array($config)) {
            throw new \RuntimeException('Database configuration missing.');
        }

        if (($config['driver'] ?? '') === 'sqlite') {
            $this->pdo = new PDO('sqlite:' . $config['database']);
        } else {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                $config['host'],
                $config['port'],
                $config['database'],
                $config['charset'] ?? 'utf8mb4'
            );

            $this->pdo = new PDO($dsn, $config['username'], $config['password'], [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function pdo(): PDO
    {
        return $this->pdo;
    }

    public function query(string $sql, array $bindings = []): \PDOStatement
    {
        $statement = $this->pdo->prepare($sql);
        $statement->execute($bindings);

        return $statement;
    }

    public function fetch(string $sql, array $bindings = []): ?array
    {
        $row = $this->query($sql, $bindings)->fetch();

        return $row === false ? null : $row;
    }

    public function fetchAll(string $sql, array $bindings = []): array
    {
        return $this->query($sql, $bindings)->fetchAll();
    }

    public function insert(string $table, array $data): int
    {
        $columns = array_keys($data);
        $placeholders = array_map(static fn ($c) => ':' . $c, $columns);
        $sql = sprintf(
            'INSERT INTO %s (%s) VALUES (%s)',
            $this->wrapTable($table),
            implode(', ', array_map([$this, 'wrapColumn'], $columns)),
            implode(', ', $placeholders)
        );

        $this->query($sql, $data);

        return (int) $this->pdo->lastInsertId();
    }

    public function update(string $table, array $data, string $where, array $bindings = []): int
    {
        $sets = [];

        foreach (array_keys($data) as $column) {
            $sets[] = $this->wrapColumn($column) . ' = :' . $column;
        }

        $sql = sprintf(
            'UPDATE %s SET %s WHERE %s',
            $this->wrapTable($table),
            implode(', ', $sets),
            $where
        );

        return $this->query($sql, array_merge($data, $bindings))->rowCount();
    }

    public function delete(string $table, string $where, array $bindings = []): int
    {
        $sql = sprintf('DELETE FROM %s WHERE %s', $this->wrapTable($table), $where);

        return $this->query($sql, $bindings)->rowCount();
    }

    public function transaction(callable $callback): mixed
    {
        $this->pdo->beginTransaction();

        try {
            $result = $callback($this);
            $this->pdo->commit();

            return $result;
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function wrapTable(string $table): string
    {
        return '`' . str_replace('`', '``', $table) . '`';
    }

    public function wrapColumn(string $column): string
    {
        return '`' . str_replace('`', '``', $column) . '`';
    }
}
