<?php

declare(strict_types=1);

namespace App\Models;

use App\Core\Model;

class Patient extends Model
{
    protected static string $table = 'patients';

    protected static bool $timestamps = true;
}
