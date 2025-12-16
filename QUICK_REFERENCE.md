# Quick Reference - Folder Structure

## 📁 Component Locations

### Common Components
```
resources/js/components/common/
├── Button.tsx      → <Button variant="primary" size="md">
├── Card.tsx        → <Card>, <CardHeader>, <CardTitle>, <CardContent>
├── Input.tsx       → <Input label="Email" error={errors.email} />
├── Textarea.tsx    → <Textarea label="Message" rows={5} />
├── Badge.tsx       → <Badge variant="pending">Pending</Badge>
├── Modal.tsx       → <Modal isOpen={isOpen} onClose={close}>
└── Loading.tsx     → <Loading />
```

### Layouts
```
resources/js/components/layout/
├── PublicLayout.tsx   → For: Home, About, Contact
├── UserLayout.tsx     → For: Patient Dashboard
├── DoctorLayout.tsx   → For: Doctor Dashboard
└── AdminLayout.tsx    → For: Admin Dashboard
```

## 📄 Page Structure

```
resources/js/pages/
├── home/index.tsx         → Public home page
├── about/index.tsx        → About page
├── contact/index.tsx      → Contact form
├── auth/                  → Login, Register, ForgotPassword
├── user/                  → Patient pages
├── doctor/                → Doctor pages
└── admin/                 → Admin pages
```

## 🔧 Services (API Calls)

```tsx
import { authService, appointmentService } from '@/services';

// Authentication
authService.login({ email, password });
authService.register(data);
authService.logout();

// Appointments
appointmentService.getUserAppointments();
appointmentService.createAppointment(data);
appointmentService.approveAppointment(id);
```

## 🎣 Hooks

```tsx
import { useAuth, useModal, useToast } from '@/hooks';

// Get current user
const { user, isDoctor, isAuthenticated } = useAuth();

// Modal control
const { isOpen, open, close } = useModal();

// Toast notifications
const { showToast } = useToast();
showToast('Success!', 'success');
```

## 🛠️ Utils

```tsx
import { formatDate, isValidEmail, truncate, getStatusColor } from '@/utils';

// Date formatting
formatDate(new Date(), 'long');        // "December 15, 2025"
formatTime("14:30");                   // "2:30 PM"
getRelativeTime(date);                 // "2 hours ago"

// Validation
isValidEmail("test@example.com");      // true
isStrongPassword("Pass123!");          // { isValid: true, errors: [] }

// Helpers
truncate("Long text...", 20);          // "Long text..."
capitalize("hello");                   // "Hello"
getInitials("John Doe");               // "JD"

// Constants
getStatusColor("pending");             // "yellow"
getRoleLabel("doctor");                // "Doctor"
```

## 🎨 Common Patterns

### Creating a Page
```tsx
import PublicLayout from '@/components/layout/PublicLayout';
import { Card, Button } from '@/components/common';

export default function MyPage() {
  return (
    <PublicLayout>
      <Card>
        <CardContent>
          <h1>My Page</h1>
          <Button variant="primary">Click me</Button>
        </CardContent>
      </Card>
    </PublicLayout>
  );
}
```

### Form with Validation
```tsx
import { Input, Button } from '@/components/common';
import { isValidEmail } from '@/utils';
import { useForm } from '@inertiajs/react';

export default function MyForm() {
  const { data, setData, post, errors } = useForm({
    email: '',
    password: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/login');
  };

  return (
    <form onSubmit={handleSubmit}>
      <Input
        label="Email"
        type="email"
        value={data.email}
        onChange={(e) => setData('email', e.target.value)}
        error={errors.email}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Using Modal
```tsx
import { Modal, Button } from '@/components/common';
import { useModal } from '@/hooks';

export default function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <Button onClick={open}>Open Modal</Button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={close}
        title="My Modal"
        footer={
          <>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button variant="primary">Confirm</Button>
          </>
        }
      >
        <p>Modal content here</p>
      </Modal>
    </>
  );
}
```

### API Service Call
```tsx
import { appointmentService } from '@/services';
import { useEffect, useState } from 'react';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      const data = await appointmentService.getUserAppointments();
      setAppointments(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div>
      {appointments.map(apt => (
        <div key={apt.id}>{apt.appointment_date}</div>
      ))}
    </div>
  );
}
```

## 📦 Barrel Exports

Import multiple items from same folder:
```tsx
// ✅ Good
import { Button, Input, Card, Modal } from '@/components/common';
import { useAuth, useModal, useToast } from '@/hooks';
import { formatDate, isValidEmail } from '@/utils';

// ❌ Avoid
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import { formatDate } from '@/utils/dateUtils';
import { isValidEmail } from '@/utils/validation';
```
