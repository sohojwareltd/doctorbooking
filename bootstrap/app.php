<?php

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Mail\ExceptionNotificationMail;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->reportable(function (Throwable $exception) {
            try {
                $url = request()->fullUrl() ?? 'N/A';
                $context = [
                    'user_id' => auth()->id(),
                    'user_email' => auth()->user()?->email,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'request_method' => request()->method(),
                ];

                Mail::to('sohojwareltd@gmail.com')
                    ->send(new ExceptionNotificationMail($exception, $url, $context));
            } catch (Throwable $e) {
                // If sending email fails, log it to avoid infinite loop
                Log::error('Failed to send exception notification email: ' . $e->getMessage());
            }
        });
    })->create();
