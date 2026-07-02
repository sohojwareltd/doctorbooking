<?php

declare(strict_types=1);

namespace App\Core;

final class ExceptionHandler
{
    public static function renderHttp(HttpException $e, Request $request): Response
    {
        if ($e instanceof ValidationException) {
            return Response::json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return Response::json(['message' => $e->getMessage()], $e->statusCode());
        }

        return view('errors/' . $e->statusCode(), ['message' => $e->getMessage()])
            ->withHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    public static function renderThrowable(\Throwable $e, Request $request): Response
    {
        Logger::error($e->getMessage(), [
            'exception' => $e::class,
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString(),
        ]);

        if (config('app.debug')) {
            if ($request->expectsJson() || $request->is('api/*')) {
                return Response::json([
                    'message' => $e->getMessage(),
                    'exception' => $e::class,
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ], 500);
            }

            return response('<pre>' . htmlspecialchars($e->getMessage() . "\n" . $e->getTraceAsString()) . '</pre>', 500);
        }

        if ($request->expectsJson() || $request->is('api/*')) {
            return Response::json(['message' => 'Server Error'], 500);
        }

        return view('errors/500', ['message' => 'Server Error']);
    }
}
