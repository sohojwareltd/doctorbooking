# MediCare - Doctor Appointment Booking System

A single-vendor doctor appointment booking system built with Laravel, Inertia.js, React, and Tailwind CSS.

## System Architecture

### Layouts
- **PublicLayout** - For public pages (Home, About, Contact)
- **UserLayout** - For patient dashboard and features
- **DoctorLayout** - For doctor dashboard and management
- **AdminLayout** - For admin controls and oversight

### Common Components
Located in `resources/js/components/common/`:
- **Button** - Styled button with variants (primary, secondary, accent, outline, danger)
- **Card** - Card components (Card, CardHeader, CardTitle, CardContent, CardFooter)
- **Input** - Form input with label and error handling
- **Textarea** - Form textarea with label and error handling
- **Badge** - Status badges for appointments (pending, approved, completed, cancelled)
- **Loading** - Loading spinner component

### Routes Structure

#### Public Routes
- `/` - Home page
- `/about` - About page
- `/contact` - Contact page

#### User Routes (Patients)
- `/user/dashboard` - User dashboard
- `/user/appointments` - View appointments
- `/user/book-appointment` - Book new appointment
- `/user/prescriptions` - View prescriptions
- `/user/profile` - User profile

#### Doctor Routes
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/appointments` - Manage appointments
- `/doctor/patients` - View patients
- `/doctor/prescriptions` - Manage prescriptions
- `/doctor/schedule` - Manage schedule
- `/doctor/profile` - Doctor profile

#### Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - Manage users
- `/admin/appointments` - View all appointments
- `/admin/reports` - System reports
- `/admin/settings` - System settings

## Color Palette

```css
Primary: #03045e
Secondary: #0077b6
Accent: #00b4d8
Muted: #90e0ef
Background: #caf0f8
```

## Database Schema

### Users Table
- id, name, email, password
- role (user, doctor, admin)
- phone, address, date_of_birth, gender
- timestamps

### Appointments Table
- id, user_id, doctor_id
- appointment_date, appointment_time
- status (pending, approved, completed, cancelled)
- symptoms, notes
- timestamps

### Prescriptions Table
- id, appointment_id, user_id, doctor_id
- diagnosis, medications, instructions
- tests, next_visit_date
- timestamps

## Key Features

✅ Single-vendor system (one doctor only)
✅ Role-based access control (user, doctor, admin)
✅ Appointment booking with date/time selection
✅ Appointment status workflow (pending → approved → completed)
✅ Digital prescription management
✅ PDF-ready prescription layout
✅ Clean, medical-themed UI
✅ Responsive design

## System Rules

- **NO** doctor selection dropdown
- **NO** payment gateway integration
- **NO** telemedicine/video call features
- Appointments auto-assigned to the single doctor
- Users can only book appointments
- Doctor manages and approves appointments
- Doctor writes prescriptions for completed appointments

## Next Steps

To complete the system, implement:
1. Dashboard pages for each role
2. Appointment booking functionality
3. Appointment management (approve/complete)
4. Prescription creation and viewing
5. PDF generation for prescriptions
6. User authentication flows
7. Profile management

## Tech Stack

- **Backend**: Laravel 11
- **Frontend**: React 18 + TypeScript
- **Routing**: Inertia.js
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite
- **Authentication**: Laravel Fortify
