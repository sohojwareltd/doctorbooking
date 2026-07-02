<?php

declare(strict_types=1);

return [
    'allowed_origins' => env('CORS_ALLOWED_ORIGINS', '*'),
    'supports_credentials' => true,
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'login', 'logout', 'register'],
];
