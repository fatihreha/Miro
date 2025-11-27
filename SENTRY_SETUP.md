# Sentry APM Setup Guide

Complete guide for integrating Sentry Application Performance Monitoring in SportPulse.

---

## 📋 Overview

Sentry provides:
- ✅ **Error Tracking** - Automatic error capture and reporting
- ✅ **Performance Monitoring** - Transaction tracking and slow query detection
- ✅ **Session Replay** - Visual reproduction of user sessions
- ✅ **User Context** - Errors linked to specific users
- ✅ **Breadcrumbs** - Debug trail leading to errors
- ✅ **Alerts** - Slack/email notifications for critical issues

**Timeline:** 4 hours  
**Cost:** Free tier (5K errors/month, 10K transactions/month)

---

## 🚀 Quick Start

### 1. Create Sentry Account

**Go to:** https://sentry.io/signup/

1. Create account (free tier)
2. Create new project
   - Platform: **React**
   - Project name: **sportpulse-app**
3. Copy your DSN

**DSN Format:**
```
https://[PUBLIC_KEY]@[ORG_ID].ingest.sentry.io/[PROJECT_ID]
```

### 2. Install Packages

```bash
cd sportpulse
npm install @sentry/react --save
npm install @sentry/vite-plugin --save-dev
```

### 3. Configure Environment

Add to `.env`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://[YOUR_DSN]
VITE_SENTRY_ORG=your-org-name
VITE_SENTRY_PROJECT=sportpulse-app
VITE_SENTRY_AUTH_TOKEN=[from step 4]
```

### 4. Get Auth Token (for source maps)

1. Go to Sentry Settings > Developer Settings
2. Create new **Auth Token**
3. Scopes: `project:read`, `project:releases`, `org:read`
4. Copy token to `VITE_SENTRY_AUTH_TOKEN`

---

## 🔧 Integration

### Initialize in main.tsx

```typescript
// main.tsx
import { sentryService } from './services/sentryService';

// Initialize Sentry BEFORE React
sentryService.initialize({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: import.meta.env.MODE, // 'development' or 'production'
  tracesSampleRate: 0.2, // 20% of transactions
  replaysSessionSampleRate: 0.1, // 10% of sessions
});

// Then render React
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Wrap App with Error Boundary

```typescript
// App.tsx
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              {/* your routes */}
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

### Set User Context on Login

```typescript
// context/AuthContext.tsx
import { sentryService } from '../services/sentryService';

const login = async (email: string, password: string) => {
  const user = await authService.login(email, password);
  
  // Set Sentry user context
  sentryService.setUserContext({
    id: user.id,
    email: user.email,
    name: user.name
  });
  
  setUser(user);
};

const logout = () => {
  sentryService.clearUserContext();
  setUser(null);
};
```

---

## 📊 Usage Examples

### Manual Error Tracking

```typescript
try {
  await riskyOperation();
} catch (error) {
  sentryService.captureError(error as Error, {
    operation: 'riskyOperation',
    userId: user.id,
    extra: { someData }
  });
  
  showErrorToUser();
}
```

### Add Breadcrumbs

```typescript
// Track user actions
sentryService.addBreadcrumb('User clicked premium upgrade', {
  button: 'premium-cta',
  source: 'home-page'
}, 'user');

// Track navigation
sentryService.trackNavigation('/home', '/premium');

// Track feature usage
sentryService.trackFeature('premium-upgrade', {
  plan: 'monthly',
  price: '$9.99'
});
```

### Performance Monitoring

```typescript
// Track API calls
const users = await sentryService.trackApiCall(
  'fetchNearbyUsers',
  () => locationService.getNearbyUsers(userId, 10)
);

// Manual transaction
const transaction = sentryService.startTransaction('Image Upload', 'upload');
try {
  await uploadImage(file);
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Profile Components

```typescript
import { sentryService } from '../services/sentryService';

const MySlowComponent = () => {
  // Expensive render
  return <div>...</div>;
};

// Wrap with profiler
export default sentryService.withProfiler(MySlowComponent, 'MySlowComponent');
```

---

## 🗺️ Source Maps (IMPORTANT)

Source maps make stack traces readable. Without them, errors show minified code.

### Configure Vite Plugin

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

export default defineConfig({
  plugins: [
    react(),
    
    // Only in production builds
    process.env.NODE_ENV === 'production' && sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      
      // Upload source maps
      include: './dist',
      
      // Clean up source maps after upload (don't deploy them)
      sourcemaps: {
        filesToDeleteAfterUpload: ['**/*.map']
      }
    })
  ].filter(Boolean),
  
  build: {
    sourcemap: true, // Generate source maps
  }
});
```

### Build with Source Maps

```bash
npm run build
```

Sentry plugin will:
1. Upload source maps to Sentry
2. Delete `.map` files from dist
3. Create a new release

---

## 🚦 Release Tracking

### Automatic (via Vite Plugin)

Releases are created automatically during build.

### Manual

```typescript
// In main.tsx before init
Sentry.init({
  dsn: '...',
  release: 'sportpulse@1.0.0', // Semantic versioning
});
```

**Best Practice:** Use git commit SHA:

```bash
# In package.json scripts
"build": "VITE_APP_VERSION=$(git rev-parse --short HEAD) vite build"
```

```typescript
release: `sportpulse@${import.meta.env.VITE_APP_VERSION}`
```

---

## 🔔 Alerts Configuration

### 1. Email Alerts

Sentry Dashboard > Alerts > Create Alert

**Error Alert:**
- **Trigger:** Error count > 10 in 1 hour
- **Filter:** environment = production
- **Action:** Email to team

**Performance Alert:**
- **Trigger:** Transaction duration > 3s (95th percentile)
- **Filter:** Transaction = API calls
- **Action:** Slack notification

### 2. Slack Integration

Settings > Integrations > Slack

**Setup:**
1. Install Slack app
2. Connect workspace
3. Choose channel (#alerts)
4. Configure which alerts go to Slack

### 3. Issue Assignment

Auto-assign issues:
- By file path (frontend team)
- By error type (backend team)
- Round-robin

---

## 🧪 Testing

### Test Error Tracking

Add temporary test button:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry Error 🚨');
}}>
  Test Sentry
</button>
```

**Verify in Sentry:**
- Error appears in Issues tab
- Stack trace is readable (source maps working)
- User context visible
- Breadcrumbs present

### Test Performance

```typescript
<button onClick={async () => {
  const transaction = sentryService.startTransaction('Test Transaction');
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  transaction.finish();
}}>
  Test Performance
</button>
```

**Verify in Sentry:**
- Transaction in Performance tab
- Duration ~2 seconds
- Transaction details visible

### Test Error Boundary

```typescript
const BrokenComponent = () => {
  throw new Error('Component Crash Test');
};

// Render somewhere
{showTestError && <BrokenComponent />}
```

**Verify:**
- Fallback UI shows ("Bir Hata Oluştu")
- Error sent to Sentry
- User can click "Tekrar Dene"

---

## 📈 Dashboard Overview

### Issues Tab

**Key Metrics:**
- Error frequency
- Affected users
- First/last seen
- Release version

**Filters:**
- By environment (production/dev)
- By error type
- By user impact
- By release

### Performance Tab

**Transactions:**
- API calls duration
- Page load times
- Component render performance

**Insights:**
- Slowest transactions
- N+1 queries
- Rendering bottlenecks

### Releases Tab

**Track:**
- Errors by release
- Deploy health
- Crash-free sessions %
- New issues introduced

---

## 🔒 Privacy Considerations

### PII Scrubbing

Sentry automatically scrubs:
- Passwords
- Credit cards
- Social security numbers

**Manual scrubbing:**

```typescript
Sentry.init({
  beforeSend(event) {
    // Remove sensitive data
    if (event.user) {
      delete event.user.email; // Optional: remove email
    }
    
    // Scrub request data
    if (event.request?.data) {
      event.request.data = '[Filtered]';
    }
    
    return event;
  }
});
```

### GDPR Compliance

**User Data Deletion:**
1. User requests account deletion
2. Email Sentry support with user ID
3. Sentry deletes all user-linked errors

**Or:** Use Sentry API to delete data

---

## 💰 Pricing Tiers

### Free Tier (Current)
- 5,000 errors/month
- 10,000 transactions/month
- 30-day retention
- ✅ Good for MVP/early stage

### Team ($26/month)
- 50,000 errors/month
- 100,000 transactions/month
- 90-day retention
- Slack integration
- 🎯 Recommended for launch

### Business ($80/month)
- 100,000+ errors/month
- Custom retention
- Advanced features
- Priority support

**Tip:** Start with free tier, upgrade as you grow.

---

## 🐛 Common Issues

### "DSN not configured"

**Symptom:** Warning in console  
**Fix:** Add `VITE_SENTRY_DSN` to `.env`

```bash
VITE_SENTRY_DSN=https://...@sentry.io/...
```

### Source Maps Not Working

**Symptom:** Minified stack traces  
**Fix:** 
1. Check auth token is correct
2. Verify `sourcemap: true` in vite.config.ts
3. Check upload succeeded in build logs

### Too Many Errors

**Symptom:** Quota exceeded  
**Fix:**
1. Filter common errors in `beforeSend`
2. Sample errors: `sampleRate: 0.5` (50%)
3. Upgrade plan

### Errors Not Appearing

**Symptom:** No errors in dashboard  
**Fix:**
1. Check environment filter (dev vs prod)
2. Verify DSN is correct
3. Check network tab for sentry requests
4. Ensure not filtered in `beforeSend`

---

## ✅ Production Checklist

Before deploying:

### Configuration
- [ ] DSN configured
- [ ] Auth token set
- [ ] Environment set to 'production'
- [ ] Release tracking enabled
- [ ] Source maps uploading

### Integration
- [ ] Error boundary wrapping app
- [ ] User context set on login
- [ ] User context cleared on logout
- [ ] Breadcrumbs added to key actions

### Testing
- [ ] Test error captured successfully
- [ ] Stack traces readable
- [ ] User context visible
- [ ] Performance transactions visible

### Alerts
- [ ] Email alerts configured
- [ ] Slack integrated (optional)
- [ ] Critical error alerts set up
- [ ] Performance degradation alerts

### Privacy
- [ ] PII scrubbing verified
- [ ] beforeSend filtering tested
- [ ] GDPR compliance understood

---

## 📚 Resources

- **Sentry Docs:** docs.sentry.io
- **React Integration:** docs.sentry.io/platforms/javascript/guides/react/
- **Vite Plugin:** github.com/getsentry/sentry-javascript-bundler-plugins
- **Best Practices:** docs.sentry.io/product/best-practices/

---

**Questions?** Check Sentry docs or contact support@sentry.io

**Last Updated:** [CURRENT DATE]
