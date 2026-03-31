<?php
/**
 * Minimal Inertia test - mimics what app.blade.php should produce.
 * DELETE after testing: rm public/test-app.php
 */

// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Http\Kernel::class);

// Get asset paths from manifest
$manifestPath = __DIR__ . '/build/manifest.json';
$manifest = file_exists($manifestPath) ? json_decode(file_get_contents($manifestPath), true) : [];
$entry = $manifest['frontend/src/main.jsx'] ?? null;

$cssTag = '';
$jsTag = '';
if ($entry) {
    foreach ($entry['css'] ?? [] as $css) {
        $cssTag .= '<link rel="stylesheet" href="/build/' . htmlspecialchars($css) . '">' . "\n";
    }
    $jsTag = '<script type="module" src="/build/' . htmlspecialchars($entry['file']) . '"></script>';
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Asset Load Test</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <?= $cssTag ?>
    <?= $jsTag ?>
</head>
<body class="font-sans antialiased">
    <div id="test-info" style="font-family:monospace;padding:30px;background:#1a1a2e;color:#eee;min-height:100vh">
        <h2 style="color:#4ecca3">Asset Loading Test</h2>
        <p><b>CSS file:</b> <?= $cssTag ? '✅ Tag present' : '❌ Missing' ?></p>
        <p><b>JS file:</b> <?= $jsTag ? '✅ Tag present' : '❌ Missing' ?></p>
        <p id="js-status" style="color:#e94560"><b>JavaScript:</b> ❌ NOT loaded (if you see this, JS failed to load)</p>
        <hr style="border-color:#333">
        <p><b>Generated CSS tag:</b> <code style="color:#3ec1d3"><?= htmlspecialchars($cssTag ?: 'none') ?></code></p>
        <p><b>Generated JS tag:</b> <code style="color:#3ec1d3"><?= htmlspecialchars($jsTag ?: 'none') ?></code></p>
        <hr style="border-color:#333">
        <h3>What to check:</h3>
        <ul>
            <li>Open browser DevTools (F12) → Console tab → look for red errors</li>
            <li>Go to Network tab → refresh → check if .js and .css files load (status 200)</li>
        </ul>
    </div>
    <script>
        // If this runs, basic JS works
        document.getElementById('js-status').innerHTML = '<b>JavaScript:</b> ✅ Inline JS works';
        document.getElementById('js-status').style.color = '#4ecca3';
        
        // Check if the module script loaded
        setTimeout(function() {
            var info = document.getElementById('test-info');
            if (typeof React !== 'undefined' || document.querySelector('[data-reactroot]')) {
                var p = document.createElement('p');
                p.style.color = '#4ecca3';
                p.innerHTML = '<b>React:</b> ✅ Loaded successfully';
                info.appendChild(p);
            }
        }, 3000);
    </script>
</body>
</html>
