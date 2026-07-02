<?php

declare(strict_types=1);

use App\Core\HttpException;
use App\Core\LaravelBridge;
use App\Core\Request;
use App\Core\Session;

$app = require dirname(__DIR__) . '/bootstrap/app.php';

$request = Request::capture();
$GLOBALS['native_request'] = $request;

// Serve static assets from Laravel public/ (build, storage, images) without booting Laravel.
$publicRoot = realpath(public_path()) ?: public_path();
$requested = $request->uri();
$staticPath = realpath($publicRoot . $requested);

if (
    $requested !== '/'
    && $staticPath
    && str_starts_with($staticPath, $publicRoot)
    && is_file($staticPath)
) {
    $mime = mime_content_type($staticPath) ?: 'application/octet-stream';
    header('Content-Type: ' . $mime);
    readfile($staticPath);
    exit;
}

// Health/static endpoints should not require database session boot.
$skipSession = in_array($request->uri(), ['/up'], true);

if (! $skipSession) {
    Session::getInstance()->start();
}

try {
    $response = $app->handle($request);
} catch (HttpException $e) {
    if ($e->statusCode() === 404 && LaravelBridge::shouldFallback($request)) {
        LaravelBridge::handle($request);
    }

    throw $e;
}

if (! $skipSession) {
    Session::getInstance()->save();

    $cookieResponse = Session::getInstance()->queueCookie(time() + ((int) config('session.lifetime', 120) * 60));
    foreach ($cookieResponse->getHeaders() as $name => $value) {
        if ($name === 'Set-Cookie' && is_array($value)) {
            foreach ($value as $cookie) {
                header('Set-Cookie: ' . $cookie, false);
            }
        }
    }
}

$response->send();
