# Railway Deployment Guide

This guide explains how to deploy the Haworth Carpool app to Railway.

## Prerequisites

- Railway account
- Supabase project set up (see DATABASE_SETUP.md)
- GitHub repository connected to Railway

## Required Environment Variables

You **must** configure these environment variables in Railway for the app to work:

### 1. VITE_SUPABASE_URL
The URL of your Supabase project.

**How to get it:**
1. Go to https://app.supabase.com
2. Select your project (ref: `hvrciaqjaqjewyskyrbg`)
3. Go to **Settings** → **API**
4. Copy the **Project URL**

**Example:**
```
https://hvrciaqjaqjewyskyrbg.supabase.co
```

### 2. VITE_SUPABASE_ANON_KEY
The public anonymous key for your Supabase project.

**How to get it:**
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **anon** **public** key (the long JWT token starting with `eyJ...`)

**Example:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSI...
```

⚠️ **Important:** Use the **anon** key, NOT the service_role key!

## Setting Environment Variables in Railway

### Option 1: Railway Dashboard (Recommended)

1. Go to your Railway project dashboard
2. Select your service (Haworth-Carpool)
3. Click on the **Variables** tab
4. Click **+ New Variable**
5. Add each variable:
   - Variable name: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL
6. Click **Add** and repeat for `VITE_SUPABASE_ANON_KEY`
7. Railway will automatically redeploy with the new variables

### Option 2: Railway CLI

```bash
railway variables set VITE_SUPABASE_URL=https://your-project.supabase.co
railway variables set VITE_SUPABASE_ANON_KEY=eyJhbGci...your-key-here
```

## Verifying Deployment

After setting the environment variables and redeploying:

1. Open your Railway deployment URL
2. You should see the login screen (not a blank page)
3. If you see an error message, check:
   - Environment variables are set correctly
   - No typos in variable names (they are case-sensitive)
   - Supabase project is active and not paused
4. Open browser console (F12) to see detailed initialization logs

## Troubleshooting

### Blank Screen
**Cause:** Environment variables not set
**Solution:** Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Railway dashboard

### "Initialization Error" Message
**Cause:** Invalid environment variables or Supabase connection issue
**Solution:**
- Verify environment variable values are correct
- Check Supabase project status at https://status.supabase.com
- Check browser console for detailed error messages

### App Works Locally But Not in Production
**Cause:** .env file is not deployed (it's in .gitignore)
**Solution:** Environment variables must be set in Railway dashboard, not in .env file

## Build Settings

Railway should automatically detect your Vite app. If needed, configure:

**Build Command:**
```bash
npm run build
```

**Start Command:**
```bash
npm run preview
```

Or use a static file server:
```bash
npx serve -s dist
```

## Database Setup

Make sure you've completed the database setup:

1. Run all migrations in Supabase (see DATABASE_SETUP.md)
2. Migrations to run:
   - `20260206_initial_schema.sql` - Creates tables
   - `20260206_fix_rls_policies.sql` - Fixes permissions
   - `20260206_add_sample_data.sql` - Adds test data (optional)

## Support

For issues:
- Check Railway logs: `railway logs`
- Check browser console for client-side errors
- Verify environment variables: Go to Railway → Variables tab
