# MediCare - Frontend Structure Guide

## 📂 Complete Directory Structure

```
doctorbooking/
├── frontend/                    # ✅ Standalone React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Reusable UI components
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Textarea.tsx
│   │   │   │   └── index.ts
│   │   │   └── layout/          # Layout components
│   │   │       ├── AdminLayout.tsx
│   │   │       ├── DoctorLayout.tsx
│   │   │       ├── PublicLayout.tsx
│   │   │       └── UserLayout.tsx
│   │   │
│   │   ├── pages/               # Page components
│   │   │   ├── home/index.tsx
│   │   │   ├── about/index.tsx
│   │   │   ├── contact/index.tsx
│   │   │   ├── auth/            # (to be created)
│   │   │   ├── user/            # (to be created)
│   │   │   ├── doctor/          # (to be created)
│   │   │   └── admin/           # (to be created)
│   │   │
│   │   ├── services/            # API service layer
│   │   │   ├── api.ts
│   │   │   ├── authService.ts
│   │   │   ├── appointmentService.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useModal.ts
│   │   │   ├── useToast.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── context/             # React context providers
│   │   │   ├── ToastContext.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/               # Utility functions
│   │   │   ├── constants.ts
│   │   │   ├── dateUtils.ts
│   │   │   ├── helpers.ts
│   │   │   ├── validation.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── types/               # TypeScript types
│   │   ├── css/
│   │   │   └── app.css         # Tailwind styles
│   │   │
│   │   ├── App.jsx             # App component
│   │   └── main.jsx            # Entry point
│   │
│   ├── public/                 # Static assets
│   ├── index.html              # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── .eslintrc.cjs
│   ├── .gitignore
│   └── README.md
│
├── resources/                  # Laravel resources (views, JS, CSS)
│   ├── css/
│   ├── js/                     # Old location (can be cleaned up)
│   └── views/
│
├── app/                        # Laravel backend
├── config/
├── database/
├── routes/
├── storage/
├── tests/
├── vendor/
├── bootstrap/
├── vite.config.ts              # Main Vite config (for Laravel)
├── tailwind.config.js          # Main Tailwind config (for Laravel)
├── package.json                # Root package.json
└── composer.json
```

## 🚀 Setup Instructions

### 1. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 2. Development Mode

Run both backend and frontend simultaneously:

**Terminal 1 - Backend (Laravel)**
```bash
cd d:\laragon\www\doctorbooking
php artisan serve
```

**Terminal 2 - Frontend (React/Vite)**
```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:3000`
Backend runs on: `http://localhost:8000`

### 3. Production Build

```bash
cd frontend
npm run build
```

Output goes to `public/dist/`

## 📁 Key Files

### Entry Point
- **`frontend/src/main.jsx`** - Vite entry point
- **`frontend/index.html`** - HTML template

### Configuration
- **`vite.config.js`** - Vite build configuration
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`package.json`** - Dependencies and scripts

### Styling
- **`frontend/src/css/app.css`** - Global styles with Tailwind

## 🔄 Import Paths

All imports use the `@/` alias pointing to `frontend/src/`:

```tsx
// ✅ Correct
import { Button, Input } from '@/components/common';
import PublicLayout from '@/components/layout/PublicLayout';
import { useAuth } from '@/hooks';
import { appointmentService } from '@/services';
import { formatDate } from '@/utils';

// ❌ Incorrect
import Button from '../../components/common/Button';
```

## 📦 Component Organization

### Common Components (`src/components/common/`)
Reusable UI components used across the app.

**Available:**
- `Button` - Styled button with variants
- `Input` - Form input with validation
- `Textarea` - Form textarea
- `Card` - Card component system
- `Badge` - Status badges
- `Modal` - Modal dialog
- `Loading` - Loading spinner

### Layouts (`src/components/layout/`)
Page wrapper components for different sections.

**Available:**
- `PublicLayout` - For: Home, About, Contact
- `UserLayout` - For: Patient Dashboard
- `DoctorLayout` - For: Doctor Dashboard
- `AdminLayout` - For: Admin Dashboard

## 🔧 Services

API calls are managed through service files:

- **`api.ts`** - Axios configuration
- **`authService.ts`** - Authentication (login, register, logout)
- **`appointmentService.ts`** - Appointments (CRUD)

## 🎣 Custom Hooks

- **`useAuth`** - Get current user & check role
- **`useModal`** - Modal state management
- **`useToast`** - Toast notifications

## 🛠️ Utilities

- **`dateUtils`** - Format dates and times
- **`validation`** - Form validation helpers
- **`helpers`** - General utilities
- **`constants`** - App constants

## 📝 Environment Variables

Create `.env` in `frontend/` directory:

```env
VITE_APP_NAME=MediCare
VITE_API_URL=http://localhost:8000/api
```

## 🎨 Styling

- **Tailwind CSS v4** - Utility-first CSS
- **Medical theme colors** - Pre-configured in `tailwind.config.js`
- **Dark mode support** - Built-in dark mode

## 🚀 Development Workflow

1. **Create a new component** → `frontend/src/components/common/MyComponent.tsx`
2. **Create a new page** → `frontend/src/pages/mypage/index.tsx`
3. **Add utilities** → `frontend/src/utils/myUtil.ts`
4. **Use barrel exports** → Export from `index.ts` files
5. **Add to routes** → Update `routes/web.php` in Laravel

## 📚 Folder Purpose

| Folder | Purpose |
|--------|---------|
| `components/common` | Reusable UI components (Button, Input, etc.) |
| `components/layout` | Layout wrappers for different sections |
| `pages` | Page components organized by feature |
| `services` | API communication layer |
| `hooks` | Reusable React logic |
| `context` | Global state management |
| `utils` | Helper functions and utilities |
| `types` | TypeScript type definitions |
| `css` | Global stylesheets |

## 🔗 Integration with Laravel

The frontend communicates with Laravel backend through:

1. **Inertia.js** - For page rendering and data passing
2. **Axios** - For API calls to `/api` routes
3. **CSRF Protection** - Automatic token handling

## 🚦 Next Steps

1. Install dependencies: `npm install` in `frontend/`
2. Run development server: `npm run dev`
3. Create authentication pages in `pages/auth/`
4. Implement dashboard pages in `pages/user/`, `pages/doctor/`, `pages/admin/`
5. Create API endpoints in Laravel backend
6. Connect services to real API endpoints

## 📞 Support

For issues or questions about the structure, refer to:
- `frontend/README.md` - Frontend-specific documentation
- Root `PROJECT_STRUCTURE.md` - Overall architecture
- Root `QUICK_REFERENCE.md` - Quick lookup guide
