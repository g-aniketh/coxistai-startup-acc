# 🔐 Authentication System - Complete Guide

## ✅ Already Implemented!

Your authentication system is **fully implemented** using a modern approach with **Zustand** (instead of React Context) for better performance and **AuthGuard** for protected routes.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  1. AuthProvider (App-Level)           │
│     - Initializes auth on app load     │
│     - Checks for existing token         │
│     - Auto-restores user session        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  2. Auth Store (Zustand)                │
│     - Global auth state                 │
│     - Login/Signup/Logout functions     │
│     - Token management                  │
│     - User data persistence             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  3. AuthGuard (Route Protection)        │
│     - Wraps pages/components            │
│     - Checks authentication             │
│     - Redirects if needed               │
│     - Shows loading state               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  4. API Client                          │
│     - Auto-injects JWT token            │
│     - Handles 401 errors                │
│     - Auto-redirect to login            │
└─────────────────────────────────────────┘
```

---

## 📁 Files Involved

### 1. **Auth Store** (`src/store/auth.ts`)
The global state management using Zustand.

### 2. **Auth Provider** (`src/components/auth/AuthProvider.tsx`)
Initializes authentication on app load.

### 3. **Auth Guard** (`src/components/auth/AuthGuard.tsx`)
Protects routes and handles redirects.

### 4. **API Client** (`src/lib/api.ts`)
Handles API calls with automatic token injection.

---

## 🎯 How It Works

### **1. App Initialization**

When the app loads:

```typescript
// In src/app/layout.tsx
<AuthProvider>
  {children}
</AuthProvider>
```

The `AuthProvider` component:
1. Checks for `authToken` in localStorage
2. If found, calls `/api/v1/auth/me` to validate
3. Restores user session if valid
4. Clears session if invalid

**Code:**
```typescript
// src/components/auth/AuthProvider.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
```

---

### **2. Authentication State (Zustand Store)**

The auth store manages all authentication state:

```typescript
// Usage in any component
import { useAuthStore } from '@/store/auth';

const { 
  user,               // Current user data
  token,              // JWT token
  isAuthenticated,    // Boolean flag
  isLoading,          // Loading state
  error,              // Error message
  login,              // Login function
  signup,             // Signup function
  logout,             // Logout function
  checkAuth,          // Check auth status
} = useAuthStore();
```

**Available Methods:**

#### **Login:**
```typescript
const { login } = useAuthStore();

const handleLogin = async () => {
  const success = await login('email@startup.com', 'password');
  if (success) {
    // Redirect to dashboard or show success
    router.push('/dashboard');
  }
};
```

#### **Signup:**
```typescript
const { signup } = useAuthStore();

const handleSignup = async () => {
  const success = await signup({
    email: 'founder@startup.com',
    password: 'Password123',
    startupName: 'My Startup',
    firstName: 'John',
    lastName: 'Doe'
  });
  if (success) {
    router.push('/dashboard');
  }
};
```

#### **Logout:**
```typescript
const { logout } = useAuthStore();

const handleLogout = () => {
  logout(); // Clears token, resets state, shows toast
  router.push('/login');
};
```

#### **Check Auth:**
```typescript
const { checkAuth } = useAuthStore();

// Validates token and restores session
await checkAuth(); // Returns true if authenticated
```

---

### **3. Protected Routes (AuthGuard)**

Use the `AuthGuard` component to protect routes:

#### **Protected Page (Requires Authentication):**

```typescript
// src/app/dashboard/page.tsx
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div>
        {/* Protected content - only visible to authenticated users */}
        <h1>Dashboard</h1>
      </div>
    </AuthGuard>
  );
}
```

**What happens:**
- ✅ If authenticated → Shows content
- ❌ If not authenticated → Redirects to `/login`
- ⏳ While checking → Shows loading spinner

#### **Public Page (No Authentication Required):**

```typescript
// src/app/login/page.tsx
import AuthGuard from '@/components/auth/AuthGuard';

export default function LoginPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div>
        {/* Public content */}
        <h1>Login</h1>
      </div>
    </AuthGuard>
  );
}
```

**What happens:**
- ✅ If not authenticated → Shows login form
- ✅ If authenticated → Redirects to `/dashboard`

---

### **4. Automatic Token Management**

The API client automatically handles tokens:

```typescript
// src/lib/api.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**What happens:**
- ✅ Every API call automatically includes JWT token
- ✅ 401 errors trigger automatic logout
- ✅ User redirected to login page

---

## 🔄 Authentication Flow

### **Signup Flow:**

```
1. User fills signup form
   ↓
2. useAuthStore().signup() called
   ↓
3. POST /api/v1/auth/signup
   ↓
4. Backend creates Startup + Admin user
   ↓
5. Backend returns JWT token + user data
   ↓
6. Token saved to localStorage
   ↓
7. User state updated in Zustand store
   ↓
8. isAuthenticated = true
   ↓
9. Auto-redirect to /dashboard
   ↓
10. Toast: "Account created successfully!"
```

### **Login Flow:**

```
1. User enters email + password
   ↓
2. useAuthStore().login() called
   ↓
3. POST /api/v1/auth/login
   ↓
4. Backend validates credentials
   ↓
5. Backend returns JWT token + user data
   ↓
6. Token saved to localStorage
   ↓
7. User state updated in Zustand store
   ↓
8. isAuthenticated = true
   ↓
9. Auto-redirect to /dashboard
   ↓
10. Toast: "Login successful!"
```

### **Auto-Login on Page Refresh:**

```
1. User refreshes page or closes/reopens browser
   ↓
2. AuthProvider mounts
   ↓
3. checkAuth() called
   ↓
4. Check localStorage for 'authToken'
   ↓
5. If found → GET /api/v1/auth/me
   ↓
6. If valid → Restore user session
   ↓
7. isAuthenticated = true
   ↓
8. User stays logged in ✅
```

### **Logout Flow:**

```
1. User clicks logout button
   ↓
2. useAuthStore().logout() called
   ↓
3. localStorage.removeItem('authToken')
   ↓
4. Reset Zustand state
   ↓
5. isAuthenticated = false
   ↓
6. Redirect to /login
   ↓
7. Toast: "Logged out successfully"
```

---

## 💡 Usage Examples

### **Example 1: Protected Dashboard Page**

```typescript
// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { apiClient } from '@/lib/api';
import AuthGuard from '@/components/auth/AuthGuard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const response = await apiClient.dashboard.summary();
      if (response.success) {
        setSummary(response.data);
      }
    };
    loadData();
  }, []);

  return (
    <AuthGuard requireAuth={true}>
      <div className="p-8">
        <h1>Welcome, {user?.firstName || user?.email}!</h1>
        <p>Startup: {user?.startup.name}</p>
        <p>Roles: {user?.roles.join(', ')}</p>
        
        {summary && (
          <div>
            <h2>Financial Summary</h2>
            <p>Balance: ${summary.financial.totalBalance}</p>
            <p>Runway: {summary.financial.runwayMonths} months</p>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
```

---

### **Example 2: Conditional Rendering Based on Auth**

```typescript
'use client';

import { useAuthStore } from '@/store/auth';

export default function Header() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <header>
      {isAuthenticated ? (
        <div>
          <p>Hello, {user?.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <a href="/login">Login</a>
          <a href="/register">Signup</a>
        </div>
      )}
    </header>
  );
}
```

---

### **Example 3: Role-Based UI**

```typescript
'use client';

import { useAuthStore } from '@/store/auth';

export default function AdminPanel() {
  const { user } = useAuthStore();

  // Check if user has Admin role
  const isAdmin = user?.roles.includes('Admin');

  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {/* Admin-only content */}
    </div>
  );
}
```

---

### **Example 4: Permission-Based UI**

```typescript
'use client';

import { useAuthStore } from '@/store/auth';

export default function TeamManagement() {
  const { user } = useAuthStore();

  // Check if user has manage_team permission
  const canManageTeam = user?.permissions.includes('manage_team');

  return (
    <div>
      <h1>Team</h1>
      
      {canManageTeam && (
        <button>Invite Team Member</button>
      )}

      {/* Team list visible to all */}
    </div>
  );
}
```

---

## 🎨 AuthGuard Features

The `AuthGuard` component provides:

### **1. Loading State:**
Shows a spinner while checking authentication:
```typescript
if (isChecking || (requireAuth && isLoading)) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      <p>Loading...</p>
    </div>
  );
}
```

### **2. Automatic Redirects:**
- Protected pages → Redirect to `/login` if not authenticated
- Login/Signup pages → Redirect to `/dashboard` if authenticated

### **3. Flexible Usage:**
```typescript
// Require authentication (default)
<AuthGuard requireAuth={true}>...</AuthGuard>

// Public page (but redirect if already logged in)
<AuthGuard requireAuth={false}>...</AuthGuard>

// Public page (no redirect)
// Don't use AuthGuard
```

---

## 🔒 Security Features

### **1. Token Storage:**
- ✅ JWT token stored in localStorage
- ✅ Automatically cleared on logout
- ✅ Cleared on 401 errors
- ⚠️ Consider httpOnly cookies for production (more secure)

### **2. Token Validation:**
- ✅ Token validated on app load
- ✅ Token validated before accessing protected routes
- ✅ Invalid tokens trigger logout

### **3. Automatic Cleanup:**
- ✅ 401 errors clear token and redirect to login
- ✅ Manual logout clears all auth state
- ✅ Failed auth checks clear session

---

## 🧪 Testing Authentication

### **Test Signup:**
```bash
1. Go to http://localhost:3000/register
2. Fill form and submit
3. Should redirect to /dashboard
4. Check localStorage for 'authToken'
5. Refresh page - should stay logged in
```

### **Test Login:**
```bash
1. Go to http://localhost:3000/login
2. Enter email + password
3. Should redirect to /dashboard
4. Check localStorage for 'authToken'
```

### **Test Protected Route:**
```bash
1. Logout
2. Try to access http://localhost:3000/dashboard
3. Should redirect to /login
4. Login again
5. Should access /dashboard successfully
```

### **Test Auto-Login:**
```bash
1. Login successfully
2. Close browser tab
3. Reopen http://localhost:3000/dashboard
4. Should stay logged in (no redirect to login)
```

### **Test Token Expiry:**
```bash
1. Login successfully
2. Manually delete 'authToken' from localStorage
3. Try to access protected route or API
4. Should redirect to /login
```

---

## 📊 State Persistence

Zustand automatically persists authentication state:

```typescript
// Persisted in localStorage under 'auth-storage' key
{
  "state": {
    "user": {...},
    "token": "eyJhbGc...",
    "isAuthenticated": true
  },
  "version": 0
}
```

**What's persisted:**
- ✅ user (full user object)
- ✅ token (JWT)
- ✅ isAuthenticated (boolean)

**What's NOT persisted:**
- ❌ isLoading (resets to false)
- ❌ error (resets to null)

---

## 🎯 Best Practices

### **1. Always Use AuthGuard:**
```typescript
// ✅ Good
<AuthGuard requireAuth={true}>
  <DashboardContent />
</AuthGuard>

// ❌ Bad - no protection
<DashboardContent />
```

### **2. Check Permissions in Components:**
```typescript
const { user } = useAuthStore();
const canEdit = user?.permissions.includes('manage_transactions');

return (
  <div>
    {canEdit && <button>Edit</button>}
  </div>
);
```

### **3. Handle Loading States:**
```typescript
const { isLoading } = useAuthStore();

if (isLoading) {
  return <Spinner />;
}

return <Content />;
```

### **4. Show User Feedback:**
```typescript
import toast from 'react-hot-toast';

const handleAction = async () => {
  try {
    await apiClient.someAction();
    toast.success('Action completed!');
  } catch (error) {
    toast.error('Action failed!');
  }
};
```

---

## ✨ Summary

Your authentication system is **production-ready** with:

✅ **Global State Management** (Zustand)  
✅ **Auto-Login** on page refresh  
✅ **Protected Routes** (AuthGuard)  
✅ **Automatic Token Management**  
✅ **Loading States**  
✅ **Error Handling**  
✅ **Toast Notifications**  
✅ **Role-Based Access**  
✅ **Permission-Based Access**  
✅ **State Persistence**  

**No additional work needed - it's all already implemented!** 🎉

---

## 📚 Related Documentation

- `FRONTEND_SETUP_COMPLETE.md` - Frontend overview
- `backend/API_ENDPOINTS.md` - API documentation
- `PROJECT_COMPLETE.md` - Full project guide

---

**Status:** ✅ **COMPLETE**  
**Last Updated:** October 10, 2025

