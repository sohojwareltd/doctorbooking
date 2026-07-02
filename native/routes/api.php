<?php

declare(strict_types=1);

use App\Controllers\Api\AuthController;
use App\Core\HttpException;

/** @var \App\Core\Application $app */
$router = $app->router();

$router->group(['middleware' => ['cors']], function ($router) {
    $router->get('/up', fn () => json(['status' => 'ok', 'engine' => 'native-php']));

    $router->get('/sanctum/csrf-cookie', [AuthController::class, 'csrfCookie']);

    $router->group(['prefix' => '/api'], function ($router) {
        $router->group(['prefix' => '/auth'], function ($router) {
            $router->post('/login', [AuthController::class, 'login']);
            $router->post('/register', [AuthController::class, 'register']);
            $router->post('/forgot-password', [AuthController::class, 'forgotPassword']);
            $router->post('/reset-password', [AuthController::class, 'resetPassword']);

            $router->group(['middleware' => ['auth:sanctum']], function ($router) {
                $router->get('/me', [AuthController::class, 'me']);
                $router->post('/logout', [AuthController::class, 'logout']);
            });
        });

        // Additional API modules are registered as they are ported from Laravel.
    });
});
