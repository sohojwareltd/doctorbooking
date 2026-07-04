# Doctor Booking — Offline Windows Desktop

Runs **fully offline** with **SQLite** database — no internet required.

## Ready-to-use files

After build:

| File | Description |
|------|-------------|
| `dist/DoctorBooking-portable.exe` | Single EXE — double-click to run offline |
| `dist/DoctorBooking-Setup.exe` | Windows installer |

Also copied to: `c:\laragon\www\doctorbooking\releases\`

## How it works

1. EXE starts bundled PHP + Laravel on `http://127.0.0.1:17890`
2. Database: SQLite file at `resources/server/database/database.sqlite`
3. Opens app in desktop window — same UI as the website

## Default login (demo data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Doctor | doctor@example.com | password |
| Compounder | imran.compounder@example.com | password |

## Rebuild EXE

```powershell
cd c:\laragon\www\doctorbooking-desktop
npm run build
```

This runs `prepare-server.ps1` which:
- Creates/refreshes SQLite DB with migrations + demo seeders
- Copies Laravel app to `resources/server/`
- Copies PHP from Laragon to `resources/php/`

## Development (without building EXE)

```powershell
cd c:\laragon\www\doctorbooking-desktop
npm run prepare:server
npm start
```

## SQLite only (without EXE)

Use `.env.desktop` in the Laravel project:

```powershell
cd c:\laragon\www\doctorbooking
copy .env.desktop .env
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

Database file: `database/database.sqlite`

## Change server URL for online mode

Edit `main.js` — for online version that loads https://doctor.sohojware.dev, use the previous main.js with remote URL.

## Requirements

- Windows 10/11 (64-bit)
- ~200 MB disk space for full offline bundle
- No internet needed after install
