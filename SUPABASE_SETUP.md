# Supabase Setup Guide for SportPulse

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Fill in:
   - **Project Name:** SportPulse
   - **Database Password:** (create a strong password - save it!)
   - **Region:** Choose closest to your users
4. Wait 2-3 minutes for project creation

---

## 2. Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Create `.env.local` in project root:

```env
# Supabase
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Gemini AI (keep existing)
API_KEY=your_gemini_api_key
```

---

## 3. Run Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click **"Run"**
5. ✅ You should see "Success. No rows returned"

---

## 4. Set Up Storage Buckets

1. Go to **Storage** in Supabase dashboard
2. Create the following buckets:

### **avatars** (Public)
- Click "Create Bucket"
- Name: `avatars`
- Public: ✅ **Yes**
- Click "Create"

### **photos** (Public)
- Name: `photos`
- Public: ✅ **Yes**

### **chat-images** (Private)
- Name: `chat-images`
- Public: ❌ **No**

---

## 5. Enable Authentication Providers

1. Go to **Authentication** → **Providers**
2. Enable:
   - ✅ **Email** (default, already enabled)
   - ✅ **Phone** (for SMS OTP)
     - You'll need to configure Twilio for production
     - For testing, use test phone numbers

---

## 6. Configure Realtime

1. Go to **Database** → **Replication**
2. Enable Realtime for these tables:
   - ✅ `messages`
   - ✅ `matches`
   - ✅ `workout_requests`
   - ✅ `club_members`

---

## 7. Test Connection

Run this in your project terminal:

```bash
npm run dev
```

Check browser console for connection status.

---

## Next Steps

- [ ] Add Firebase FCM service account for push notifications
- [ ] Deploy Supabase Edge Functions for webhooks
- [ ] Configure production phone authentication
- [ ] Set up database backups

---

## Troubleshooting

**Issue:** "Invalid API key"
- **Fix:** Double-check `.env.local` and restart dev server (`Ctrl+C`, then `npm run dev`)

**Issue:** RLS policies blocking queries
- **Fix:** Make sure you're authenticated. Check `supabase.auth.getUser()`

**Issue:** Realtime not working
- **Fix:** Enable table replication in Database → Replication settings
