<?php

declare(strict_types=1);

namespace App\Core;

final class View
{
    public static function render(string $name, array $data = []): Response
    {
        $path = base_path('resources/views/' . str_replace('.', '/', $name) . '.php');

        if (! is_file($path)) {
            abort(500, 'View not found: ' . $name);
        }

        extract($data, EXTR_SKIP);
        ob_start();
        include $path;
        $content = (string) ob_get_clean();

        return response($content)->withHeader('Content-Type', 'text/html; charset=UTF-8');
    }
}
