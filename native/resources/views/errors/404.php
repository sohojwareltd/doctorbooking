<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars((string) ($code ?? 404)) ?> - <?= htmlspecialchars((string) config('app.name')) ?></title>
    <style>
        body { font-family: system-ui, sans-serif; background: #f8fafc; color: #0f172a; display: grid; place-items: center; min-height: 100vh; margin: 0; }
        .card { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; padding: 2rem; max-width: 32rem; text-align: center; }
        h1 { font-size: 3rem; margin: 0 0 0.5rem; color: #1e3a8a; }
        p { margin: 0; color: #475569; }
    </style>
</head>
<body>
    <div class="card">
        <h1><?= (int) ($code ?? 404) ?></h1>
        <p><?= htmlspecialchars((string) ($message ?? 'Page not found')) ?></p>
    </div>
</body>
</html>
