# KVKK Compliance Setup Guide

Complete guide for implementing KVKK (Turkish GDPR) compliance features in SportPulse.

---

## 📋 Overview

Phase 7 implements comprehensive privacy compliance:
- ✅ Data export (ZIP file)
- ✅ Account deletion (30-day retention)
- ✅ Consent management
- ✅ Legal documentation (Turkish)

**Completion:** ~5 days  
**Dependencies:** jszip package  
**Legal Review:** REQUIRED before production  

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sportpulse
npm install jszip --save
npm install @types/jszip --save-dev
```

### 2. Run Database Migrations

Execute the SQL script in Supabase SQL Editor:

```bash
# Copy content from:
supabase/privacy_tables.sql
```

**Tables Created:**
- `user_consents` - Consent tracking
- `data_access_logs` - Audit trail
- `deletion_requests` - Account deletion requests

**Verify:**
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('user_consents', 'data_access_logs', 'deletion_requests');
```

### 3. Add Privacy Settings to App

Update `App.tsx` routes:

```typescript
import { PrivacySettings } from './pages/PrivacySettings';

// Add route:
<Route path="/privacy-settings" element={<PrivacySettings />} />
```

### 4. Link from Settings

In `pages/Settings.tsx`, add navigation:

```typescript
<GlassCard onClick={() => navigate('/privacy-settings')}>
  <Shield className="w-6 h-6 text-blue-500" />
  <span>Gizlilik Ayarları</span>
</GlassCard>
```

---

## 📝 Files Created

### Core Service
- **`services/privacyService.ts`** - Privacy operations
  - Data export (ZIP)
  - Account deletion
  - Consent management
  - Audit logging

### Database
- **`supabase/privacy_tables.sql`** - Schema and policies
  - RLS policies
  - Triggers
  - Functions

### UI Components
- **`pages/PrivacySettings.tsx`** - User-facing privacy controls
  - Consent toggles
  - Data export button
  - Account deletion flow

### Legal Documents (Turkish)
- **`public/legal/aydinlatma-metni.md`** - KVKK Information Notice
- **`public/legal/acik-riza-beyani.md`** - Explicit Consent Form
- **`public/legal/privacy-policy.md`** - Full Privacy Policy

---

## 🔧 Configuration

### Environment Variables

Add to `.env`:

```bash
# Privacy Settings
VITE_DATA_RETENTION_DAYS=30
VITE_ADMIN_EMAIL=privacy@sportpulse.com
```

### Supabase RLS

Verify RLS is enabled:

```sql
ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deletion_requests ENABLE ROW LEVEL SECURITY;
```

---

## 👥 User Flow

### 1. First-Time User (Onboarding)

**TODO:** Modify `pages/Onboarding.tsx` to include consent step:

```typescript
// Add after profile creation, before home
<div className="consent-step">
  <h2>Kişisel Verileriniz</h2>
  <p>KVKK Aydınlatma Metni</p>
  
  <label>
    <input type="checkbox" required />
    Kullanım Şartlarını kabul ediyorum
  </label>
  
  <label>
    <input type="checkbox" required />
    KVKK Aydınlatma Metni'ni okudum
  </label>
  
  <label>
    <input type="checkbox" />
    Pazarlama iletişimi almak istiyorum (isteğe bağlı)
  </label>
</div>
```

**Initial Consent Record:**
```typescript
await privacyService.updateConsent(userId, {
  location: true, // Required for core features
  marketing: false, // Explicit opt-in
  analytics: false,
  thirdParty: false
});
```

### 2. Existing Users

**Migration Strategy:**

```sql
-- Create default consent records for existing users
INSERT INTO user_consents (user_id, location_consent, marketing_consent, analytics_consent, third_party_consent)
SELECT 
    id,
    TRUE,  -- location (required)
    FALSE, -- marketing (must opt-in)
    FALSE, -- analytics (must opt-in)
    FALSE  -- third party (must opt-in)
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM user_consents WHERE user_consents.user_id = users.id
);
```

**In-App Notification:**
- Show privacy policy update notification
- Request re-consent for optional features

---

## 🧪 Testing Checklist

### Data Export

- [ ] User clicks "Verilerimi İndir"
- [ ] ZIP file downloads successfully
- [ ] Contains: profile, messages, matches, workouts, consents
- [ ] No other users' data included
- [ ] README.txt file present
- [ ] All JSON files valid

### Account Deletion

- [ ] User navigates to Privacy Settings
- [ ] Clicks "Hesabı Sil"
- [ ] Confirmation dialog appears
- [ ] User confirms deletion
- [ ] Account immediately anonymized
- [ ] Deletion request created (status: pending)
- [ ] Scheduled deletion date set (+30 days)
- [ ] User receives confirmation
- [ ] Can cancel within 30 days
- [ ] After 30 days, hard delete executes

**Test Cancellation:**
- [ ] User cancels deletion within 30 days
- [ ] Account reactivated
- [ ] Deletion request status: cancelled

### Consent Management

- [ ] User toggles marketing consent
- [ ] Change saves to database
- [ ] Consent timestamp updated
- [ ] Required consents cannot be toggled
- [ ] Consent history logged

### Audit Trail

- [ ] Data export logged
- [ ] Consent changes logged
- [ ] Deletion request logged
- [ ] User can view access log

---

## 🔒 Security Verification

### RLS Policies

Test each policy:

```sql
-- Test: User can only see own consents
SET session_authorization = 'user1@example.com';
SELECT * FROM user_consents; -- Should only see own data

-- Test: User can only see own access logs
SELECT * FROM data_access_logs; -- Should only see own logs

-- Test: User can only see own deletion requests
SELECT * FROM deletion_requests; -- Should only see own requests
```

### Data Isolation

- [ ] User A cannot access User B's data
- [ ] User A cannot modify User B's consents
- [ ] User A cannot see User B's access logs

---

## 📅 Scheduled Jobs

### Hard Delete Job (Run Daily)

**Requirement:** Delete accounts after 30-day retention

**Implementation Options:**

#### Option 1: Supabase Edge Function

```typescript
// supabase/functions/process-deletions/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  const { data: pending } = await supabase.rpc('get_pending_deletions');
  
  for (const request of pending) {
    await hardDeleteUser(request.user_id);
  }
  
  return new Response('OK');
});
```

**Deploy:**
```bash
supabase functions deploy process-deletions
```

**Schedule (Cron):**
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST https://[project-ref].functions.supabase.co/process-deletions
```

#### Option 2: Manual Admin Dashboard

Create admin page to manually process deletions:

```typescript
// pages/admin/DeletionManagement.tsx
const { data } = await supabase.rpc('get_pending_deletions');
// Show list with "Process" button
```

---

## ⚖️ Legal Compliance

### BEFORE Production

**CRITICAL:** Legal documents MUST be reviewed by an attorney:

1. **Hire Legal Counsel**
   - Specializing in KVKK/data privacy
   - Turkish law expertise

2. **Review Documents**
   - `aydinlatma-metni.md`
   - `acik-riza-beyani.md`
   - `privacy-policy.md`

3. **Update Placeholders**
   - [ŞİRKET ADI] → Your company name
   - [ADRES] → Physical address
   - [TELEFON] → Contact phone
   - [TARIH] → Current dates

4. **Register with KVKK**
   - Data Controller registration
   - VERBİS (if applicable)

### Recommended Changes

Attorney may require:
- Additional disclosures
- Different consent wording
- Updated retention periods
- Specific third-party mentions

**DO NOT** use templates as-is without legal review!

---

## 📞 KVKK Contact Point

Setup dedicated privacy contact:

**Email:** privacy@sportpulse.com  
**Response Time:** 48 hours (recommended)  
**Max Legal Time:** 30 days (KVKK requirement)

### Email Template

```
Teşekkürler! KVKK talebinizi aldık.

Talebiniz değerlendirilecek ve en geç 30 gün içinde 
size dönüş yapılacaktır.

Referans Numarası: [AUTO-GENERATED]

SportPulse Gizlilik Ekibi
```

---

## 🚨 Common Issues

### ZIP Export Fails

**Symptom:** Error during data export  
**Fix:** Check user permissions on all tables

```sql
GRANT SELECT ON users, messages, matches TO authenticated;
```

### Deletion Not Working

**Symptom:** Account doesn't anonymize  
**Fix:** Verify users table has required columns

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

### Consent Not Saving

**Symptom:** Toggles don't persist  
**Fix:** Check RLS policies

```sql
-- User should be able to insert/update own consents
CREATE POLICY "Users can update own consents"
    ON user_consents FOR UPDATE
    USING (auth.uid() = user_id);
```

---

## 📊 Monitoring

### Metrics to Track

- **Data Export Requests:** Daily count
- **Account Deletions:** Weekly count
- **Consent Changes:** By type
- **Privacy Page Views:** Traffic
- **Legal Doc Views:** Engagement

### Alerts

Set up alerts for:
- Failed data exports (>5% error rate)
- Pending deletions not processed (>35 days)
- Unusual consent patterns (bulk changes)

---

## ✅ Production Checklist

Before going live:

### Legal
- [ ] Attorney reviewed all documents
- [ ] Company info updated (name, address, phone)
- [ ] Dates set correctly
- [ ] KVKK registration complete
- [ ] VERBİS registration (if required)

### Technical
- [ ] Database migrations run
- [ ] RLS policies tested
- [ ] Data export tested with real data
- [ ] Account deletion tested end-to-end
- [ ] Scheduled deletion job configured

### UX
- [ ] Privacy Settings accessible from Settings
- [ ] Onboarding includes consent step
- [ ] Legal documents linked in footer
- [ ] Privacy email monitored

### Compliance
- [ ] Privacy email setup (privacy@sportpulse.com)
- [ ] Response workflow defined
- [ ] Admin dashboard for manual requests
- [ ] 30-day response SLA documented

---

## 🔄 Maintenance

### Monthly
- [ ] Review pending deletion requests
- [ ] Check for unanswered privacy emails
- [ ] Verify scheduled job running

### Quarterly
- [ ] Review data retention policies
- [ ] Update legal docs if needed
- [ ] Security audit

### Annually
- [ ] Full KVKK compliance audit
- [ ] Legal document review
- [ ] Privacy policy update

---

## 📚 References

- **KVKK Official:** www.kvkk.gov.tr
- **KVKK Text:** 6698 Sayılı Kanun
- **VERBİS:** veri.kvkk.gov.tr
- **GDPR (Reference):** gdpr.eu

---

**Questions?** privacy@sportpulse.com

**Last Updated:** [CURRENT DATE]
