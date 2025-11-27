# RevenueCat Setup Guide

## Prerequisites

1. **App Store Connect** (iOS)
2. **Google Play Console** (Android)
3. **RevenueCat Account** (free to start)

---

## 1. RevenueCat Dashboard Setup (20 minutes)

### Create Project

1. Go to https://app.revenuecat.com/signup
2. Create account (free tier OK for testing)
3. Create new project: "SportPulse"

### Add Apps

#### iOS App
```
Dashboard → Projects → SportPulse → Apps → + New

Platform: iOS
Bundle ID: com.sportpulse.app
App Name: SportPulse
```

#### Android App
```
Platform: Android
Package Name: com.sportpulse.app
App Name: SportPulse
```

### Get API Keys

```
Dashboard → API Keys

Copy:
- iOS API Key: rcapi_XXX
- Android API Key: rcapi_YYY

Add to .env.local:
VITE_REVENUECAT_API_KEY_IOS=rcapi_XXX
VITE_REVENUECAT_API_KEY_ANDROID=rcapi_YYY
```

---

## 2. App Store Connect Setup (iOS)

### Create In-App Purchases

1. **App Store Connect** → Apps → SportPulse
2. **Features** → In-App Purchases → +

#### Premium Monthly
```
Type: Auto-Renewable Subscription
Reference Name: Premium Monthly
Product ID: premium_monthly
Subscription Group: Premium Memberships

Pricing:
- Turkey: ₺99.99/month
- USA: $9.99/month
- EU: €9.99/month

Localization (Turkish):
Display Name: Premium Üyelik
Description: Sınırsız beğeni, konum filtreleri, kişisel antrenörler...
```

#### Premium Yearly (20% discount)
```
Product ID: premium_yearly
Pricing:
- Turkey: ₺959.99/year (₺80/month)
- USA: $96/year ($8/month)
```

#### Weekly Trial (Optional)
```
Product ID: premium_weekly_trial
Free Trial: 7 days
Price after trial: ₺29.99/week
```

### Configure Subscription Group

```
Subscription Group Name: Premium Memberships
Subscription Duration: Monthly, Yearly

Upgrade/Downgrade Rules:
Monthly → Yearly: Immediate upgrade
Yearly → Monthly: At end of period
```

---

## 3. Google Play Console Setup (Android)

### Create Subscriptions

1. **Google Play Console** → SportPulse
2. **Monetization** → Subscriptions → Create subscription

#### Premium Monthly
```
Product ID: premium_monthly
Name: Premium Membership
Description: Unlimited likes, location filters, personal trainers...

Pricing:
- Turkey: ₺99.99/month
- USA: $9.99/month

Free Trial: 7 days (optional)
Grace Period: 3 days
```

#### Premium Yearly
```
Product ID: premium_yearly
Pricing: ₺959.99/year
```

---

## 4. RevenueCat Product Configuration

### Create Entitlement

```
Dashboard → Entitlements → + New

Entitlement ID: premium
Display Name: Premium Access
Description: Full access to all premium features
```

### Link Products

```
Dashboard → Products → + Add Product

iOS:
Product ID: premium_monthly
Entitlement: premium
Store: App Store

Android:
Product ID: premium_monthly
Entitlement: premium
Store: Google Play

Repeat for: premium_yearly, premium_weekly_trial
```

### Create Offerings

```
Dashboard → Offerings → + New

Offering ID: default

Packages:
1. Monthly ($9.99/mo)
   - iOS: premium_monthly
   - Android: premium_monthly

2. Yearly ($96/yr) [BEST VALUE badge]
   - iOS: premium_yearly
   - Android: premium_yearly

3. Weekly Trial (7 days free)
   - iOS: premium_weekly_trial
   - Android: premium_weekly_trial
```

---

## 5. Code Integration

### Initialize in App.tsx

```typescript
import { revenueCatService } from './services/revenueCatService';
import { useAuth } from './context/AuthContext';

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      revenueCatService.initialize(user.id);
    }
  }, [user]);

  return <YourApp />;
}
```

### Premium Upgrade Page

```typescript
// pages/PremiumUpgrade.tsx
import { revenueCatService } from '../services/revenueCatService';

export const PremiumUpgrade = () => {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const current = await revenueCatService.getOfferings();
    setOfferings(current);
  };

  const handlePurchase = async (pkg) => {
    setLoading(true);
    try {
      await revenueCatService.purchasePremium(pkg);
      // Show success
      navigate('/premium-welcome');
    } catch (error) {
      if (error.message === 'PURCHASE_CANCELLED') {
        // User cancelled, no error
      } else {
        // Show error
        alert('Purchase failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {offerings?.availablePackages.map(pkg => (
        <div key={pkg.identifier}>
          <h3>{pkg.product.title}</h3>
          <p>{pkg.product.priceString}</p>
          <button onClick={() => handlePurchase(pkg)}>
            Subscribe
          </button>
        </div>
      ))}
      
      <button onClick={() => revenueCatService.restorePurchases()}>
        Restore Purchases
      </button>
    </div>
  );
};
```

---

## 6. Testing

### iOS Sandbox Testing

1. **Settings** → App Store → Sandbox Account
2. Create sandbox tester in App Store Connect
3. Sign in with sandbox account
4. Test purchase flow

```bash
# Build for testing
npm run build
npx cap sync ios
npx cap open ios

# Xcode → Product → Scheme → Edit Scheme → Run → Info
Build Configuration: Debug

# Run on device
```

### Android Testing

1. **Google Play Console** → Testing → Internal testing
2. Add yourself as tester
3. Install via Play Store internal track

```bash
npm run build
npx cap sync android
npx cap open android

# Android Studio → Build → Generate Signed Bundle
# Upload to Internal Testing
```

### Test Scenarios

- [ ] Purchase monthly subscription
- [ ] Purchase yearly subscription
- [ ] Cancel and restore purchase
- [ ] Subscription expiration handling
- [ ] Upgrade from monthly to yearly
- [ ] Downgrade from yearly to monthly
- [ ] Free trial activation

---

## 7. Webhooks (Optional)

### Configure Webhook

```
RevenueCat Dashboard → Integrations → Webhooks

URL: https://your-project.supabase.co/functions/v1/revenuecat-webhook
Authorization Header: Bearer YOUR_SUPABASE_ANON_KEY

Events:
✅ Initial Purchase
✅ Renewal
✅ Cancellation
✅ Expiration
```

### Edge Function

```typescript
// supabase/functions/revenuecat-webhook/index.ts
export default async (req: Request) => {
  const event = await req.json();

  switch (event.type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      // Update user premium status
      await supabase
        .from('users')
        .update({ 
          is_premium: true,
          premium_expires_at: event.expiration_at_ms 
        })
        .eq('id', event.app_user_id);
      break;

    case 'CANCELLATION':
    case 'EXPIRATION':
      // Revoke premium
      await supabase
        .from('users')
        .update({ is_premium: false })
        .eq('id', event.app_user_id);
      break;
  }

  return new Response('OK');
};
```

---

## 8. Analytics & Monitoring

### Revenue Dashboard

```
RevenueCat Dashboard → Charts

Monitor:
- MRR (Monthly Recurring Revenue)
- Active Subscriptions
- Churn Rate
- Trial Conversion Rate
```

### Custom Events

```typescript
import { analytics } from '../utils/analytics';

// Track purchase
analytics.track('SUBSCRIPTION_PURCHASED', {
  product_id: 'premium_monthly',
  price: 9.99,
  currency: 'USD'
});

// Track cancellation
analytics.track('SUBSCRIPTION_CANCELLED', {
  reason: 'too_expensive'
});
```

---

## 9. Premium Features to Gate

### Unlimited Features
- ❌ Free: 10 swipes/day
- ✅ Premium: Unlimited swipes

### Advanced Filters
- ❌ Free: Basic filters
- ✅ Premium: Location, age, level filters

### Personal Trainers
- ❌ Free: View only
- ✅ Premium: Book sessions

### Priority Support
- ❌ Free: Email support
- ✅ Premium: Live chat

---

## 10. Pricing Strategy

### Recommended Prices

| Plan | Turkey | USA | EU |
|------|--------|-----|-----|
| Weekly (trial) | ₺29.99 | $2.99 | €2.99 |
| Monthly | ₺99.99 | $9.99 | €9.99 |
| Yearly | ₺959.99 | $95.99 | €95.99 |

### Free Trial Options

1. **7-day trial** (recommended for acquisition)
2. **14-day trial** (better conversion)
3. **No trial** (immediate revenue)

---

## ✅ Setup Complete!

**Checklist:**
- [x] RevenueCat project created
- [x] iOS products configured
- [x] Android products configured
- [x] revenueCatService.ts created
- [ ] Test sandbox purchases
- [ ] Submit for review (iOS)
- [ ] Publish (Android)

**Next:** Phase 7 - KVKK Compliance
