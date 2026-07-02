<?php

declare(strict_types=1);

use App\Core\Application;
use App\Core\Config;
use App\Core\LaravelBridge;
use App\Core\Request;
use App\Core\Session;
use App\Middleware\AuthMiddleware;
use App\Middleware\CorsMiddleware;
use App\Middleware\CsrfMiddleware;
use App\Middleware\GuestMiddleware;
use App\Middleware\RoleMiddleware;

require_once dirname(__DIR__) . '/vendor/autoload.php';

Config::loadEnv(dirname(__DIR__) . '/.env');

$app = new Application();
$router = $app->router();

$router->alias('auth', AuthMiddleware::class);
$router->alias('auth:sanctum', AuthMiddleware::class);
$router->alias('guest', GuestMiddleware::class);
$router->alias('role', RoleMiddleware::class);
$router->alias('csrf', CsrfMiddleware::class);
$router->alias('cors', CorsMiddleware::class);

require dirname(__DIR__) . '/routes/api.php';
require dirname(__DIR__) . '/routes/web.php';

return $app;
