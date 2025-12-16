# MediCare - Full Site Overview & Dynamic Architecture

## 🏗️ System Architecture

### Tech Stack
- **Backend**: Laravel 11 + Inertia.js
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Database**: MySQL/SQLite
- **Authentication**: Laravel Fortify (with 2FA support)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **UI Framework**: Tailwind CSS

### Key Integration Points
```
Browser → Inertia.js → React Router → Frontend Pages
    ↓
Laravel Routes (web.php)
    ↓
Inertia Renders (JSON props)
    ↓
React Components (Pages & Layouts)
```

---

## 📄 Page Structure & Routes

### Public Routes (No Authentication)
1. **`/`** → Welcome Page (Hero Section)
   - Dynamic: Hero animations, particle effects
   - Components: HeroSection, AboutSection, ServicesSection, CaseStudiesSection, GallerySection, BookingSection, ContactSection
   
2. **`/about`** → About Page
3. **`/contact`** → Contact Page

### User Routes (Patients) - Protected by `role:user`
- **`/user/dashboard`** → User dashboard
- **`/user/appointments`** → View bookings
- **`/user/book-appointment`** → Book new appointment
- **`/user/prescriptions`** → View prescriptions
- **`/user/profile`** → User profile settings

### Doctor Routes - Protected by `role:doctor`
- **`/doctor/dashboard`** → Doctor dashboard
- **`/doctor/appointments`** → Manage appointments
- **`/doctor/patients`** → Patient list
- **`/doctor/prescriptions`** → Manage prescriptions
- **`/doctor/schedule`** → Schedule management
- **`/doctor/prescriptions/create`** → Create prescription

### Admin Routes - Protected by `role:admin`
- **`/admin/dashboard`** → Admin dashboard
- **`/admin/users`** → User management
- **`/admin/appointments`** → Appointment management
- **`/admin/doctor`** → Doctor management
- **`/admin/reports`** → System reports
- **`/admin/settings`** → System configuration

---

## 🎨 Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Welcome.jsx              # Home page - loads all sections dynamically
│   │   ├── Dashboard.jsx            # Generic dashboard template
│   │   ├── Auth/                    # Auth pages (to be created)
│   │   ├── user/                    # Patient pages (to be created)
│   │   ├── doctor/                  # Doctor pages (to be created)
│   │   └── admin/                   # Admin pages (to be created)
│   │
│   ├── components/
│   │   ├── sections/
│   │   │   ├── HeroSection.jsx           # Animated hero with particles
│   │   │   ├── AboutSection.jsx          # About doctor info
│   │   │   ├── ServicesSection.jsx       # Services offered
│   │   │   ├── CaseStudiesSection.jsx    # Portfolio/cases
│   │   │   ├── GallerySection.jsx        # Gallery
│   │   │   ├── BookingSection.jsx        # Appointment booking form
│   │   │   └── ContactSection.jsx        # Contact form
│   │   │
│   │   ├── layout/                  # Layout wrappers (to be implemented)
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── DoctorLayout.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   └── UserLayout.tsx
│   │   │
│   │   ├── common/                  # Reusable components
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Loading.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Textarea.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── GlassCard.jsx            # Glassmorphism card with hover effects
│   │   ├── ParticlesBackground.jsx  # Animated particle background
│   │   ├── PrimaryButton.jsx        # Primary CTA button
│   │   └── SectionWrapper.jsx       # Section container with title
│   │
│   ├── main.jsx                     # Entry point - Inertia setup
│   ├── App.jsx                      # Root app component
│   └── css/
│       └── app.css                  # Tailwind CSS + custom styles
│
├── vite.config.js                   # Vite config
├── tailwind.config.js               # Tailwind configuration
└── package.json
```

---

## 🗄️ Database Models & Relationships

### Users Table
```php
user_id ← → appointments (as patient)
       ← → doctorAppointments (as doctor)
       ← → prescriptions (as patient)
       ← → doctorPrescriptions (as doctor)

Fields:
- id, name, email, password (hashed)
- role (user, doctor, admin)
- phone, address, date_of_birth, gender
- Two-factor auth fields (two_factor_secret, etc)
- timestamps (created_at, updated_at)
```

### Appointments Table
```php
appointment_id → user_id (patient)
              → doctor_id (doctor - single doctor assigned)
              → prescription (has one)

Fields:
- id
- user_id (patient booking)
- doctor_id (assigned doctor)
- appointment_date, appointment_time
- status (pending, approved, completed, cancelled)
- symptoms, notes
- Public booking fields: name, phone, email
- timestamps
```

### Prescriptions Table
```php
prescription_id → appointment_id (has one)
               → user_id (patient)
               → doctor_id (prescriber)

Fields:
- id, appointment_id, user_id, doctor_id
- diagnosis, medications, instructions
- tests, next_visit_date
- timestamps
```

---

## 🔄 Dynamic Content Flow

### Welcome Page (Public Hero) - Fully Dynamic
```jsx
Welcome.jsx
├── HeroSection
│   ├── Particle Background (tsparticles)
│   ├── Animated hero title "Dr. Sarah Johnson"
│   ├── Features list with checkmarks
│   ├── CTA buttons with scroll-to-booking
│   └── Trust indicators (15K+, etc)
│
├── AboutSection (Doctor info)
├── ServicesSection (Services list)
├── CaseStudiesSection (Portfolio)
├── GallerySection (Image gallery)
├── BookingSection (Form handling)
│   └── Form State Management
│       ├── formData (name, phone, email, date, time, message)
│       ├── focused field tracking
│       └── Form submission handler
│
└── ContactSection
```

### Animation Engine
- **Framer Motion** provides smooth animations:
  - Scroll-triggered animations (`whileInView`)
  - Parallax effects (`useScroll`, `useTransform`)
  - Staggered children animations
  - Hover and tap interactions
  - Motion variants for entering/exiting

### Glassmorphism Design System
```jsx
GlassCard Component
├── backdrop-blur-xl (strong blur effect)
├── bg-white/10 (semi-transparent background)
├── border-[#00acb1]/20 (teal accent border)
├── shadow-2xl (depth)
└── Hover scale & transform effects
```

---

## 🎯 User Journeys

### 1. Public Visitor Journey
```
Landing on / (Welcome)
↓
Browse sections (Hero → About → Services → Case Studies → Gallery)
↓
Scroll to Booking Section
↓
Fill appointment form (name, phone, email, date, time)
↓
Submit (currently logs to console)
↓
Optional: See Contact section
```

### 2. Patient Journey
```
Sign up / Log in
↓
/user/dashboard (view overview)
↓
/user/book-appointment (select date/time/symptoms)
↓
/user/appointments (view all bookings)
↓
/user/prescriptions (download/view prescriptions)
↓
/user/profile (manage profile)
```

### 3. Doctor Journey
```
Log in (doctor role)
↓
/doctor/dashboard (overview)
↓
/doctor/appointments (approve/manage)
↓
/doctor/patients (view patient list)
↓
/doctor/prescriptions/create (write prescriptions)
↓
/doctor/schedule (manage availability)
```

### 4. Admin Journey
```
Log in (admin role)
↓
/admin/dashboard (system overview)
↓
/admin/users (manage all users)
↓
/admin/appointments (view all)
↓
/admin/reports (analytics)
↓
/admin/settings (config)
```

---

## 📱 Responsive Design

### Breakpoints (Tailwind)
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Key Components Using Grid Responsiveness
```jsx
// HeroSection
grid-cols-1 lg:grid-cols-2    // Single column mobile, 2 columns desktop

// BookingSection Form
grid gap-6 sm:grid-cols-2     // Single column mobile, 2 columns tablet+

// Buttons
flex-col sm:flex-row          // Stacked mobile, inline desktop
```

---

## 🎨 Color System

### Primary Theme (Teal/Turquoise)
```
Primary Dark:    #005963  (Dark teal - headings, primary text)
Primary Light:   #00acb1  (Bright teal - accents, borders)
Muted:           #90e0ef  (Light cyan)
Background:      #caf0f8  (Very light cyan)
```

### Tailwind Classes Used
```
text-[#005963]      Dark teal text
bg-[#005963]        Dark teal background
border-[#00acb1]    Teal borders
bg-[#005963]/10     10% opacity variant
hover:border-[#005963]  Hover states
```

---

## 🔐 Authentication Flow

### Fortify Setup
- Two-factor authentication enabled
- Email verification required
- Login/register routes automatically provided
- Session-based authentication

### Role Middleware
```php
// Protect routes by role
middleware(['auth', 'verified', 'role:user'])
middleware(['auth', 'verified', 'role:doctor'])
middleware(['auth', 'verified', 'role:admin'])
```

### Props Passed to Frontend
```jsx
// Available in all pages via usePage().props
{
  auth: {
    user: {
      id, name, email, role, phone, address, date_of_birth, gender
    }
  }
}
```

---

## 🔗 API Integration Points

### Currently Hardcoded (Need to be implemented)
1. **Booking Form Submission** (BookingSection.jsx:22)
   - Currently: `console.log('Booking submitted:', formData)`
   - TODO: Post to `/api/appointments` or similar

2. **Dashboard Data** (Dashboard.jsx)
   - Currently: Static "You're logged in!"
   - TODO: Fetch user data, appointments, prescriptions

3. **User Profile Pages** (user/*, doctor/*, admin/*)
   - Currently: Not created
   - TODO: Implement with dynamic data

---

## ⚡ Performance Optimizations

### Current Implementation
- Vite for fast HMR (Hot Module Replacement)
- Tailwind CSS for minimal CSS output
- Framer Motion for GPU-accelerated animations
- React code splitting (lazy pages)

### Recommendations
- Add image optimization (next/image equivalent)
- Implement pagination for large lists
- Cache API responses with React Query
- Use web workers for heavy computations

---

## 🛠️ Development Workflow

### Running the Project
```bash
# Start Laravel dev server
php artisan serve

# In another terminal, build frontend
npm run dev

# For production
npm run build
```

### Build Process
1. Vite compiles React + TypeScript → JavaScript bundles
2. Tailwind processes CSS → optimized stylesheet
3. Output placed in `public/build/`
4. Laravel Blade views reference via `@vite` directive

### File Entry Points
- **Backend**: `routes/web.php`
- **Frontend**: `frontend/src/main.jsx` (Inertia setup)
- **Pages**: `frontend/src/pages/*.jsx`
- **Components**: `frontend/src/components/**/*.jsx`
- **Styles**: `frontend/src/css/app.css`

---

## 🚀 What's Working Now

✅ Welcome page with full animations and particles
✅ Responsive layout across all screen sizes
✅ Glassmorphic design components
✅ Auth system with 2FA
✅ Role-based access control
✅ Database models and relationships defined
✅ Route structure for all user types

---

## 🔧 What Needs Implementation

❌ Page content for all user/doctor/admin pages
❌ API endpoints for CRUD operations
❌ Form submission handlers
❌ Data fetching and state management
❌ Layout components (UserLayout, DoctorLayout, AdminLayout)
❌ Common UI components (Badge, Button, Card, Input variants)
❌ Error handling and validation
❌ PDF generation for prescriptions
❌ Email notifications
❌ Calendar/date picker integration for scheduling

---

## 📊 Page Rendering Flow

### Inertia.js Rendering
```
1. Browser requests route (e.g., GET /)
   ↓
2. Laravel route handler called (web.php)
   ↓
3. Inertia::render('Welcome', ['props' => $data])
   ↓
4. Converts to JSON with component name
   ↓
5. Sent to frontend as JSON response
   ↓
6. Inertia.js React wrapper receives JSON
   ↓
7. resolve((name) => pages[`./pages/${name}.jsx`])
   ↓
8. React component rendered with props
   ↓
9. Browser displays interactive UI
```

### Example Welcome Page Load
```
GET / → Inertia::render('Welcome') → main.jsx resolves 'Welcome' 
→ Welcome.jsx imported → renders sections with animations
```

---

## 🎯 Key Features Summary

| Feature | Status | Location |
|---------|--------|----------|
| Public Homepage | ✅ | `/`, Welcome.jsx |
| User Dashboard | 🔄 | `/user/dashboard`, Dashboard.jsx |
| Doctor Dashboard | 🔄 | `/doctor/dashboard` |
| Admin Dashboard | 🔄 | `/admin/dashboard` |
| Booking Form | ✅ | BookingSection.jsx (form only) |
| Appointment Management | ❌ | /appointments pages |
| Prescription Management | ❌ | /prescriptions pages |
| Authentication | ✅ | Laravel Fortify |
| Two-Factor Auth | ✅ | Configured in Fortify |
| Role-Based Access | ✅ | Middleware configured |
| Animations | ✅ | Framer Motion integrated |
| Responsive Design | ✅ | Tailwind + media queries |

---

## 🔗 Related Documentation
- See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for system architecture
- See [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md) for frontend setup
- See [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for development commands
