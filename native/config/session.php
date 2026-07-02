<?php

declare(strict_types=1);

return [
    'driver' => env('SESSION_DRIVER', 'database'),
    'lifetime' => (int) env('SESSION_LIFETIME', 120),
    'cookie' => env('SESSION_COOKIE', ''),
    'domain' => env('SESSION_DOMAIN'),
    'secure' => filter_var(env('SESSION_SECURE', false), FILTER_VALIDATE_BOOLEAN),
    'same_site' => env('SESSION_SAME_SITE', 'lax'),
    'table' => 'sessions',
];
