# Google OAuth Deployment Guide

This guide explains how to deploy the Google OAuth feature that was just implemented.

## What Was Implemented

✅ **Google Sign-In Button**: Users can now sign in with their Google account
✅ **Secure Authentication**: Regular email/password login now uses Supabase Auth with bcrypt hashing
✅ **Session Persistence**: Users stay logged in across browser sessions
✅ **Auto-Profile Creation**: Google users get a profile automatically created on first sign-in
✅ **Admin Approval Required**: All new users (Google or email) need admin approval

## Before You Deploy

### 1. Run Database Migration

The app needs a new database column. Run this migration in Supabase:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of: `supabase/migrations/20260209_add_auth_integration.sql`
4. Click **Run**

**What this migration does:**
- Adds `auth_user_id` column to link Supabase Auth with user profiles
- Makes `password` column nullable (OAuth users don't need passwords)
- Adds indexes for better performance
- Updates Row Level Security (RLS) policies

### 2. Verify Google OAuth Settings in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Confirm these settings:
   - **Enabled**: ON (green toggle)
   - **Client ID**: `690020585875-ehkiq5l8slbmsi1e9l5gmjjothuk0vk7.apps.googleusercontent.com`
   - **Client Secret**: Your secret (starts with `GOCSPX-...`)
3. Click **Save** if you made changes

### 3. Verify Google Cloud Settings

1. Go to **Google Cloud Console** → **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Confirm **Authorized redirect URIs** includes:
   - `https://hvrciaqjaqjewyskyrbg.supabase.co/auth/v1/callback`
   - `http://localhost:3000` (for local testing)
4. Confirm **Authorized JavaScript origins** includes:
   - `https://haworth-carpool-production.up.railway.app`
   - `http://localhost:3000` (for local testing)

## Testing Locally

### Test Google Sign-In (Localhost)

1. Open http://localhost:3000
2. Click **"Sign in with Google"**
3. Select your Google account
4. You should be redirected back to the app
5. Check browser console for logs:
   - `✅ Found existing session, checking user profile`
   - `📝 Creating profile for new Google user`
   - `✅ Profile created, awaiting admin approval`
6. You should see an alert: "Welcome! Your account has been created and is pending admin approval."

### Test Regular Email/Password Login

1. Try logging in with existing credentials
2. **IMPORTANT**: Existing users with plain-text passwords will NOT work until they're migrated to Supabase Auth

### Migrate Existing Users (If Any)

If you have existing users in the database:

1. **Option A - Manual Migration**: Have each user reset their password through Supabase Auth
2. **Option B - Admin Migration**: Run a script to migrate users (requires service role key)

For now, the simplest approach is to have users create new accounts with Supabase Auth.

## Deploying to Production

### Step 1: Commit and Push Code

```bash
git add -A
git commit -m "Add Google OAuth authentication with Supabase Auth

Authentication Improvements:
- Add Google OAuth sign-in with branded button
- Implement secure password hashing with Supabase Auth
- Add JWT-based session management
- Enable session persistence across page refreshes
- Secure logout functionality
- Auto-profile creation for Google users

Security Features:
- All passwords now encrypted (no more plain text)
- OAuth support for Google
- Secure token-based authentication
- Auto-login on page refresh if session valid
- Admin approval still required for all users

User Experience:
- \"Sign in with Google\" button with Google logo
- Automatic profile creation for OAuth users
- Session persists across browser sessions
- Users stay logged in for 7 days
- Smooth authentication flow

Database Changes:
- Add auth_user_id column to link Supabase Auth users
- Make password column nullable (OAuth users don't need passwords)
- Add unique index on auth_user_id
- Update RLS policies for auth integration

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### Step 2: Run Migration in Supabase

**CRITICAL**: Run the database migration BEFORE testing in production!

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the migration: `supabase/migrations/20260209_add_auth_integration.sql`
3. Verify it succeeded (check for green checkmark)

### Step 3: Test on Railway

1. Wait for Railway auto-deploy to finish
2. Open your Railway URL: `https://haworth-carpool-production.up.railway.app`
3. Test Google sign-in
4. Test regular email/password sign-in (with newly created accounts)

## Troubleshooting

### Issue: "Sign in with Google" redirects to error page

**Cause**: Google OAuth not properly configured

**Fix**:
1. Check Supabase → Authentication → Providers → Google (Client ID and Secret)
2. Check Google Cloud Console → Authorized redirect URIs
3. Make sure `https://hvrciaqjaqjaqjewyskyrbg.supabase.co/auth/v1/callback` is in the list

### Issue: "User account not found" after Google sign-in

**Cause**: Database migration not run or auth_user_id column missing

**Fix**: Run the migration in Supabase SQL Editor

### Issue: Regular login says "Invalid email or password"

**Cause**: Existing users have plain-text passwords (not Supabase Auth accounts)

**Fix**: Users need to create new accounts or use "Forgot Password" flow

### Issue: Google sign-in works but user is not logged in

**Cause**: User is not approved by admin

**Fix**:
1. Admin needs to log in
2. Go to Admin panel
3. Approve the user
4. User can then sign in with Google

### Issue: Console shows "Missing Supabase environment variables"

**Cause**: Environment variables not set in Railway

**Fix**: See `RAILWAY_DEPLOYMENT.md` for setting environment variables

## Security Notes

### What Changed:

1. **Password Security**: All new passwords are hashed with bcrypt (via Supabase Auth)
2. **OAuth Security**: Google OAuth uses industry-standard OAuth 2.0
3. **Session Security**: JWT tokens with 7-day expiry
4. **Database Security**: RLS policies updated to work with auth_user_id

### What's Still Required:

1. **Admin Approval**: All users (Google or email) need admin approval before accessing the app
2. **HTTPS**: Railway provides HTTPS by default
3. **Environment Variables**: Keep Supabase keys secure (already configured in Railway)

## Migration Path for Existing Users

If you have existing users with plain-text passwords:

1. **They cannot log in with their old credentials** (security improvement!)
2. They need to:
   - **Option A**: Click "Sign in with Google" if they have a Google account
   - **Option B**: Create a new account with Supabase Auth
   - **Option C**: Contact admin to have their account migrated

## What Happens When a User Signs in with Google

1. User clicks "Sign in with Google"
2. Redirected to Google sign-in page
3. User selects Google account
4. Google redirects back to app with auth token
5. App checks if user profile exists in database
6. If no profile:
   - Create profile with Google email and name
   - Set `is_approved = false`
   - Show "pending approval" message
   - Sign user out
7. If profile exists and approved:
   - Log user in
   - Redirect to Groups page
8. If profile exists but not approved:
   - Show "pending approval" message
   - Sign user out

## Support

If you encounter issues:
- Check browser console for detailed error messages
- Check Supabase logs: Dashboard → Logs → Auth
- Check Railway logs: `railway logs`
- Verify all environment variables are set

## Next Steps (Optional)

Want to add more OAuth providers?

- **Microsoft/Azure AD**: Add in Supabase → Authentication → Providers
- **GitHub**: Same process as Google
- **Apple**: Requires Apple Developer account

Just repeat the Google OAuth setup process for other providers!
