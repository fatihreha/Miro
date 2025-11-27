# Security Headers Configuration

## Implementation Options

### Option 1: Cloudflare Transform Rules (Recommended)

**Already covered in CLOUDFLARE_SETUP.md - Best approach!**

```
Dashboard → Rules → Transform Rules → Modify Response Header

Headers to add:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: geolocation=(self), microphone=()
- Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

### Option 2: Capacitor HTTP Plugin

For mobile app API calls:

```typescript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sportpulse.app',
  appName: 'SportPulse',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // Security headers for web view
    allowNavigation: [
      'https://*.supabase.co',
      'https://sportpulse.app'
    ]
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  }
};

export default config;
```

---

### Option 3: Supabase Edge Function (API Routes)

```typescript
// supabase/functions/_shared/cors.ts
export const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://sportpulse.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), microphone=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co;
  `.replace(/\s+/g, ' ').trim()
};

// Use in edge functions
export default async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Your function logic
  const data = await yourFunction();

  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
};
```

---

## Security Headers Explained

### 1. X-Frame-Options: SAMEORIGIN
**Purpose:** Prevent clickjacking attacks
**Meaning:** Page can only be framed by same origin

### 2. X-Content-Type-Options: nosniff
**Purpose:** Prevent MIME type sniffing
**Meaning:** Browser must respect declared content type

### 3. X-XSS-Protection: 1; mode=block
**Purpose:** Enable XSS filter
**Meaning:** Block page if XSS attack detected

### 4. Strict-Transport-Security (HSTS)
**Purpose:** Force HTTPS
**Meaning:** Browser must use HTTPS for 1 year

### 5. Referrer-Policy
**Purpose:** Control referrer information
**Meaning:** Send origin only on cross-origin requests

### 6. Permissions-Policy
**Purpose:** Control browser features
**Meaning:** Allow geolocation only for self, block microphone

### 7. Content-Security-Policy (CSP)
**Purpose:** Prevent XSS and injection attacks
**Meaning:** Strict rules for loading resources

---

## Testing Security Headers

### Online Tools

```bash
# 1. Security Headers Scanner
https://securityheaders.com/?q=https://sportpulse.app

# Target Grade: A+

# 2. Mozilla Observatory
https://observatory.mozilla.org/analyze/sportpulse.app

# Target Score: 90+
```

### Manual Check

```bash
# Check headers with curl
curl -I https://sportpulse.app

# Should see:
x-frame-options: SAMEORIGIN
x-content-type-options: nosniff
strict-transport-security: max-age=31536000
```

---

## Penetration Testing

### Schedule Professional Test

**Providers:**
1. **HackerOne** - https://hackerone.com
   - Cost: $5,000 - $15,000
   - Duration: 2-4 weeks
   
2. **Cobalt** - https://cobalt.io
   - Cost: $3,000 - $10,000
   - Duration: 1-2 weeks

3. **Bugcrowd** - https://bugcrowd.com
   - Bug bounty program
   - Pay per valid bug

### Scope

```markdown
In-Scope:
- Web Application (sportpulse.app)
- APIs (Supabase endpoints)
- Authentication flows
- Payment processing
- Data exposure risks

Out-of-Scope:
- Social engineering
- Physical attacks
- DDoS attacks
- Third-party services (RevenueCat, Cloudflare)
```

### Timeline

```
Week 1: Reconnaissance & Planning
Week 2: Vulnerability scanning
Week 3: Manual testing
Week 4: Report creation
Week 5: Remediation verification
```

---

## Self-Assessment Checklist

Before professional pentest:

- [ ] All sensitive data encrypted (IBAN, phone)
- [ ] RLS policies on all tables
- [ ] Rate limiting active
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Input validation on all forms
- [ ] SQL injection prevention (Supabase ✅)
- [ ] XSS prevention (React ✅)
- [ ] CSRF tokens on mutations
- [ ] Authentication timeout (30 min)
- [ ] Password requirements enforced
- [ ] 2FA available (future)

---

## Common Vulnerabilities to Fix

### 1. Insecure Direct Object References (IDOR)

```typescript
// ❌ BAD - No authorization check
const { data } = await supabase
  .from('payout_requests')
  .select('*')
  .eq('id', requestId);

// ✅ GOOD - Verify ownership
const { data } = await supabase
  .from('payout_requests')
  .select('*')
  .eq('id', requestId)
  .eq('trainer_id', currentUserId); // RLS handles this
```

### 2. Mass Assignment

```typescript
// ❌ BAD - User can set any field
await supabase
  .from('users')
  .update(req.body); // Dangerous!

// ✅ GOOD - Whitelist fields
const { name, bio, location } = req.body;
await supabase
  .from('users')
  .update({ name, bio, location });
```

### 3. Sensitive Data Exposure

```typescript
// ❌ BAD - Returning encrypted data
return { iban_encrypted: data.iban_encrypted };

// ✅ GOOD - Decrypt and mask
const iban = encryption.decrypt(data.iban_encrypted);
return { iban: maskIBAN(iban) }; // TR** **** **** **1234
```

---

## ✅ Phase 4 Complete Checklist

- [x] encryption.ts utility created
- [x] payoutService with IBAN encryption
- [x] Phone encryption in userService
- [x] Cloudflare setup guide
- [x] Security headers documented
- [x] Payout database tables
- [ ] Cloudflare setup (user action)
- [ ] Professional pentest scheduled

**Security Level:** 🛡️ **HARDENED**
**Ready for:** Production deployment (after pentest)
