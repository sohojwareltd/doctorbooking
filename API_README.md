# DoctorBooking — API (Flutter / mobile)

Base URL: append routes to your app URL with the `/api` prefix (example: `https://your-domain.com/api`).

Always send:

- `Accept: application/json`
- For protected routes: `Authorization: Bearer <sanctum_token>`

## CORS

Set `CORS_ALLOWED_ORIGINS` in `.env` (comma-separated origins) or use `*` for permissive local development. Config: [config/cors.php](config/cors.php).

## Auth (Sanctum)

| Method | Path | Auth | Body / notes |
|--------|------|------|----------------|
| POST | `/api/auth/login` | No | `username` (email or phone), `password`, optional `device_name` |
| POST | `/api/auth/register` | No | `name`, `email` **or** `phone`, `password`, `password_confirmation`, optional `device_name` |
| POST | `/api/auth/forgot-password` | No | `username` (email or username on file); always returns generic success message |
| POST | `/api/auth/reset-password` | No | `email`, `token` (from email), `password`, `password_confirmation` |
| GET | `/api/auth/email/verify/{id}/{hash}` | No | Signed URL (from verification email); returns JSON |
| POST | `/api/auth/email/resend` | Yes | Resend verification email |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/logout` | Yes | Revokes current token |

Login and register responses include `token`, `token_type`, and `user` (see [UserResource](app/Http/Resources/UserResource.php); includes `email_verified_at`).

## Public (no auth)

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/public/doctor` | Doctor profile summary |
| GET | `/api/public/chambers` | Active chambers (`location` field is address) |
| GET | `/api/public/schedule` | Query: optional `chamber_id` |
| GET | `/api/public/unavailable-ranges` | Query: optional `chamber_id`; returns `ranges`, `closed_weekdays` (0 = Sunday … 6 = Saturday) |
| GET | `/api/public/slots/{date}` | `date` = `YYYY-MM-DD`; query: optional `chamber_id` |
| GET | `/api/public/booking-preview` | Query: `date`, optional `time`, `chamber_id` |
| GET | `/api/public/captcha` | Optional; session-based when used from browser |
| POST | `/api/public/book-appointment` | Throttled; optional Bearer token links booking to user; captcha fields optional for mobile |
| GET | `/api/public/site-content/home` | Home JSON |

### POST `/api/public/book-appointment`

JSON body (typical): `name`, `phone`, `date` (Y-m-d), optional `email`, `time` (H:i), `symptoms`, `notes`, `chamber_id`, `age`, `gender`, `address`.

Success: `201` with `serial_no`, `estimated_time`, `appointment_id`.

## Patient (`auth:sanctum` + `role:patient`)

Prefix: `/api/patient/`

| Method | Path |
|--------|------|
| GET | `/dashboard-mobile` |
| GET | `/appointments-mobile` |
| GET | `/appointments` |
| GET | `/appointments/{appointment}` |
| GET | `/profile` |
| PUT | `/profile` |
| GET | `/prescriptions` |
| GET | `/prescriptions/{prescription}` |
| GET/POST | `/prescriptions/{prescription}/reports` |
| POST | `/link-guest-appointments` |

## Doctor / compounder

See [routes/api.php](routes/api.php) for `/api/doctor/*` and `/api/compounder/*`.

## Email verification

Users with an email address receive a verification link. The mail uses a signed JSON URL: `GET /api/auth/email/verify/{id}/{hash}?expires=...&signature=...`.

Phone-only registrations get `email_verified_at` set immediately (no email to verify).

## Flutter

In the Flutter app repository, copy `.env.example` to `.env` and set `API_BASE_URL` to your `/api` base.

For Android emulator pointing at Laravel on the host machine, a common value is `http://10.0.2.2:8000/api` (requires cleartext HTTP or HTTPS on the server).
