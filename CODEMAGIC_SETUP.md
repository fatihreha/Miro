# CodeMagic CI/CD Setup Guide

## 1. Başlangıç (5 dakika)

### CodeMagic Account Oluşturma
1. https://codemagic.io/signup adresine gidin
2. GitHub ile giriş yapın
3. SportPulse repository'sini bağlayın

---

## 2. iOS Setup (30 dakika)

### App Store Connect Entegrasyonu

1. **Apple Developer Portal:**
   - https://developer.apple.com/account
   - App identifier oluşturun: `com.sportpulse.app`
   - Distribution certificate oluşturun
   - Provisioning profile oluşturun (App Store)

2. **App Store Connect:**
   - https://appstoreconnect.apple.com
   - Yeni app oluşturun
   - Bundle ID: `com.sportpulse.app`
   - App Store Connect API key oluşturun

3. **CodeMagic:**
   - Teams → Integrations → App Store Connect
   - API key'i yükleyin (p8 file)
   - Issuer ID ve Key ID girin

### iOS Certificates (Otomatik)
CodeMagic otomatik code signing yapacak, manuel yapmanıza gerek yok.

---

## 3. Android Setup (20 dakika)

### Keystore Oluşturma

```bash
cd android/app
keytool -genkey -v -keystore sportpulse.keystore -alias sportpulse -keyalg RSA -keysize 2048 -validity 10000

# Şifreleri kaydedin:
# Keystore password: [güvenli şifre]
# Key password: [güvenli şifre]
```

### CodeMagic'e Keystore Yükleme

1. CodeMagic → Teams → Code signing identities
2. Android → Upload keystore
3. `sportpulse.keystore` dosyasını yükleyin
4. Alias: `sportpulse`
5. Passwords girin

### Google Play Console

1. https://play.google.com/console
2. Yeni app oluşturun
3. API Access → Create service account
4. JSON key dosyasını indirin

5. CodeMagic → Teams → Integrations → Google Play
6. Service account JSON'u yükleyin

---

## 4. Environment Variables

CodeMagic → Apps → SportPulse → Environment variables

```bash
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# Gemini AI
API_KEY=your_gemini_key

# RevenueCat (Phase 6'da eklenecek)
# VITE_REVENUECAT_API_KEY=your_key

# Sentry (Phase 8'de eklenecek)
# VITE_SENTRY_DSN=your_dsn
```

---

## 5. Test Deployment

### İlk Build'i Tetikleme

```bash
git add codemagic.yaml
git commit -m "Add CodeMagic CI/CD"
git push origin main
```

CodeMagic otomatik olarak:
1. ✅ Dependencies yükler
2. ✅ Tests çalıştırır
3. ✅ iOS build yapar
4. ✅ Android build yapar
5. ✅ TestFlight'a upload eder (iOS)
6. ✅ Internal testing'e upload eder (Android)

---

## 6. Build Status Kontrol

- https://codemagic.io/apps
- SportPulse → Builds
- Real-time logs izleyin
- Artifacts indirin (IPA/AAB)

---

## 7. Otomatik Deployment

### TestFlight (iOS)
- Her `main` branch push'u → TestFlight beta
- Beta tester davet edin
- Apple review'dan geçtikten sonra production

### Google Play Internal Testing (Android)
- Her `main` branch push'u → Internal track
- Internal testers ekleyin
- Production'a promote edin

---

## 8. Troubleshooting

### iOS Build Fail
```bash
# CocoaPods issue
cd ios/App
pod deintegrate
pod install
git commit -am "Fix pods"
git push
```

### Android Build Fail
```bash
# Gradle cache
cd android
./gradlew clean
git commit -am "Clean gradle"
git push
```

### Signing Issues
- CodeMagic → Code signing identities kontrol
- Certificates expire olabilir (yenileyin)

---

## 9. Maliyetler

**Free Tier:**
- 500 build minutes/month
- Yeterli test ve development için

**Starter Plan ($95/month):**
- Unlimited builds
- Priority support
- Production releases için önerilen

---

## 10. Best Practices

### Branch Strategy
```bash
main → Production builds
develop → Staging builds  
feature/* → No auto-build
```

### Version Bumping
```bash
# iOS: ios/App/App/Info.plist
# Android: android/app/build.gradle

# Auto bump with script:
npm version patch
git push --tags
```

### Notifications
CodeMagic → Apps → SportPulse → Settings → Notifications
- Slack webhook
- Email alerts
- Build status badges

---

## ✅ Setup Complete!

Başarılı build sonrası:
- 📱 iOS: TestFlight link alın
- 🤖 Android: Internal testing link alın
- 👥 Beta testers davet edin
- 🐛 Bug reports toplayın

Sonraki adım: **Phase 2 - GPS Tracking** (4 gün)
