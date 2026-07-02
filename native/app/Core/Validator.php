<?php

declare(strict_types=1);

namespace App\Core;

final class ValidationException extends HttpException
{
    /** @param array<string, list<string>> $errors */
    public function __construct(private readonly array $errors)
    {
        parent::__construct(422, 'The given data was invalid.');
    }

    /** @return array<string, list<string>> */
    public function errors(): array
    {
        return $this->errors;
    }
}

final class Validator
{
    /** @param array<string, mixed> $data */
    public function __construct(
        private readonly array $data,
        private readonly array $rules,
    ) {}

    public static function make(array $data, array $rules): self
    {
        return new self($data, $rules);
    }

    /** @return array<string, mixed> */
    public function validate(): array
    {
        $errors = $this->errors();

        if ($errors !== []) {
            throw new ValidationException($errors);
        }

        $validated = [];

        foreach ($this->rules as $field => $ruleString) {
            if (! array_key_exists($field, $this->data)) {
                continue;
            }

            $validated[$field] = $this->data[$field];
        }

        return $validated;
    }

    /** @return array<string, list<string>> */
    public function errors(): array
    {
        $errors = [];

        foreach ($this->rules as $field => $ruleString) {
            $rules = is_array($ruleString) ? $ruleString : explode('|', (string) $ruleString);
            $value = $this->data[$field] ?? null;

            foreach ($rules as $rule) {
                if ($rule === 'nullable' && ($value === null || $value === '')) {
                    break;
                }

                if (is_string($rule) && str_starts_with($rule, 'required_')) {
                    continue;
                }

                $message = $this->validateRule($field, $value, (string) $rule);

                if ($message !== null) {
                    $errors[$field][] = $message;
                    break;
                }
            }
        }

        return $errors;
    }

    private function validateRule(string $field, mixed $value, string $rule): ?string
    {
        if ($rule === 'required' && ($value === null || $value === '')) {
            return "The {$field} field is required.";
        }

        if (str_starts_with($rule, 'min:')) {
            $min = (int) substr($rule, 4);

            if (is_string($value) && mb_strlen($value) < $min) {
                return "The {$field} must be at least {$min} characters.";
            }
        }

        if (str_starts_with($rule, 'max:')) {
            $max = (int) substr($rule, 4);

            if (is_string($value) && mb_strlen($value) > $max) {
                return "The {$field} may not be greater than {$max} characters.";
            }
        }

        if ($rule === 'email' && $value !== null && $value !== '' && ! filter_var((string) $value, FILTER_VALIDATE_EMAIL)) {
            return "The {$field} must be a valid email address.";
        }

        if ($rule === 'numeric' && $value !== null && $value !== '' && ! is_numeric($value)) {
            return "The {$field} must be numeric.";
        }

        if ($rule === 'integer' && $value !== null && $value !== '' && filter_var($value, FILTER_VALIDATE_INT) === false) {
            return "The {$field} must be an integer.";
        }

        if ($rule === 'boolean' && $value !== null && ! in_array($value, [true, false, 0, 1, '0', '1'], true)) {
            return "The {$field} must be true or false.";
        }

        if ($rule === 'confirmed') {
            $confirmation = $this->data[$field . '_confirmation'] ?? null;

            if ($value !== $confirmation) {
                return "The {$field} confirmation does not match.";
            }
        }

        if (str_starts_with($rule, 'unique:')) {
            [, $table, $column] = array_pad(explode(',', substr($rule, 7), 3), 3, null);
            $column = $column ?: $field;

            $exists = Database::getInstance()->fetch(
                'SELECT COUNT(*) AS c FROM `' . $table . '` WHERE `' . $column . '` = :value',
                ['value' => $value]
            );

            if ((int) ($exists['c'] ?? 0) > 0) {
                return "The {$field} has already been taken.";
            }
        }

        if (str_starts_with($rule, 'exists:')) {
            [, $table, $column] = array_pad(explode(',', substr($rule, 7), 3), 3, null);
            $column = $column ?: 'id';

            $exists = Database::getInstance()->fetch(
                'SELECT COUNT(*) AS c FROM `' . $table . '` WHERE `' . $column . '` = :value',
                ['value' => $value]
            );

            if ((int) ($exists['c'] ?? 0) === 0) {
                return "The selected {$field} is invalid.";
            }
        }

        if (str_starts_with($rule, 'regex:')) {
            $pattern = substr($rule, 6);

            if ($value !== null && $value !== '' && ! preg_match($pattern, (string) $value)) {
                return "The {$field} format is invalid.";
            }
        }

        return null;
    }
}
