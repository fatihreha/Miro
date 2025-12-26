# 🔍 Güvenlik Testi Scope Dokümanı

**Proje:** SportPulse  
**Versiyon:** 1.0  
**Tarih:** [TARİH EKLE]  
**Testçi:** [İSİM EKLE]

---

## 1. Proje Özeti

SportPulse, sporcuları birbirleriyle eşleştiren, antrenör bulma ve gamification özellikleri sunan bir mobil uygulamadır.

### Teknoloji Stack'i:
| Katman | Teknoloji |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Mobile | Capacitor (iOS/Android) |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Ödeme | RevenueCat |
| AI | Google Gemini (Edge Function üzerinden) |
| Push | Firebase Cloud Messaging |

---

## 2. Test Kapsamı (In Scope)

### ✅ Test Edilecek Alanlar:

#### 2.1 Authentication & Authorization
- [ ] Email/Password login güvenliği
- [ ] Session management
- [ ] Password reset flow
- [ ] JWT token handling
- [ ] Supabase RLS policy bypass denemeleri

#### 2.2 API Security
- [ ] Tüm API endpoint'leri (Supabase REST)
- [ ] Edge Function güvenliği (gemini-proxy)
- [ ] Rate limiting etkinliği
- [ ] Input validation (Zod schemas)
- [ ] SQL injection denemeleri
- [ ] NoSQL injection denemeleri

#### 2.3 Data Security
- [ ] Kullanıcı verisi izolasyonu (RLS)
- [ ] IBAN encryption (pgcrypto)
- [ ] Hassas veri exposure kontrolü
- [ ] Cross-user data access denemeleri

#### 2.4 Business Logic
- [ ] Premium feature bypass
- [ ] Swipe limit bypass
- [ ] Double booking prevention
- [ ] Duplicate match prevention
- [ ] Payout system güvenliği

#### 2.5 Frontend Security
- [ ] XSS vulnerabilities
- [ ] CSRF protection
- [ ] Sensitive data in localStorage
- [ ] API keys exposure (bundle analizi)
- [ ] Clickjacking protection

#### 2.6 Mobile-Specific
- [ ] Deep link injection
- [ ] Local storage tampering
- [ ] Certificate pinning (varsa)

---

## 3. Kapsam Dışı (Out of Scope)

### ❌ Test EDİLMEYECEK Alanlar:

- Production ortamı (sadece staging)
- Supabase altyapısı (3rd party)
- Firebase altyapısı (3rd party)
- RevenueCat altyapısı (3rd party)
- DDoS testleri
- Fiziksel güvenlik
- Sosyal mühendislik

---

## 4. Test Hesapları

| Rol | Email | Şifre | Yetkiler |
|-----|-------|-------|----------|
| Normal User | user@test.com | TestUser123! | Temel özellikler |
| Premium User | premium@test.com | TestPremium123! | Gold üyelik |
| Trainer | trainer@test.com | TestTrainer123! | Eğitmen paneli |

---

## 5. API Endpoint'leri

### Supabase REST API:
```
Base URL: https://[PROJECT].supabase.co/rest/v1/

GET    /users              - Kullanıcı listesi (RLS filtreli)
GET    /users?id=eq.[id]   - Tek kullanıcı
PATCH  /users?id=eq.[id]   - Profil güncelleme
POST   /swipes             - Swipe kaydet
GET    /matches            - Match listesi
POST   /messages           - Mesaj gönder
GET    /trainers           - Eğitmen listesi
POST   /bookings           - Randevu oluştur
```

### Edge Functions:
```
POST /functions/v1/gemini-proxy
  Body: { prompt: string, userId: string }
  Rate Limit: 100 req/user/day
```

### Realtime Channels:
```
matches:[user_id]
messages:[match_id]
requests:[user_id]
```

---

## 6. Bilinen Güvenlik Kontrolleri

| Kontrol | Durum | Açıklama |
|---------|-------|----------|
| RLS Policies | ✅ Aktif | Tüm tablolarda |
| Zod Validation | ✅ Aktif | Client-side input |
| Password Policy | ✅ Aktif | 8+ karakter, büyük/küçük/rakam/özel |
| Rate Limiting | ✅ Aktif | AI endpoint, database trigger |
| IBAN Encryption | ✅ Aktif | pgcrypto AES-256 |
| API Key Server-Side | ✅ Aktif | Gemini key Edge Function'da |

---

## 7. Beklenen Teslimatlar

Test sonunda aşağıdaki rapor beklenmektedir:

1. **Executive Summary** - Genel durum özeti
2. **Kritik Bulgular** - Severity: Critical/High
3. **Orta Bulgular** - Severity: Medium
4. **Düşük Bulgular** - Severity: Low/Info
5. **Remediation Önerileri** - Her bulgu için çözüm
6. **Proof of Concept** - Exploitation adımları (varsa)

### Severity Tanımları:
- **Critical:** Veri sızıntısı, authentication bypass, RCE
- **High:** Authorization bypass, SQL injection
- **Medium:** XSS, CSRF, information disclosure
- **Low:** Best practice ihlalleri, minor issues

---

## 8. Kurallar ve Kısıtlamalar

1. ❌ Gerçek kullanıcı verilerine erişim YOK (sadece test data)
2. ❌ Production ortamına erişim YOK
3. ❌ DDoS veya performans degradation testleri YOK
4. ✅ Sadece automated scan + manual testing
5. ✅ Bulunan açıklar SADECE rapora yazılır
6. ✅ Responsible disclosure: Kritik açıklar hemen bildirilir

---

## 9. İletişim

| Konu | Kişi | İletişim |
|------|------|----------|
| Teknik Sorular | [İSİM] | [EMAIL] |
| Acil Durumlar | [İSİM] | [TELEFON] |
| Kritik Bulgular | [İSİM] | [EMAIL] - URGENT başlığı ile |

---

## 10. Onay

Test başlamadan önce bu dokümanın her iki tarafça da kabul edildiğini onaylıyoruz.

**Proje Sahibi:**
İsim: _______________________
İmza: _______________________
Tarih: ______________________

**Güvenlik Testçisi:**
İsim: _______________________
İmza: _______________________
Tarih: ______________________
