# Native PHP MVC Migration

Production migration from Laravel 12 to Native PHP 8.3 MVC for **Doctor Booking**.

## Phase 1 — Analysis (Complete)

| Layer | Count |
|-------|------:|
| HTTP routes | ~170 |
| Controllers | 33 |
| Models | 22 |
| Middleware (custom) | 4 |
| Services | 2 |
| Migrations / tables | 61 / ~30 domain |
| Blade views | 15 (Inertia shell + emails/errors) |
| React pages | ~40 in `frontend/src/` |

**Do not break:** React frontend, `/api/*` JSON contracts, session/CSRF/Sanctum SPA auth, existing MySQL schema.

## Current Status

| Phase | Status |
|-------|--------|
| 1 Analysis | Done |
| 2 MVC skeleton | Done (`native/`) |
| 3 Core (Router, PDO, Model, Validator, Logger) | Done |
| 4 Auth API (`/api/auth/*`) | Done |
| 5 Middleware (Auth, Role, CSRF, CORS) | Done |
| 6–9 Admin/Doctor/Reception/API modules | In progress via LaravelBridge |
| 10 Inertia/web routes | Pending |
| 11 Helpers/Mail/Upload/Cache | Partial |
| 12 Testing | Pending |

Unported routes automatically **fall back to Laravel** so the app keeps running during migration.

## Install & Run (Laragon / Apache)

### 1. Install native dependencies

```bash
cd native
composer install
cp .env.example .env
```

### 2. Configure `.env`

```env
APP_URL=http://doctorbooking.test
APP_KEY=base64:...   # copy from Laravel .env

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=doctorbooking
DB_USERNAME=root
DB_PASSWORD=

LARAVEL_ROOT=..
LARAVEL_BRIDGE=true
PUBLIC_PATH=../public
```

`PUBLIC_PATH` points to the existing Laravel `public/` folder (Vite build, storage symlink, images).

### 3. Point virtual host document root to `native/public`

**Apache (Laragon):** set `doctorbooking.test` document root to:

```
c:/laragon/www/doctorbooking/native/public
```

Or add rewrite in project root `.htaccess` to forward all requests to `native/public/index.php`.

### 4. Import database (if fresh install)

Use your existing MySQL database — **no schema changes required**.

### 5. Verify

```bash
curl http://doctorbooking.test/up
# {"status":"ok","engine":"native-php"}

curl -X POST http://doctorbooking.test/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"patient@example.com","password":"password"}'
```

Open `http://doctorbooking.test` — React/Inertia pages still work via LaravelBridge until web routes are ported.

## Directory Structure

```
native/
  app/
    Controllers/     # MVC controllers (Api, Web, Admin…)
    Core/            # Router, Database, Model, Auth, Session…
    Middleware/      # Auth, Role, CSRF, CORS…
    Models/          # PDO models (22 total planned)
    Services/        # Business logic
  bootstrap/         # app.php, helpers.php
  config/            # app, database, mail, session, auth, cors
  public/            # index.php, .htaccess
  routes/            # api.php, web.php
  resources/views/   # PHP views (errors, emails, Inertia shell)
  storage/           # cache, logs, uploads
  vendor/
```

## Android APK

The React frontend (`frontend/src/`) can be wrapped as an APK with **Capacitor**:

1. Keep API base URL as `APP_URL` (e.g. `https://yourdomain.com`)
2. `npm run build` in project root
3. Add Capacitor Android platform
4. Point WebView to built assets or live URL

Native PHP backend serves the same `/api/*` endpoints for mobile.

## Next Modules to Port

1. `Api\PublicController` — booking, captcha, site content
2. `Api\DoctorController` — doctor dashboard API
3. `Api\PatientController` — patient API
4. `Api\PrescriptionController` + templates
5. Fortify web auth + Inertia adapter
6. Mail (PHPMailer), Upload, Cache, Queue CLI

Set `LARAVEL_BRIDGE=false` only when **all** routes are ported and tested.
