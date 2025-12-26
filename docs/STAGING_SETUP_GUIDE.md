# 🔧 Staging Ortamı Kurulum Rehberi

Bu rehber, güvenlik testi için production'dan izole bir staging ortamı oluşturmayı açıklar.

---

## 1. Supabase Staging Projesi

### Adım 1: Yeni Supabase Projesi Oluştur
1. [Supabase Dashboard](https://supabase.com/dashboard) → **New Project**
2. Proje adı: `sportpulse-staging`
3. Veritabanı şifresi: Güçlü bir şifre oluştur (production'dan farklı!)
4. Region: Aynı bölge (eu-central-1)

### Adım 2: Schema'yı Kopyala
```bash
# Production'dan schema export et
supabase db dump -f schema.sql --project-ref YOUR_PROD_REF

# Staging'e import et
supabase db push --project-ref YOUR_STAGING_REF
```

Veya manuel olarak:
1. `supabase/schema.sql` dosyasını SQL Editor'da çalıştır
2. `supabase/migrations/` altındaki tüm migration'ları sırayla çalıştır

### Adım 3: Seed Data Ekle
```sql
-- Test kullanıcıları oluştur
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
VALUES 
  ('test-admin-id', 'admin@test.com', crypt('TestAdmin123!', gen_salt('bf')), NOW()),
  ('test-user-id', 'user@test.com', crypt('TestUser123!', gen_salt('bf')), NOW()),
  ('test-trainer-id', 'trainer@test.com', crypt('TestTrainer123!', gen_salt('bf')), NOW());

-- Profilleri oluştur
INSERT INTO users (id, auth_id, email, name, is_trainer)
VALUES
  (gen_random_uuid(), 'test-admin-id', 'admin@test.com', 'Test Admin', false),
  (gen_random_uuid(), 'test-user-id', 'user@test.com', 'Test User', false),
  (gen_random_uuid(), 'test-trainer-id', 'trainer@test.com', 'Test Trainer', true);
```

---

## 2. Staging Environment Variables

### `.env.staging` dosyası oluştur:
```env
# STAGING ENVIRONMENT - GÜVENLİK TESTİ İÇİN
# ⚠️ PRODUCTION KEY'LERİ KULLANMAYIN!

VITE_SUPABASE_URL=https://YOUR_STAGING_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-staging-anon-key

# RevenueCat - Sandbox Mode
VITE_REVENUECAT_IOS_KEY=appl_staging_key
VITE_REVENUECAT_ANDROID_KEY=goog_staging_key

# Firebase - Ayrı staging projesi
VITE_FIREBASE_API_KEY=staging-firebase-key
VITE_FIREBASE_PROJECT_ID=sportpulse-staging

# Sentry - Staging DSN
VITE_SENTRY_DSN=https://staging@sentry.io/project
```

---

## 3. Vercel/Netlify Staging Deploy

### Vercel ile:
```bash
# Staging branch oluştur
git checkout -b staging
git push origin staging

# Vercel'de:
# 1. Project Settings → Git → Production Branch: main
# 2. Add new deployment → Branch: staging
# 3. Environment Variables → staging için ayrı değerler ekle
```

### URL Yapısı:
```
Production: sportpulse.vercel.app
Staging:    sportpulse-staging.vercel.app
```

---

## 4. Test Hesapları

| Rol | Email | Şifre | Açıklama |
|-----|-------|-------|----------|
| Admin | admin@test.com | TestAdmin123! | Yönetici yetkisi |
| User | user@test.com | TestUser123! | Normal kullanıcı |
| Trainer | trainer@test.com | TestTrainer123! | Eğitmen hesabı |
| Premium | premium@test.com | TestPremium123! | Gold üyelik |

---

## 5. Güvenlik Testçisine Verilecek Bilgiler

```
STAGING ORTAMI ERİŞİM BİLGİLERİ
================================

Web URL: https://sportpulse-staging.vercel.app
API URL: https://YOUR_STAGING_PROJECT.supabase.co

Test Hesapları:
- Normal User: user@test.com / TestUser123!
- Premium User: premium@test.com / TestPremium123!
- Trainer: trainer@test.com / TestTrainer123!

API Documentation: /docs/api-endpoints.md
Scope Document: /docs/security-test-scope.md

⚠️ UYARI:
- Production ortamına erişim YOK
- Sadece staging ortamını test edin
- Bulunan açıkları raporlayın, exploit etmeyin
```

---

## 6. Test Sonrası Temizlik

```bash
# 1. Testçinin GitHub erişimini kaldır
# Settings → Collaborators → Remove

# 2. Staging Supabase'i temizle veya sil
supabase projects delete sportpulse-staging

# 3. Staging deploy'u kaldır (Vercel)
vercel remove sportpulse-staging

# 4. API key'leri rotate et (emin olmak için)
# Supabase Dashboard → Settings → API → Regenerate API Keys
```

---

## Checklist

- [ ] Staging Supabase projesi oluşturuldu
- [ ] Schema migration'ları uygulandı
- [ ] Seed data eklendi
- [ ] .env.staging hazırlandı
- [ ] Staging deploy yapıldı
- [ ] Test hesapları oluşturuldu
- [ ] Testçiye erişim sağlandı
- [ ] Test tamamlandı
- [ ] Erişimler kaldırıldı
- [ ] Staging ortamı temizlendi
