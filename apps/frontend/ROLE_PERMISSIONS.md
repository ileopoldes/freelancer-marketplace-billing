# Role-Based Permissions Implementation - Simplified Version

## Overview

This implementation adds a stable, simple role-based access control to the Freelancer Marketplace Billing system. The system restricts UI elements and pages based on user roles, with specific limitations for freelancer accounts.

## User Roles

The system supports the following user roles:

- **admin**: System administrators with full access
- **user**: Regular users with full access (organizational users)
- **freelancer**: Independent contractors with restricted access

## Access Control Implementation

### 1. Navigation Restrictions

**File: `src/components/Navigation.tsx`**

- Freelancers see only: Dashboard and Projects
- All other users see all navigation items
- Role badges are displayed in the navigation (Admin/Freelancer)

### 2. Dashboard Restrictions

**File: `src/app/page.tsx`**

**Freelancer Access:**

- Marketplace Events tab
- Subscriptions tab
- Invoices tab
- Quick navigation shows only Projects

**All Other Users:**

- Full access to all dashboard tabs and quick navigation

### 3. Page-Level Protection

Protected pages using simple role checks:

- **Organizations** (`/organizations`): Shows access denied screen for freelancers
- **Entities** (`/entities`): Shows access denied screen for freelancers
- **Customers** (`/customers`): Shows access denied screen for freelancers

### 4. Simple Role Check Implementation

Each protected page implements a simple role check after hooks initialization:

```typescript
// Simple redirect for freelancers - just show access denied
if (auth.user?.role === "freelancer") {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Restricted</h1>
        <p className="text-gray-600 mb-4">This page is not available for freelancer accounts.</p>
        <a href="/" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md inline-block">
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
```

### 5. Enhanced Auth Utilities

**File: `src/lib/auth.ts`**

New functions:

- `isFreelancer()`: Check if user is a freelancer
- `hasRole(role)`: Check for specific role
- `canAccessFeature(feature)`: Check feature access permissions

## User Experience

### Freelancer View

- Limited navigation: Only Dashboard and Projects
- Dashboard tabs: Marketplace Events, Subscriptions, Invoices
- Quick navigation: Only Projects
- Role badge: "Freelancer" displayed in header
- Access denied messages for restricted pages

### Admin/User View

- Full navigation access
- All dashboard tabs available
- All quick navigation options
- Admin badge displayed for admin role
- No access restrictions

## Technical Details

### Authentication Flow

1. User logs in and role is stored in localStorage
2. Navigation and dashboard components check user role
3. Protected pages verify permissions via HOC
4. Unauthorized access triggers redirects to dashboard

### Permission Logic

```typescript
// Freelancer allowed features
const freelancerTabs = ["marketplace", "subscriptions", "invoices"];
const freelancerPages = ["projects", "dashboard"];

// Check permissions
if (user.role === "freelancer") {
  // Apply restrictions
} else {
  // Full access for admin/user roles
}
```

### Error Handling

- Graceful loading states during auth checks
- Clear error messages for access denials
- Automatic redirects to appropriate pages
- Fallback to dashboard for unauthorized access

## Testing

To test the role-based permissions:

1. **Admin User**: `admin@example.com / demo123`
   - Should see all features and pages

2. **Regular User**: `user@example.com / demo123`
   - Should see all features and pages

3. **Freelancer**: `freelancer / demo123`
   - Should see limited navigation and dashboard tabs
   - Should be redirected when accessing restricted pages

## Future Enhancements

- Server-side permission validation
- Organization-based access control
- Granular feature permissions
- Role-based API endpoint restrictions
- Audit logging for access attempts
