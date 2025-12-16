# Frontend Folder Structure

This document outlines the organized frontend architecture following best practices for React + TypeScript applications.

## Directory Structure

```
resources/js/
├── components/
│   ├── common/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Textarea.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── index.ts        # Barrel export
│   └── layout/             # Layout components
│       ├── PublicLayout.tsx
│       ├── UserLayout.tsx
│       ├── DoctorLayout.tsx
│       └── AdminLayout.tsx
│
├── pages/                  # Page components (Inertia)
│   ├── home/
│   │   └── index.tsx
│   ├── about/
│   │   └── index.tsx
│   ├── contact/
│   │   └── index.tsx
│   ├── auth/               # Authentication pages
│   ├── user/               # Patient dashboard pages
│   ├── doctor/             # Doctor dashboard pages
│   └── admin/              # Admin dashboard pages
│
├── services/               # API service layer
│   ├── api.ts             # Axios configuration
│   ├── authService.ts     # Authentication API
│   ├── appointmentService.ts  # Appointments API
│   └── index.ts           # Barrel export
│
├── hooks/                  # Custom React hooks
│   ├── useAuth.ts         # Authentication hook
│   ├── useToast.ts        # Toast notification hook
│   ├── useModal.ts        # Modal state hook
│   └── index.ts           # Barrel export
│
├── context/                # React Context providers
│   ├── ToastContext.tsx   # Toast notification context
│   └── index.ts           # Barrel export
│
├── utils/                  # Utility functions
│   ├── dateUtils.ts       # Date formatting & manipulation
│   ├── validation.ts      # Form validation helpers
│   ├── helpers.ts         # General helper functions
│   ├── constants.ts       # App constants & labels
│   └── index.ts           # Barrel export
│
├── types/                  # TypeScript type definitions
├── app.tsx                # Main app entry point
└── ssr.tsx               # Server-side rendering entry

```

## Component Guidelines

### Common Components (`components/common/`)
Reusable UI components that can be used across the entire application.

**Available Components:**
- `Button` - Styled buttons with variants (primary, secondary, accent, outline, danger)
- `Input` - Form input with label and error handling
- `Textarea` - Form textarea with label and error handling
- `Card` - Card component system (Card, CardHeader, CardTitle, CardContent, CardFooter)
- `Badge` - Status badges for appointments
- `Modal` - Modal dialog component
- `Loading` - Loading spinner

**Usage:**
```tsx
import { Button, Input, Card, Modal } from '@/components/common';
```

### Layout Components (`components/layout/`)
Layout wrappers for different user roles and public pages.

**Available Layouts:**
- `PublicLayout` - For public pages (home, about, contact)
- `UserLayout` - For patient dashboard
- `DoctorLayout` - For doctor dashboard
- `AdminLayout` - For admin dashboard

**Usage:**
```tsx
import PublicLayout from '@/components/layout/PublicLayout';

export default function Home() {
  return (
    <PublicLayout>
      {/* Your content */}
    </PublicLayout>
  );
}
```

## Services Layer (`services/`)

### API Configuration (`api.ts`)
Axios instance with CSRF token and authentication interceptors.

### Auth Service (`authService.ts`)
Authentication-related API calls using Inertia router.

**Methods:**
- `login(credentials)` - User login
- `register(data)` - User registration
- `logout()` - User logout
- `forgotPassword(email)` - Password reset request
- `resetPassword(data)` - Reset password

### Appointment Service (`appointmentService.ts`)
Appointment management API calls.

**Methods:**
- `getUserAppointments()` - Get user's appointments
- `getDoctorAppointments()` - Get doctor's appointments
- `getAppointment(id)` - Get single appointment
- `createAppointment(data)` - Book new appointment
- `updateAppointment(id, data)` - Update appointment
- `cancelAppointment(id)` - Cancel appointment
- `approveAppointment(id)` - Approve appointment (doctor)
- `completeAppointment(id)` - Complete appointment (doctor)
- `getAvailableSlots(date)` - Get available time slots

**Usage:**
```tsx
import { appointmentService } from '@/services';

const appointments = await appointmentService.getUserAppointments();
```

## Custom Hooks (`hooks/`)

### useAuth
Get current user authentication state.

**Returns:**
- `user` - Current user object or null
- `isAuthenticated` - Boolean
- `isUser` - Is patient role
- `isDoctor` - Is doctor role
- `isAdmin` - Is admin role

**Usage:**
```tsx
import { useAuth } from '@/hooks';

const { user, isDoctor } = useAuth();
```

### useToast
Toast notification state management (standalone).

**Usage:**
```tsx
import { useToast } from '@/hooks';

const { showToast } = useToast();
showToast('Success!', 'success');
```

### useModal
Modal open/close state management.

**Usage:**
```tsx
import { useModal } from '@/hooks';

const { isOpen, open, close } = useModal();
```

## Context (`context/`)

### ToastContext
Global toast notification provider.

**Usage:**
```tsx
import { ToastProvider, useToastContext } from '@/context';

// In app root
<ToastProvider>
  <App />
</ToastProvider>

// In components
const { addToast } = useToastContext();
addToast('Success message', 'success');
```

## Utilities (`utils/`)

### Date Utils (`dateUtils.ts`)
- `formatDate(date, format)` - Format date to readable string
- `formatTime(time)` - Format time to 12-hour format
- `formatDateTime(date)` - Format datetime
- `getRelativeTime(date)` - Get relative time (e.g., "2 hours ago")
- `isToday(date)` - Check if date is today
- `isPast(date)` - Check if date is in the past

### Validation (`validation.ts`)
- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Phone validation
- `isStrongPassword(password)` - Password strength check
- `isRequired(value)` - Required field check
- `minLength(value, min)` - Minimum length check
- `maxLength(value, max)` - Maximum length check

### Helpers (`helpers.ts`)
- `truncate(text, maxLength)` - Truncate text
- `capitalize(text)` - Capitalize first letter
- `toTitleCase(text)` - Convert to title case
- `getInitials(name)` - Get initials from name
- `formatFileSize(bytes)` - Format file size
- `debounce(func, wait)` - Debounce function
- `generateId()` - Generate random ID
- `copyToClipboard(text)` - Copy to clipboard

### Constants (`constants.ts`)
- `getStatusColor(status)` - Get color for status badge
- `getStatusLabel(status)` - Get human-readable status
- `getRoleLabel(role)` - Get human-readable role
- `getGenderLabel(gender)` - Get human-readable gender

**Usage:**
```tsx
import { formatDate, isValidEmail, truncate } from '@/utils';

const formattedDate = formatDate(new Date(), 'long');
const isValid = isValidEmail('test@example.com');
const short = truncate('Long text here', 20);
```

## Best Practices

1. **Use Barrel Exports**: Import from index files for cleaner imports
   ```tsx
   // Good
   import { Button, Input } from '@/components/common';
   
   // Avoid
   import Button from '@/components/common/Button';
   import Input from '@/components/common/Input';
   ```

2. **TypeScript**: Use proper typing for all props and functions

3. **Component Organization**: Keep components small and focused

4. **Service Layer**: Use services for all API calls, avoid direct axios calls in components

5. **Hooks**: Extract reusable logic into custom hooks

6. **Utils**: Use utility functions for common operations

## Import Aliases

The project uses TypeScript path aliases:
- `@/` - Points to `resources/js/`

**Example:**
```tsx
import PublicLayout from '@/components/layout/PublicLayout';
import { useAuth } from '@/hooks';
import { appointmentService } from '@/services';
import { formatDate } from '@/utils';
```
