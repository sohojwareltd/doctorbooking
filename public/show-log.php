<?php
/**
 * Show last Laravel log entries. DELETE after debugging: rm public/show-log.php
 */
header('Content-Type: text/html; charset=utf-8');
$basePath = realpath(__DIR__ . '/..');
$logFile = $basePath . '/storage/logs/laravel.log';

// Also show APP_ENV
$envFile = $basePath . '/.env';
$appEnv = '(unknown)';
$appDebug = '(unknown)';
$appUrl = '(unknown)';
if (file_exists($envFile)) {
    $env = file_get_contents($envFile);
    preg_match('/^APP_ENV=(.*)$/m', $env, $m); $appEnv = trim($m[1] ?? '');
    preg_match('/^APP_DEBUG=(.*)$/m', $env, $m); $appDebug = trim($m[1] ?? '');
    preg_match('/^APP_URL=(.*)$/m', $env, $m); $appUrl = trim($m[1] ?? '');
}
?>
<!DOCTYPE html>
<html><head><title>Log Viewer</title>
<style>
body{font-family:monospace;background:#1a1a2e;color:#eee;padding:20px;max-width:1200px;margin:0 auto}
h1{color:#e94560}pre{background:#16213e;padding:15px;border-radius:5px;overflow-x:auto;white-space:pre-wrap;word-wrap:break-word;font-size:11px;max-height:80vh;overflow-y:auto}
.info{background:#16213e;padding:10px;border-radius:5px;margin-bottom:20px}
.info span{color:#4ecca3;font-weight:bold}
</style></head><body>
<h1>Laravel Log Viewer</h1>
<div class="info">
    <b>APP_ENV:</b> <span><?= htmlspecialchars($appEnv) ?></span> &nbsp;|&nbsp;
    <b>APP_DEBUG:</b> <span><?= htmlspecialchars($appDebug) ?></span> &nbsp;|&nbsp;
    <b>APP_URL:</b> <span><?= htmlspecialchars($appUrl) ?></span> &nbsp;|&nbsp;
    <b>Document Root:</b> <span><?= htmlspecialchars($_SERVER['DOCUMENT_ROOT'] ?? 'N/A') ?></span> &nbsp;|&nbsp;
    <b>Base Path:</b> <span><?= htmlspecialchars($basePath) ?></span>
</div>
<?php if (!file_exists($logFile)): ?>
<p style="color:#e94560">laravel.log not found at: <?= htmlspecialchars($logFile) ?></p>
<?php else:
    $size = filesize($logFile);
    // Read last 30KB of the log
    $readBytes = min($size, 30000);
    $fp = fopen($logFile, 'r');
    fseek($fp, -$readBytes, SEEK_END);
    $content = fread($fp, $readBytes);
    fclose($fp);

    // Split into log entries (each starts with [YYYY-MM-DD])
    $entries = preg_split('/(?=\[\d{4}-\d{2}-\d{2})/', $content);
    // Get last 5 entries
    $lastEntries = array_slice($entries, -5);
?>
<p>Log size: <?= round($size/1024) ?> KB — showing last <?= count($lastEntries) ?> entries:</p>
<pre><?= htmlspecialchars(implode("\n", $lastEntries)) ?></pre>
<?php endif; ?>
<p style="color:#666;margin-top:20px">⚠️ Delete: <code>rm public/show-log.php</code></p>
</body></html>
