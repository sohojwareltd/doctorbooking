<?php

declare(strict_types=1);

namespace App\Core;

class HttpException extends \Exception
{
    public function __construct(
        private readonly int $statusCode,
        string $message = '',
        private readonly array $headers = [],
    ) {
        parent::__construct($message);
    }

    public function statusCode(): int
    {
        return $this->statusCode;
    }

    public function headers(): array
    {
        return $this->headers;
    }
}
