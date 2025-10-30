# Authentication System Documentation

This project implements a complete authentication system using Supabase with the following features:

## Features

- ✅ User registration with email, password, first name, last name, and optional company name
- ✅ User login with email and password
- ✅ User logout functionality
- ✅ Protected routes that require authentication
- ✅ Global authentication state management
- ✅ Automatic session persistence
- ✅ Profile management with Supabase

## File Structure

```
├── app/
│   ├── auth/
│   │   ├── layout.tsx          # Auth layout with styling
│   │   ├── login/
│   │   │   └── page.tsx        # Login page
│   │   └── register/
│   │       └── page.tsx        # Registration page
│   └── dashboard/
│       └── page.tsx            # Example protected page
├── components/
│   ├── SignInForm.tsx          # Login form component
│   ├── SignOutButton.tsx       # Logout button component
│   ├── ProtectedRoute.tsx      # Route protection component
│   └── signup.tsx              # Registration form component
├── context/
│   └── AuthContext.tsx         # Global auth context provider
├── hooks/
│   └── useAuth.ts              # Custom auth hook
└── lib/supabase/
    ├── auth.ts                 # Auth utility functions
    └── supabase.ts             # Supabase client configuration
```

## Setup Requirements

### 1. Environment Variables

Make sure you have the following environment variables set in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Supabase Database Schema

Create a `profiles` table in your Supabase database with the following schema:

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

## Usage

### 1. Authentication Pages

The authentication pages are available at:

- **Login**: `/auth/login`
- **Register**: `/auth/register`

### 2. Using Authentication in Components

#### Check Authentication Status

```tsx
import { useAuthContext } from "@/context/AuthContext";

function MyComponent() {
  const { user, profile, loading } = useAuthContext();

  if (loading) return <div>Loading...</div>;

  if (!user) return <div>Please log in</div>;

  return <div>Welcome, {profile?.first_name}!</div>;
}
```

#### Protect Routes

```tsx
import ProtectedRoute from "@/components/ProtectedRoute";

export default function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>This content is only visible to authenticated users</div>
    </ProtectedRoute>
  );
}
```

#### Sign Out

```tsx
import SignOutButton from "@/components/SignOutButton";

function MyComponent() {
  return (
    <SignOutButton className="bg-red-600 text-white px-4 py-2 rounded">
      Sign Out
    </SignOutButton>
  );
}
```

### 3. Programmatic Authentication

#### Sign Up

```tsx
import { signUpWithProfile } from "@/lib/supabase/auth";

const result = await signUpWithProfile({
  email: "user@example.com",
  password: "password123",
  firstName: "John",
  lastName: "Doe",
  companyName: "Acme Corp", // Optional
});

if (result.error) {
  console.error("Signup failed:", result.error);
} else {
  console.log("Signup successful!");
}
```

#### Sign In

```tsx
import { signInWithProfile } from "@/lib/supabase/auth";

const result = await signInWithProfile({
  email: "user@example.com",
  password: "password123",
});

if (result.error) {
  console.error("Login failed:", result.error);
} else {
  console.log("Login successful!", result.user, result.profile);
}
```

#### Sign Out

```tsx
import { signOut } from "@/lib/supabase/auth";

const result = await signOut();

if (result.error) {
  console.error("Sign out failed:", result.error);
} else {
  console.log("Sign out successful!");
}
```

## Styling

The authentication forms use Tailwind CSS for styling and are fully responsive. The design includes:

- Clean, modern UI with proper spacing
- Form validation with error messages
- Loading states for better UX
- Responsive design for mobile and desktop
- Consistent color scheme with the rest of the application

## Security Features

- Password validation (minimum 6 characters)
- Email format validation
- Row Level Security (RLS) in Supabase
- Secure session management
- Protected routes that redirect unauthenticated users

## Example Dashboard

Visit `/dashboard` to see an example of a protected page that displays user information and provides a sign-out option.

## Customization

You can customize the authentication system by:

1. **Modifying the profile schema** in Supabase to include additional fields
2. **Updating the form components** to include new fields
3. **Customizing the styling** by modifying the Tailwind classes
4. **Adding additional validation** in the form components
5. **Implementing password reset** functionality
6. **Adding social authentication** providers through Supabase

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**: Make sure all imports are correct and files exist
2. **Authentication not working**: Check your Supabase environment variables
3. **Database errors**: Verify your Supabase database schema and RLS policies
4. **Styling issues**: Ensure Tailwind CSS is properly configured

### Debug Mode

To enable debug logging, you can add console.log statements in the auth functions or use the browser's developer tools to inspect the authentication state.
