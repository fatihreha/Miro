# 🚀 SportPulse - Complete Setup Documentation

## ✅ What's Been Done

### 1. Supabase Integration ✓
- **Installed:** `@supabase/supabase-js` and `firebase-admin`
- **Created:** `services/supabase.ts` - Complete Supabase client with helpers
- **Created:** `supabase/schema.sql` - Full PostgreSQL database schema
- **Updated:** `context/AuthContext.tsx` - Migrated from Firebase to Supabase

### 2. Push Notifications ✓
- **Installed:** `@capacitor/push-notifications`
- **Created:** `services/pushNotificationService.ts` - FCM integration
- **Created:** `supabase/functions/send-push-notification/index.ts` - Edge function

### 3. Capacitor Setup ✓
- **Installed:** All Capacitor core packages (iOS, Android, Haptics, Status Bar, Keyboard)
- **Ready for:** Platform initialization

---

## 📋 Setup Steps You Need to Complete

### Step 1: Create Supabase Project (5 minutes)

1. Visit [https://supabase.com](https://supabase.com)
2. Create a new project called **"SportPulse"**
3. Choose a strong database password
4. Wait for project creation (~2 min)
5. Go to **Settings** → **API** and copy:
   - `Project URL`
   - `anon public key`

### Step 2: Configure Environment Variables

Create `.env.local` in project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Keep existing Gemini AI key
API_KEY=your_gemini_api_key_here
```

### Step 3: Run Database Schema

1. In Supabase dashboard: **SQL Editor** → **New Query**
2. Copy/paste contents of `supabase/schema.sql`  
3. Click **Run** (Should see "Success. No rows returned")

### Step 4: Create Storage Buckets

In Supabase **Storage**:
- `avatars` (Public ✅) 
- `photos` (Public ✅)
- `chat-images` (Private ❌)

### Step 5: Enable Realtime

In **Database** → **Replication**, enable for:
- messages
- matches
- workout_requests 
- club_members

### Step 6: Initialize Capacitor

```bash
# Initialize Capacitor
npx cap init SportPulse com.sportpulse.app --web-dir=dist

# Add platforms
npx cap add android
npx cap add ios
```

### Step 7: Setup Firebase for Push Notifications (Optional)

**For Android:**
1. Create Firebase project: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Add Android app
3. Download `google-services.json`
4. Place in `android/app/`

**For iOS:**
1. In Firebase: Add iOS app
2. Download `GoogleService-Info.plist`
3. Place in `ios/App/App/`

**Get Service Account:**
- Firebase Console → Project Settings → Service Accounts
- Generate new private key
- Add to Supabase: **Settings** → **Secrets** → `FIREBASE_SERVICE_ACCOUNT`

### Step 8: Build & Test

```bash
# Development
npm run dev

# Production Build
npm run build

# Sync to native platforms
npx cap sync

# Open in Android Studio
npx cap open android

# Open in Xcode
npx cap open ios
```

---

## 🛠️ What's Changed in Your Code

### Before (Firebase):
```typescript
import { auth, db } from '../services/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

// Firebase methods
await firebaseSignOut(auth);
```

### After (Supabase):
```typescript
import { supabase } from '../services/supabase';

// Supabase methods
await supabase.auth.signOut();
```

---

## 🔥 Key Features Now Available

### ✅ Authentication
- Email/Password login
- Phone OTP authentication
- Auto session management
- Push notification registration on login

### ✅ Database
- PostgreSQL instead of Firestore
- Row Level Security (RLS)
- Auto-matching on mutual likes (Trigger)
- Daily swipe reset (Auto-calculated)

### ✅ Real-time Features
- Live chat messages
- Match notifications
- Club updates
- Workout requests

### ✅ Mobile Ready
- Native iOS/Android support
- Push notifications
- Haptic feedback
- Status bar & keyboard management

---

## 🚨 Important Notes

### Type Differences
- **Firestore:** Used `camelCase` field names
- **Supabase:** Uses `snake_case` column names
- **Handled:** Auto-conversion in `updateSupabaseUser()` function

### Demo Mode
- Still works! For testing without creating accounts
- Uses localStorage fallback

### Gemini AI
- **NO CHANGES** - Still works exactly the same
- Uses `process.env.API_KEY`

---

## 📱 Testing Checklist

- [ ] Sign up new user
- [ ] Send/receive messages  
- [ ] Swipe and match
- [ ] Upload profile photo
- [ ] Join a club
- [ ] Book a trainer
- [ ] Receive push notification (on mobile)
- [ ] Test app on Android device
- [ ] Test app on iOS device

---

## 🐛 Troubleshooting

**"Request failed with status code 400"**
→ Check `.env.local` has correct Supabase keys

**"relation 'users' does not exist"**
→ Run the SQL schema in Supabase SQL Editor

**Push notifications not working**
→ Check Firebase service account is configured in Supabase Secrets

**"Cannot find module @capacitor/..."**
→ Run `npm install` again

---

## 📞 Need Help?

Check these files for reference:
- `services/supabase.ts` - All Supabase helper functions
- `context/AuthContext.tsx` - Authentication logic
- `SUPABASE_SETUP.md` - Detailed Supabase setup

Your app is now ready for mobile deployment! 🎉
