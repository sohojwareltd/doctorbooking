<?php

declare(strict_types=1);

namespace App\Core;

final class Application
{
    private static ?self $instance = null;

    private Router $router;

    private array $bindings = [];

    public function __construct()
    {
        date_default_timezone_set((string) config('app.timezone', 'UTC'));
        $this->router = new Router();
        self::$instance = $this;
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }

        return self::$instance;
    }

    public function router(): Router
    {
        return $this->router;
    }

    public function bind(string $abstract, mixed $concrete): void
    {
        $this->bindings[$abstract] = $concrete;
    }

    public function make(string $abstract): mixed
    {
        if (isset($this->bindings[$abstract])) {
            $concrete = $this->bindings[$abstract];

            return is_callable($concrete) ? $concrete() : $concrete;
        }

        if (class_exists($abstract)) {
            return new $abstract();
        }

        throw new \RuntimeException("Unable to resolve [{$abstract}].");
    }

    public function handle(Request $request): Response
    {
        try {
            return $this->router->dispatch($request);
        } catch (HttpException $e) {
            return ExceptionHandler::renderHttp($e, $request);
        } catch (\Throwable $e) {
            return ExceptionHandler::renderThrowable($e, $request);
        }
    }
}
