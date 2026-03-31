<?php
/**
 * Server Diagnostic Tool - Visit /server-check.php in browser to diagnose blank page issues.
 * DELETE THIS FILE after debugging is complete.
 */

$checks = [];
$basePath = realpath(__DIR__ . '/..');

// 1. Check PHP version
$checks[] = [
    'name' => 'PHP Version',
    'status' => version_compare(PHP_VERSION, '8.2.0', '>=') ? 'OK' : 'FAIL',
    'detail' => PHP_VERSION,
];

// 2. Check .env exists
$envExists = file_exists($basePath . '/.env');
$checks[] = [
    'name' => '.env file exists',
    'status' => $envExists ? 'OK' : 'FAIL',
    'detail' => $envExists ? 'Found' : 'MISSING - app will not work without .env',
];

// 3. Check APP_KEY is set
$appKey = '';
if ($envExists) {
    $envContent = file_get_contents($basePath . '/.env');
    preg_match('/^APP_KEY=(.*)$/m', $envContent, $m);
    $appKey = trim($m[1] ?? '');
}
$checks[] = [
    'name' => 'APP_KEY set',
    'status' => !empty($appKey) ? 'OK' : 'FAIL',
    'detail' => !empty($appKey) ? 'Set (' . substr($appKey, 0, 10) . '...)' : 'EMPTY - run php artisan key:generate',
];

// 4. Check APP_ENV and APP_DEBUG
$appEnv = '';
$appDebug = '';
if ($envExists) {
    preg_match('/^APP_ENV=(.*)$/m', $envContent, $m);
    $appEnv = trim($m[1] ?? '');
    preg_match('/^APP_DEBUG=(.*)$/m', $envContent, $m);
    $appDebug = trim($m[1] ?? '');
}
$checks[] = [
    'name' => 'APP_ENV',
    'status' => 'INFO',
    'detail' => $appEnv ?: '(not set)',
];
$checks[] = [
    'name' => 'APP_DEBUG',
    'status' => 'INFO',
    'detail' => $appDebug ?: '(not set)',
];

// 5. Check build manifest
$manifestPath = __DIR__ . '/build/manifest.json';
$manifestExists = file_exists($manifestPath);
$checks[] = [
    'name' => 'Vite manifest (public/build/manifest.json)',
    'status' => $manifestExists ? 'OK' : 'FAIL',
    'detail' => $manifestExists ? 'Found' : 'MISSING - this is likely causing the blank page!',
];

// 6. Check manifest content
if ($manifestExists) {
    $manifest = json_decode(file_get_contents($manifestPath), true);
    $hasMainJsx = isset($manifest['frontend/src/main.jsx']);
    $checks[] = [
        'name' => 'Manifest has frontend/src/main.jsx entry',
        'status' => $hasMainJsx ? 'OK' : 'FAIL',
        'detail' => $hasMainJsx
            ? 'JS: ' . ($manifest['frontend/src/main.jsx']['file'] ?? 'N/A')
            : 'MISSING KEY - Vite @vite() will fail!',
    ];

    // Check if actual asset files exist
    if ($hasMainJsx) {
        $jsFile = __DIR__ . '/build/' . $manifest['frontend/src/main.jsx']['file'];
        $jsExists = file_exists($jsFile);
        $checks[] = [
            'name' => 'JS asset file exists',
            'status' => $jsExists ? 'OK' : 'FAIL',
            'detail' => $jsExists
                ? basename($jsFile) . ' (' . round(filesize($jsFile) / 1024) . ' KB)'
                : 'MISSING: ' . $manifest['frontend/src/main.jsx']['file'],
        ];

        $cssFiles = $manifest['frontend/src/main.jsx']['css'] ?? [];
        foreach ($cssFiles as $css) {
            $cssPath = __DIR__ . '/build/' . $css;
            $cssExists = file_exists($cssPath);
            $checks[] = [
                'name' => 'CSS asset file exists',
                'status' => $cssExists ? 'OK' : 'FAIL',
                'detail' => $cssExists
                    ? basename($cssPath) . ' (' . round(filesize($cssPath) / 1024) . ' KB)'
                    : 'MISSING: ' . $css,
            ];
        }
    }
} else {
    // List what's in public/build/
    $buildDir = __DIR__ . '/build';
    if (is_dir($buildDir)) {
        $files = scandir($buildDir);
        $checks[] = [
            'name' => 'Files in public/build/',
            'status' => 'INFO',
            'detail' => implode(', ', array_diff($files, ['.', '..'])),
        ];
    } else {
        $checks[] = [
            'name' => 'public/build/ directory',
            'status' => 'FAIL',
            'detail' => 'Directory does not exist!',
        ];
    }
}

// 7. Check storage/logs writable
$storageLogsPath = $basePath . '/storage/logs';
$checks[] = [
    'name' => 'storage/logs writable',
    'status' => is_writable($storageLogsPath) ? 'OK' : 'FAIL',
    'detail' => is_writable($storageLogsPath) ? 'Writable' : 'NOT WRITABLE - logs cannot be written',
];

// 8. Check bootstrap/cache writable
$bootstrapCachePath = $basePath . '/bootstrap/cache';
$checks[] = [
    'name' => 'bootstrap/cache writable',
    'status' => is_writable($bootstrapCachePath) ? 'OK' : 'FAIL',
    'detail' => is_writable($bootstrapCachePath) ? 'Writable' : 'NOT WRITABLE - caching will fail',
];

// 9. Check storage/framework writable
foreach (['cache', 'sessions', 'views'] as $dir) {
    $path = $basePath . '/storage/framework/' . $dir;
    $checks[] = [
        'name' => "storage/framework/$dir writable",
        'status' => is_writable($path) ? 'OK' : 'FAIL',
        'detail' => is_writable($path) ? 'Writable' : 'NOT WRITABLE',
    ];
}

// 10. Check vendor/autoload.php
$vendorAutoload = $basePath . '/vendor/autoload.php';
$checks[] = [
    'name' => 'vendor/autoload.php',
    'status' => file_exists($vendorAutoload) ? 'OK' : 'FAIL',
    'detail' => file_exists($vendorAutoload) ? 'Found' : 'MISSING - run composer install',
];

// 11. Check laravel.log for recent errors
$logFile = $basePath . '/storage/logs/laravel.log';
$recentErrors = '';
if (file_exists($logFile)) {
    $logContent = file_get_contents($logFile);
    $lines = explode("\n", $logContent);
    $lastLines = array_slice($lines, -50);
    $errorLines = array_filter($lastLines, function($line) {
        return stripos($line, 'ERROR') !== false || stripos($line, 'Exception') !== false;
    });
    $recentErrors = implode("\n", array_slice($errorLines, -5));
}
$checks[] = [
    'name' => 'Recent errors in laravel.log',
    'status' => empty($recentErrors) ? 'OK' : 'WARN',
    'detail' => empty($recentErrors) ? 'No recent errors' : 'See below',
];

// 12. Blade template check
$bladePath = $basePath . '/resources/views/app.blade.php';
$bladeExists = file_exists($bladePath);
$checks[] = [
    'name' => 'resources/views/app.blade.php',
    'status' => $bladeExists ? 'OK' : 'FAIL',
    'detail' => $bladeExists ? 'Found' : 'MISSING - Inertia root view not found!',
];
if ($bladeExists) {
    $bladeContent = file_get_contents($bladePath);
    $hasVite = strpos($bladeContent, '@vite') !== false;
    $checks[] = [
        'name' => '@vite directive in blade',
        'status' => $hasVite ? 'OK' : 'FAIL',
        'detail' => $hasVite ? 'Present' : 'MISSING - no asset loading!',
    ];
}

// Output
header('Content-Type: text/html; charset=utf-8');
$hasFailure = false;
foreach ($checks as $c) {
    if ($c['status'] === 'FAIL') $hasFailure = true;
}
?>
<!DOCTYPE html>
<html>
<head><title>Server Diagnostic</title>
<style>
    body { font-family: monospace; max-width: 900px; margin: 40px auto; padding: 0 20px; background: #1a1a2e; color: #eee; }
    h1 { color: #e94560; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    td, th { padding: 8px 12px; text-align: left; border-bottom: 1px solid #333; }
    .ok { color: #4ecca3; font-weight: bold; }
    .fail { color: #e94560; font-weight: bold; }
    .warn { color: #f0a500; font-weight: bold; }
    .info { color: #3ec1d3; }
    pre { background: #16213e; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 12px; }
    .summary { padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 18px; }
    .summary.pass { background: #1b4332; color: #4ecca3; }
    .summary.fail { background: #3c1518; color: #e94560; }
</style>
</head>
<body>
<h1>🔍 Server Diagnostic</h1>
<div class="summary <?= $hasFailure ? 'fail' : 'pass' ?>">
    <?= $hasFailure ? '❌ Issues found — see FAIL items below' : '✅ All checks passed' ?>
</div>
<table>
<tr><th>Check</th><th>Status</th><th>Detail</th></tr>
<?php foreach ($checks as $c): ?>
<tr>
    <td><?= htmlspecialchars($c['name']) ?></td>
    <td class="<?= strtolower($c['status']) ?>"><?= $c['status'] ?></td>
    <td><?= htmlspecialchars($c['detail']) ?></td>
</tr>
<?php endforeach; ?>
</table>

<?php if (!empty($recentErrors)): ?>
<h2>Recent Errors</h2>
<pre><?= htmlspecialchars($recentErrors) ?></pre>
<?php endif; ?>

<h2>Manifest Content</h2>
<pre><?= htmlspecialchars(file_exists($manifestPath) ? file_get_contents($manifestPath) : 'manifest.json not found') ?></pre>

<p style="color:#666; margin-top:40px;">⚠️ Delete this file after debugging: <code>rm public/server-check.php</code></p>
</body>
</html>
