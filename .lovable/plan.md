

# Fix: Enable Auto-Confirm Email Signups

## Problem
After registering, users cannot log in because email confirmation is required by default. The auth system returns "Email not confirmed" when they try to sign in.

## Solution
Enable auto-confirm for email signups so users can log in immediately after registration. Also improve the login error message to be more user-friendly.

## Steps

1. **Enable auto-confirm email signups** using the `configure_auth` tool so new users can sign in immediately without needing to verify their email first.

2. **Update the register page** (`src/routes/_app.register.tsx`):
   - Change the success toast from "Check your email to confirm" to "Account created! Welcome aboard."
   - Auto-navigate to `/dashboard` instead of `/login` after successful signup (since auth state will be active immediately).

3. **Improve login error messages** (`src/routes/_app.login.tsx`):
   - Map the technical "Email not confirmed" error to a friendlier message like "Please confirm your email before signing in."
   - Map "Invalid login credentials" to "Incorrect email or password."

4. **Create a profiles table** via database migration to store user display names and preferences:
   - Columns: `id` (uuid, FK to auth.users), `email` (text), `display_name` (text), `created_at`
   - RLS policies: users can read/update only their own profile
   - Trigger to auto-create a profile row on signup

## Technical Notes
- The `configure_auth` tool will be used with `enable_signup: true` and `double_confirm_email_changes: false` to allow immediate access.
- Existing unconfirmed users (motivationalgen@gmail.com, bizmarrowhenry@gmail.com) will need to re-register or have their emails manually confirmed.

