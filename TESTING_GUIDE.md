# 🧪 SportPulse - Test Rehberi

## Testlere Başlamadan Önce

### 1. Supabase Kurulumu Yapın
```bash
# 1. supabase.com'a gidin ve yeni proje oluşturun
# 2. SQL Editor'da schema.sql'i çalıştırın
# 3. Storage'da bucket'ları oluşturun: avatars, photos, chat-images
# 4. Realtime'ı aktifleştirin (users, matches, messages, workout_requests)
```

### 2. Environment Variables
`.env.local` dosyasına ekleyin:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
API_KEY=your_gemini_api_key
```

### 3. Uygulamayı Başlatın
```bash
npm run dev
```

---

## ✅ Test Checklist

### Real-time Features

#### 1. Chat Mesajlaşma (Chat.tsx)
- [ ] 2 farklı tarayıcıda/cihazda uygulamayı açın
- [ ] Kullanıcı 1: Login olun
- [ ] Kullanıcı 2: Farklı hesapla login olun
- [ ] Kullanıcı 1: Chat'e gidin, Kullanıcı 2'ye mesaj gönderin
- [ ] **BEKLENEN:** Kullanıcı 2'de mesaj anında görünmeli (< 1sn)
- [ ] Kullanıcı 2: Cevap yazın
- [ ] **BEKLENEN:** Kullanıcı 1'de hemen görünmeli
- [ ] Sayfayı yenileyin
- [ ] **BEKLENEN:** Tüm mesajlar korunmuş olmalı

#### 2. Match Detection (Home.tsx)
- [ ] Kullanıcı 1: Home'da sağa kaydırın (like)
- [ ] Kullanıcı 2: Kullanıcı 1'i sağa kaydırın (like)
- [ ] **BEKLENEN:** Her iki tarafta da "Match!" overlay çıkmalı
- [ ] **BEKLENEN:** AI uyumluluk skoru görünmeli
- [ ] Matches sayfasına gidin
- [ ] **BEKLENEN:** Yeni match listede olmalı

#### 3. Match List Updates (Matches.tsx)
- [ ] Matches sayfasını açık bırakın
- [ ] Başka cihazdan yeni bir match oluşturun
- [ ] **BEKLENEN:** Liste otomatik güncellenm eli (3-5sn içinde)
- [ ] **BEKLENEN:** Bildirim gösterilmeli

#### 4. Club Members (Clubs.tsx)
- [ ] 2 cihazda farklı kullanıcılarla login olun
- [ ] Kullanıcı 1: Yeni club oluşturun
- [ ] Kullanıcı 2: Aynı club'a katılın
- [ ] **BEKLENEN:** Üye sayısı 2'ye çıkmalı (her iki tarafta da)

### Data Persistence

#### 5. Chat History
- [ ] Chat'te mesaj gönderin
- [ ] Sayfayı tamamen kapatın
- [ ] Yeniden açın ve chat'e girin
- [ ] **BEKLENEN:** Tüm eski mesajlar görünmeli

#### 6. Match Persistence
- [ ] Birkaç match oluşturun
- [ ] Logout yapın
- [ ] Yeniden login olun
- [ ] **BEKLENEN:** Tüm match'ler hala orada olmalı

#### 7. Profile Updates
- [ ] Profile'da bio değiştirin
- [ ] Logout/Login yapın
- [ ] **BEKLENEN:** Değişiklikler korunmuş olmalı

### Performance

#### 8. Image Compression
- [ ] Profile'da fotoğraf yükleyin (tercihen 5MB+)
- [ ] Network sekmesinde upload boyutunu kontrol edin
- [ ] **BEKLENEN:** Upload < 500KB olmalı
- [ ] **BEKLENEN:** Fotoğraf kalitesi yeterli olmalı

#### 9. Page Load Speed
- [ ] Browser DevTools > Network > Slow 3G açın
- [ ] Sayfayı yenileyin
- [ ] Performance sekmesinde LCP ölçün
- [ ] **BEKLENEN:** İlk sayfa yüklenme < 3sn (Slow 3G'de)
- [ ] Normal ağda < 2sn olmalı

#### 10. Memory Leaks
- [ ] Chrome DevTools > Memory > Heap Snapshot
- [ ] Chat'e girin (snapshot 1)
- [ ] 10 farklı kişiyle chat açın
- [ ] Chat'ten çıkın (snapshot 2)
- [ ] 5 dakika bekleyin (snapshot 3)
- [ ] **BEKLENEN:** Snapshot 2 ve 3 benzer boyutta olmalı

### Offline Mode

#### 11. Offline Message Queue
- [ ] Chat'te olun
- [ ] Network'ü kapatın (DevTools > Network > Offline)
- [ ] Mesaj göndermeye çalışın
- [ ] **BEKLENEN:** "Sending..." göstergesi görünmeli
- [ ] Network'ü açın
- [ ] **BEKLENEN:** Mesajlar otomatik gönderilmeli

#### 12. LocalStorage Fallback
- [ ] Network offline yapın
- [ ] Uygulamayı yeniden yükleyin
- [ ] Chat, Matches sayfalarını gezin
- [ ] **BEKLENEN:** Daha önce yüklenmiş veriler görünmeli
- [ ] **BEKLENEN:** "Offline" badge gösterilmeli

### UI/UX

#### 13. Loading States
- [ ] Network > Slow 3G
- [ ] Her sayfaya gidin
- [ ] **BEKLENEN:** Loading spinner/skeleton görünmeli
- [ ] **BEKLENEN:** Boş state mesajları anlamlı olmalı

#### 14. Error Handling
- [ ] Supabase URL'ini yanlış yapın
- [ ] Uygulamayı yenileyin
- [ ] **BEKLENEN:** Hata mesajları kullanıcı dostu olmalı
- [ ] **BEKLENEN:** Sayfa crash olmamalı

#### 15. Responsive Design
- [ ] Mobile viewport (375x667)
- [ ] Tablet viewport (768x1024)
- [ ] Desktop viewport (1920x1080)
- [ ] **BEKLENEN:** Tüm element ler düzgün görünmeli
- [ ] **BEKLENEN:** Touch targets en az 44x44px

---

## 🔍 Console Error Check

Browser console'da şunları kontrol edin:

```bash
# İYİ ✅
[Analytics] Swipe Like { userId: "..." }
[Cache] Hit for user:123
[RateLimit] 95 requests remaining

# KÖTÜ ❌
Uncaught TypeError: ...
Failed to fetch ...
Memory leak detected ...
```

---

## 📊 Performance Metrics

Chrome Lighthouse ile test edin:
```bash
# DevTools > Lighthouse > Analyze page load

HEDEF SKORLAR:
Performance: > 90
Accessibility: > 95
Best Practices: > 90
SEO: > 90
```

---

## ✅ Test Sonuçları

### Passed Tests
- [ ] Real-time Chat (Mesajlar anında görünüyor)
- [ ] Match Detection (Mutual like çalışıyor)
- [ ] Match List Updates (Otomatik güncelleniyor)
- [ ] Chat History (Mesajlar korunuyor)
- [ ] Profile Updates (Değişiklikler persist)
- [ ] Image Compression (< 500KB)
- [ ] Page Load Speed (< 2sn)
- [ ] No Memory Leaks
- [ ] Offline Queue (Mesajlar sıralanıyor)
- [ ] Error Handling (Graceful errors)

### Issues Found
1. **Sorun:** _____________
   **Çözüm:** _____________
   
2. **Sorun:** _____________
   **Çözüm:** _____________

---

## 🚀 Production Ready Checklist

Tüm testler geçtikten sonra:

- [ ] Environment variables production'a taşındı
- [ ] Supabase RLS policies doğrulandı
- [ ] Storage bucket permissions kontrol edildi
- [ ] API rate limits ayarlandı
- [ ] Analytics entegre edildi
- [ ] Error tracking (Sentry) eklendi
- [ ] Build warning'leri temizlendi
- [ ] Bundle size optimize edildi (< 2MB)

**Testleri tamamladıktan sonra deployment'a hazırsınız!** 🎉
