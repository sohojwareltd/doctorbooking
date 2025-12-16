# Complete Frontend Folder Structure

```
resources/js/
│
├── components/
│   ├── common/                         # ✅ Reusable UI Components
│   │   ├── Badge.tsx                  # Status badges (pending, approved, completed, cancelled)
│   │   ├── Button.tsx                 # Styled button with variants
│   │   ├── Card.tsx                   # Card component system
│   │   ├── Input.tsx                  # Form input with validation
│   │   ├── Loading.tsx                # Loading spinner
│   │   ├── Modal.tsx                  # Modal dialog
│   │   ├── Textarea.tsx               # Form textarea with validation
│   │   └── index.ts                   # Barrel exports
│   │
│   └── layout/                         # ✅ Layout Components
│       ├── AdminLayout.tsx            # Admin dashboard layout
│       ├── DoctorLayout.tsx           # Doctor dashboard layout
│       ├── PublicLayout.tsx           # Public pages layout
│       └── UserLayout.tsx             # Patient dashboard layout
│
├── pages/                              # ✅ Page Components (Inertia.js)
│   ├── home/
│   │   └── index.tsx                  # Home page
│   ├── about/
│   │   └── index.tsx                  # About page
│   ├── contact/
│   │   └── index.tsx                  # Contact page
│   ├── auth/                          # Authentication pages (to be created)
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── ForgotPassword.tsx
│   │   └── ResetPassword.tsx
│   ├── user/                          # Patient dashboard pages (to be created)
│   │   ├── Dashboard.tsx
│   │   ├── Appointments.tsx
│   │   ├── BookAppointment.tsx
│   │   ├── Prescriptions.tsx
│   │   └── Profile.tsx
│   ├── doctor/                        # Doctor dashboard pages (to be created)
│   │   ├── Dashboard.tsx
│   │   ├── Appointments.tsx
│   │   ├── Patients.tsx
│   │   ├── Prescriptions.tsx
│   │   ├── Schedule.tsx
│   │   └── Profile.tsx
│   └── admin/                         # Admin dashboard pages (to be created)
│       ├── Dashboard.tsx
│       ├── Users.tsx
│       ├── Appointments.tsx
│       ├── Reports.tsx
│       └── Settings.tsx
│
├── services/                           # ✅ API Service Layer
│   ├── api.ts                         # Axios configuration with interceptors
│   ├── authService.ts                 # Authentication API (login, register, logout)
│   ├── appointmentService.ts          # Appointments API (CRUD operations)
│   └── index.ts                       # Barrel exports
│
├── hooks/                              # ✅ Custom React Hooks
│   ├── useAuth.ts                     # Authentication state hook
│   ├── useModal.ts                    # Modal state management
│   ├── useToast.ts                    # Toast notification hook
│   └── index.ts                       # Barrel exports
│
├── context/                            # ✅ React Context Providers
│   ├── ToastContext.tsx               # Global toast notification provider
│   └── index.ts                       # Barrel exports
│
├── utils/                              # ✅ Utility Functions
│   ├── constants.ts                   # App constants (status colors, labels)
│   ├── dateUtils.ts                   # Date formatting utilities
│   ├── helpers.ts                     # General helper functions
│   ├── validation.ts                  # Form validation utilities
│   └── index.ts                       # Barrel exports
│
├── types/                              # TypeScript type definitions
│   └── index.d.ts                     # Global type declarations
│
├── routes/                             # Route definitions
│   └── index.tsx                      # Route configuration
│
├── wayfinder/                          # Existing wayfinder utilities
│
├── actions/                            # Existing actions
│
├── lib/                                # Existing library code
│
├── app.tsx                             # Main application entry point
└── ssr.tsx                             # Server-side rendering entry point

```

## Key Features of This Structure

### ✅ Separation of Concerns
- **Components**: Presentational logic
- **Pages**: Route-specific components
- **Services**: API communication
- **Hooks**: Reusable stateful logic
- **Utils**: Pure helper functions
- **Context**: Global state management

### ✅ Scalability
- Easy to add new components
- Clear file organization
- Barrel exports for clean imports

### ✅ Maintainability
- Everything has a specific place
- Easy to find and update code
- Consistent patterns

### ✅ Type Safety
- TypeScript throughout
- Proper type definitions
- Type exports from services

## Import Examples

```tsx
// Components
import { Button, Input, Card, Modal } from '@/components/common';
import PublicLayout from '@/components/layout/PublicLayout';

// Services
import { appointmentService, authService } from '@/services';

// Hooks
import { useAuth, useModal, useToast } from '@/hooks';

// Utils
import { formatDate, isValidEmail, truncate } from '@/utils';

// Context
import { ToastProvider, useToastContext } from '@/context';
```

## Migration Summary

### Files Moved:
- ✅ `layouts/` → `components/layout/`
- ✅ `pages/Home.tsx` → `pages/home/index.tsx`
- ✅ `pages/About.tsx` → `pages/about/index.tsx`
- ✅ `pages/Contact.tsx` → `pages/contact/index.tsx`

### Files Created:
- ✅ `services/` - Complete API layer
- ✅ `hooks/` - Custom React hooks
- ✅ `context/` - React context providers
- ✅ `utils/` - Utility functions
- ✅ `components/common/Modal.tsx` - Modal component
- ✅ All index.ts barrel exports

### Files Updated:
- ✅ All page components - Updated import paths
- ✅ `routes/web.php` - Updated page paths
- ✅ `components/common/index.ts` - Added Modal export

## Next Steps

To complete the application, implement:
1. Authentication pages (login, register, etc.)
2. User/Patient dashboard pages
3. Doctor dashboard pages
4. Admin dashboard pages
5. API controllers in Laravel backend
6. Form handling and validation
7. Error handling and toast notifications
