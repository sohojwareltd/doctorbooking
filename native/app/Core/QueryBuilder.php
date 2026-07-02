<?php

declare(strict_types=1);

namespace App\Core;

final class QueryBuilder
{
    private string $sql = '';

    /** @var array<string, mixed> */
    private array $bindings = [];

    private ?int $limit = null;

    private ?int $offset = null;

    private string $orderBy = '';

    public function __construct(private readonly string $modelClass) {}

    public function where(string $column, mixed $operator, mixed $value = null): self
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $param = 'w' . count($this->bindings);
        $clause = ($this->sql === '' ? 'WHERE ' : ' AND ')
            . Database::getInstance()->wrapColumn($column)
            . ' ' . $operator . ' :' . $param;

        $this->sql .= $clause;
        $this->bindings[$param] = $value;

        return $this;
    }

    public function whereIn(string $column, array $values): self
    {
        if ($values === []) {
            $this->sql .= ($this->sql === '' ? 'WHERE ' : ' AND ') . '1 = 0';

            return $this;
        }

        $placeholders = [];

        foreach ($values as $i => $value) {
            $param = 'in' . $i;
            $placeholders[] = ':' . $param;
            $this->bindings[$param] = $value;
        }

        $clause = ($this->sql === '' ? 'WHERE ' : ' AND ')
            . Database::getInstance()->wrapColumn($column)
            . ' IN (' . implode(', ', $placeholders) . ')';

        $this->sql .= $clause;

        return $this;
    }

    public function orWhere(string $column, mixed $operator, mixed $value = null): self
    {
        if ($value === null) {
            $value = $operator;
            $operator = '=';
        }

        $param = 'or' . count($this->bindings);
        $clause = ($this->sql === '' ? 'WHERE ' : ' OR ')
            . Database::getInstance()->wrapColumn($column)
            . ' ' . $operator . ' :' . $param;

        $this->sql .= $clause;
        $this->bindings[$param] = $value;

        return $this;
    }

    public function orderBy(string $column, string $direction = 'ASC'): self
    {
        $this->orderBy = ' ORDER BY ' . Database::getInstance()->wrapColumn($column) . ' ' . strtoupper($direction);

        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limit = $limit;

        return $this;
    }

    public function offset(int $offset): self
    {
        $this->offset = $offset;

        return $this;
    }

    public function paginate(int $perPage = 15, int $page = 1): array
    {
        $page = max(1, $page);
        $total = $this->count();
        $items = $this->limit($perPage)->offset(($page - 1) * $perPage)->get();

        return [
            'data' => $items,
            'current_page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'last_page' => (int) max(1, ceil($total / $perPage)),
        ];
    }

    public function count(): int
    {
        $table = $this->modelClass::table();
        $sql = 'SELECT COUNT(*) AS aggregate FROM ' . Database::getInstance()->wrapTable($table) . ' ' . $this->sql;
        $row = Database::getInstance()->fetch($sql, $this->bindings);

        return (int) ($row['aggregate'] ?? 0);
    }

    /** @return list<object> */
    public function get(): array
    {
        $table = $this->modelClass::table();
        $sql = 'SELECT * FROM ' . Database::getInstance()->wrapTable($table) . ' ' . $this->sql . $this->orderBy;

        if ($this->limit !== null) {
            $sql .= ' LIMIT ' . $this->limit;
        }

        if ($this->offset !== null) {
            $sql .= ' OFFSET ' . $this->offset;
        }

        $rows = Database::getInstance()->fetchAll($sql, $this->bindings);

        return array_map(fn (array $row) => $this->modelClass::hydrate($row), $rows);
    }

    public function first(): ?object
    {
        return $this->limit(1)->get()[0] ?? null;
    }
}
