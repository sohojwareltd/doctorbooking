<?php

declare(strict_types=1);

$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/up';
$_SERVER['HTTP_HOST'] = '127.0.0.1';

require dirname(__DIR__) . '/vendor/autoload.php';
require dirname(__DIR__) . '/bootstrap/helpers.php';

\App\Core\Config::loadEnv(dirname(__DIR__) . '/.env');

$app = require dirname(__DIR__) . '/bootstrap/app.php';
$request = \App\Core\Request::capture();
$GLOBALS['native_request'] = $request;

try {
    $response = $app->handle($request);
    ob_start();
    $response->send();
    echo ob_get_clean();
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage() . PHP_EOL;
    echo $e->getTraceAsString();
}
