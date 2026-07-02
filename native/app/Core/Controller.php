<?php

declare(strict_types=1);

namespace App\Core;

abstract class Controller
{
    protected function json(mixed $data, int $status = 200): Response
    {
        return Response::json($data, $status);
    }

    protected function validate(Request $request, array $rules): array
    {
        return $request->validate($rules);
    }
}
