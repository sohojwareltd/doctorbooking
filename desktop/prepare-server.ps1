# Prepare Laravel server bundle + PHP runtime for offline desktop EXE
$ErrorActionPreference = "Stop"

$Root = "c:\laragon\www\doctorbooking"
$Desktop = "c:\laragon\www\doctorbooking-desktop"
$Server = Join-Path $Desktop "resources\server"
$PhpDest = Join-Path $Desktop "resources\php"

Write-Host "==> Preparing SQLite database..."
Push-Location $Root
$envBackup = Join-Path $Root ".env.mysql.backup"
if (-not (Test-Path $envBackup)) {
    Copy-Item ".env" $envBackup -Force
}
Copy-Item ".env.desktop" ".env" -Force
New-Item -ItemType Directory -Force -Path "database" | Out-Null
if (-not (Test-Path "database\database.sqlite")) {
    New-Item -ItemType File -Path "database\database.sqlite" | Out-Null
}
& php artisan migrate:fresh --force 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) { throw "Migration failed" }
& php artisan db:seed --class=Database\Seeders\DesktopSeeder --force 2>&1 | Out-Host
Copy-Item $envBackup ".env" -Force
Pop-Location

Write-Host "==> Copying Laravel app to desktop bundle..."
New-Item -ItemType Directory -Force -Path $Server | Out-Null

$excludeDirs = @(
    "node_modules", "frontend\node_modules", ".git", "native",
    "doctorbooking-mobile", "doctorbooking-desktop", "releases",
    "bootstrap\ssr", "storage\logs", "storage\framework\cache",
    "storage\framework\sessions", "storage\framework\views"
)

robocopy $Root $Server /MIR /XD $excludeDirs /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

Copy-Item (Join-Path $Root ".env.desktop") (Join-Path $Server ".env") -Force
Copy-Item (Join-Path $Root ".env.desktop") (Join-Path $Server ".env.desktop") -Force

# Ensure writable storage
$writable = @("storage\app\public", "storage\framework\cache\data", "storage\framework\sessions", "storage\framework\views", "storage\logs", "bootstrap\cache")
foreach ($dir in $writable) {
    New-Item -ItemType Directory -Force -Path (Join-Path $Server $dir) | Out-Null
}

Write-Host "==> Copying PHP runtime..."
$PhpSrc = Get-ChildItem "C:\laragon\bin\php" -Directory | Sort-Object Name -Descending | Select-Object -First 1
if (-not $PhpSrc) { throw "Laragon PHP not found" }
New-Item -ItemType Directory -Force -Path $PhpDest | Out-Null
robocopy $PhpSrc.FullName $PhpDest /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item (Join-Path $Desktop "php.ini.template") (Join-Path $PhpDest "php.ini") -Force

Write-Host "==> Done. Server: $Server"
Write-Host "==> PHP: $PhpDest"
