<?php
require __DIR__."/vendor/autoload.php";
$app = require_once __DIR__."/bootstrap/app.php";
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$results = DB::select("SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = \"doctor_schedules\" AND REFERENCED_TABLE_NAME IS NOT NULL");
foreach($results as $r) { echo $r->CONSTRAINT_NAME . " -> " . $r->COLUMN_NAME . " => " . $r->REFERENCED_TABLE_NAME . PHP_EOL; }

