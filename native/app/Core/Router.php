<?php

declare(strict_types=1);

namespace App\Core;

final class Router
{
    /** @var array<int, array<string, mixed>> */
    private array $routes = [];

    /** @var array<string, array<string, mixed>> */
    private array $namedRoutes = [];

  /** @var array<string, list<class-string>> */
    private array $middlewareAliases = [];

    /** @var list<class-string> */
    private array $groupMiddleware = [];

    private string $groupPrefix = '';

    public function alias(string $name, string $middleware): void
    {
        $this->middlewareAliases[$name] = $middleware;
    }

    public function group(array $options, callable $callback): void
    {
        $previousPrefix = $this->groupPrefix;
        $previousMiddleware = $this->groupMiddleware;

        if (isset($options['prefix'])) {
            $this->groupPrefix .= '/' . trim((string) $options['prefix'], '/');
        }

        if (isset($options['middleware'])) {
            $middleware = is_array($options['middleware']) ? $options['middleware'] : [$options['middleware']];
            $this->groupMiddleware = array_merge($this->groupMiddleware, $middleware);
        }

        $callback($this);

        $this->groupPrefix = $previousPrefix;
        $this->groupMiddleware = $previousMiddleware;
    }

    public function get(string $uri, array|string|callable $action, ?string $name = null): void
    {
        $this->addRoute('GET', $uri, $action, $name);
    }

    public function post(string $uri, array|string|callable $action, ?string $name = null): void
    {
        $this->addRoute('POST', $uri, $action, $name);
    }

    public function put(string $uri, array|string|callable $action, ?string $name = null): void
    {
        $this->addRoute('PUT', $uri, $action, $name);
    }

    public function patch(string $uri, array|string|callable $action, ?string $name = null): void
    {
        $this->addRoute('PATCH', $uri, $action, $name);
    }

    public function delete(string $uri, array|string|callable $action, ?string $name = null): void
    {
        $this->addRoute('DELETE', $uri, $action, $name);
    }

    public function any(string $uri, array|string|callable $action, ?string $name = null): void
    {
        foreach (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as $method) {
            $this->addRoute($method, $uri, $action, $name);
        }
    }

    private function addRoute(string $method, string $uri, array|string|callable $action, ?string $name): void
    {
        $uri = '/' . trim($this->groupPrefix . '/' . ltrim($uri, '/'), '/');
        if ($uri !== '/') {
            $uri = rtrim($uri, '/') ?: '/';
        }

        $route = [
            'method' => strtoupper($method),
            'uri' => $uri,
            'action' => $action,
            'middleware' => $this->groupMiddleware,
            'name' => $name,
        ];

        $this->routes[] = $route;

        if ($name) {
            $this->namedRoutes[$name] = $route;
        }
    }

    public function dispatch(Request $request): Response
    {
        $method = $request->method();
        $path = $request->uri();

        $matched = null;
        $params = [];

        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = $this->compilePattern($route['uri']);
            if (preg_match($pattern, $path, $matches)) {
                $matched = $route;
                foreach ($matches as $key => $value) {
                    if (! is_int($key)) {
                        $params[$key] = $value;
                    }
                }
                break;
            }
        }

        if ($matched === null) {
            $allowed = array_values(array_unique(array_map(
                static fn (array $r) => $r['method'],
                array_filter($this->routes, static fn (array $r) => preg_match($this->compilePattern($r['uri']), $path))
            )));

            if ($allowed !== []) {
                abort(405, 'Method Not Allowed');
            }

            abort(404, 'Not Found');
        }

        $request->setRouteParams($params);

        $handler = MiddlewarePipeline::wrap(
            $this->resolveMiddleware($matched['middleware']),
            fn (Request $request) => $this->runAction($matched['action'], $request)
        );

        $response = $handler($request);

        return $response instanceof Response ? $response : response((string) $response);
    }

    private function compilePattern(string $uri): string
    {
        $pattern = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $uri) ?? $uri;

        return '#^' . $pattern . '$#';
    }

    /** @param list<string> $middleware */
    private function resolveMiddleware(array $middleware): array
    {
        $resolved = [];

        foreach ($middleware as $entry) {
            if (str_contains($entry, ':')) {
                [$alias, $params] = explode(':', $entry, 2);
                $class = $this->middlewareAliases[$alias] ?? $alias;
                $resolved[] = $class . ':' . $params;
                continue;
            }

            if (str_contains($entry, ',')) {
                foreach (explode(',', $entry) as $part) {
                    $part = trim($part);
                    $resolved[] = $this->middlewareAliases[$part] ?? $part;
                }
                continue;
            }

            $resolved[] = $this->middlewareAliases[$entry] ?? $entry;
        }

        return $resolved;
    }

    private function runAction(array|string|callable $action, Request $request): mixed
    {
        if (is_callable($action)) {
            return $action($request);
        }

        if (is_string($action) && str_contains($action, '@')) {
            [$class, $method] = explode('@', $action, 2);
            $controller = new $class();

            return $controller->{$method}($request);
        }

        if (is_array($action) && count($action) === 2) {
            [$class, $method] = $action;
            $controller = is_object($class) ? $class : new $class();

            return $controller->{$method}($request);
        }

        throw new \RuntimeException('Invalid route action.');
    }
}
