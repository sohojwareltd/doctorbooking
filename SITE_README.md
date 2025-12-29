# DoctorBooking — Site (Web) Notes

এই ফাইলটা **web/site (Inertia + React)** অংশে কী কী কাজ করা হয়েছে তার সংক্ষিপ্ত নোট।

## Tech Stack
- Backend: Laravel 12, PHP 8.3
- Frontend: React + Inertia, Vite, Tailwind
- Auth: Fortify (web), Sanctum (API)

## Key Features (Implemented)

### 1) Dashboard/UI (Desktop-focused)
- ৩টা panel: User / Doctor / Assistant (আগের “Admin” UI এখন **Assistant Panel**)
- Layout full-width + icon-based headers
- Tables/forms desktop-friendly

### 2) Assistant Booking (Frontend booking-এর মতো)
Assistant panel এ এখন user booking-এর মতোই appointment book করা যায়:
- Page: `/admin/book-appointment`
- Sidebar menu item added
- Uses same public booking endpoints as public/user booking

### 3) Booking Slot Bug Fix (Today past time দেখানো বন্ধ)
- Backend slot logic আপডেট করা হয়েছে:
  - Past date হলে closed + empty
  - Today হলে `now()` এর আগের time slots ফিল্টার হয়

### 4) Timezone Fix
- App timezone এখন env-driven:
  - `APP_TIMEZONE=Asia/Dhaka`
- `config/app.php` এ default `Asia/Dhaka`

### 5) Global Toast (Top-right) — Site-wide
- সব dashboard/page এ top-right toast system যোগ করা হয়েছে
- ২ভাবে toast আসে:
  1) Inertia/redirect flash (server-side session flash)
  2) Frontend programmatic toast helpers

**Programmatic usage (React/JS):**
- `toastSuccess(message)`
- `toastError(message)`
- `toastWarning(message)`
- `toastInfo(message)`

**Already wired toasts in key flows:**
- Doctor/Appointments status update
- Assistant/Appointments status update
- User booking submit + slot load errors
- Assistant booking submit + slot load errors
- Doctor schedule save
- Doctor prescription create
- Assistant Settings save + image upload
- Profile update + Password update
- Public Contact submit

## Run/Build Commands
- `npm install`
- `npm run dev`
- `npm run build`

## Notes
- White page issue fixed by adjusting toast host integration (ToastHost no longer relies on `usePage()` outside Inertia provider).

