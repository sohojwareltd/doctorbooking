<?php

declare(strict_types=1);

return [
    'guard' => 'web',
    'password_broker' => 'users',
    'providers' => [
        'users' => [
            'model' => App\Models\User::class,
            'table' => 'users',
        ],
    ],
    'password_reset_table' => 'password_reset_tokens',
    'password_reset_expire' => 60,
    'sanctum' => [
        'stateful_domains' => array_filter(array_map('trim', explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', 'localhost,127.0.0.1')))),
        'token_table' => 'personal_access_tokens',
    ],
];
