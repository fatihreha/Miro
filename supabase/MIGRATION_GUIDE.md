# Production-Ready Migration Guide

## 🎯 Amaç
Bu migration, SportPulse uygulamasını production ortamına hazırlamak için kritik güvenlik katmanlarını ekler.

## ✅ Eklenen Özellikler

### 1. **Double Booking Prevention**
- ✅ Unique constraint: Aynı trainer, aynı tarih/saatte 2 booking alamaz
- ✅ Status validation: Sadece geçerli durumlar kabul edilir
- ✅ Index'ler: Hızlı booking sorguları

### 2. **Duplicate Match Prevention**
- ✅ Order-independent unique constraint: 2 kullanıcı arası sadece 1 match
- ✅ Race condition handling: Eşzamanlı swipe'larda duplicate oluşmaz
- ✅ RPC function: `create_match_if_not_exists`

### 3. **Swipe System Validation**
- ✅ Server-side daily limit check
- ✅ Duplicate swipe prevention
- ✅ Premium user unlimited swipes
- ✅ Automatic midnight reset function

### 4. **Payout Escrow Pattern**
- ✅ `available_balance` ve `held_balance` separation
- ✅ `hold_balance_for_payout`: Ödeme onaylanana kadar para tutulur
- ✅ `release_held_balance`: Ödeme başarılı → Para gider
- ✅ `return_held_balance`: Ödeme başarısız → Para geri döner

### 5. **Message Delivery Safety**
- ✅ Type validation
- ✅ Unread message index
- ✅ Conversation query optimization

### 6. **User Status Management**
- ✅ `status` field: active, suspended, banned, deleted
- ✅ `is_banned` flag
- ✅ Active user index

### 7. **Row Level Security (RLS)**
- ✅ Bookings: Sadece kendi booking'leri görülebilir
- ✅ Matches: Sadece kendi match'leri görülebilir
- ✅ Messages: Sadece kendi mesajları görülebilir
- ✅ Payouts: Sadece kendi ödemeleri görülebilir

## 📋 Uygulama Adımları

### Option 1: Supabase Dashboard'dan (Önerilen)
1. [Supabase Dashboard](https://supabase.com/dashboard) → Projenizi seçin
2. **SQL Editor** sekmesine gidin
3. `supabase/migrations/20241206_production_ready_constraints.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın
6. Hataları kontrol edin

### Option 2: Supabase CLI ile (Local Development)
```powershell
# Supabase CLI yüklü değilse:
npm install -g supabase

# Migration'ı çalıştır:
supabase db push
```

### Option 3: Manuel Test (Staging Environment)
```powershell
# Migration dosyasını staging database'e uygula
psql postgresql://your-staging-db-url -f supabase/migrations/20241206_production_ready_constraints.sql
```

## ⚠️ Önemli Notlar

### Mevcut Veriler İçin Cleanup
Eğer database'iniz zaten veri içeriyorsa, constraint eklemeden önce temizlik yapmanız gerekebilir:

```sql
-- 1. Duplicate bookings temizle
DELETE FROM bookings a USING bookings b
WHERE a.id < b.id
  AND a.trainer_id = b.trainer_id
  AND a.scheduled_date = b.scheduled_date
  AND a.scheduled_time = b.scheduled_time;

-- 2. Duplicate matches temizle
DELETE FROM matches a USING matches b
WHERE a.id < b.id
  AND (
    (a.user1_id = b.user1_id AND a.user2_id = b.user2_id)
    OR (a.user1_id = b.user2_id AND a.user2_id = b.user1_id)
  );

-- 3. Duplicate swipes temizle
DELETE FROM swipes a USING swipes b
WHERE a.id < b.id
  AND a.swiper_id = b.swiper_id
  AND a.swiped_id = b.swiped_id;
```

### Rollback (Geri Alma)
Eğer migration sorun çıkarırsa:

```sql
-- Constraint'leri kaldır
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS unique_trainer_datetime;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS valid_booking_status;
ALTER TABLE matches DROP INDEX IF EXISTS unique_match_pair;
ALTER TABLE swipes DROP CONSTRAINT IF EXISTS unique_swipe_pair;

-- RPC fonksiyonları sil
DROP FUNCTION IF EXISTS decrement_daily_swipes(UUID);
DROP FUNCTION IF EXISTS create_match_if_not_exists(UUID, UUID);
DROP FUNCTION IF EXISTS hold_balance_for_payout(UUID, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS release_held_balance(TEXT);
DROP FUNCTION IF EXISTS return_held_balance(TEXT);
```

## 🧪 Test Senaryoları

Migration'dan sonra şu senaryoları test edin:

### 1. Double Booking Prevention
```typescript
// Aynı zamanda 2 kullanıcı aynı trainer'ı book etsin
// Sadece 1 tanesi başarılı olmalı
const result1 = await trainerService.bookSession({...});
const result2 = await trainerService.bookSession({...}); // Bu fail etmeli
```

### 2. Duplicate Match Prevention
```typescript
// 2 kullanıcı aynı anda birbirini like etsin
// Sadece 1 match oluşmalı
await Promise.all([
  matchService.swipeUser(user1, user2, 'like'),
  matchService.swipeUser(user2, user1, 'like')
]);
// Sadece 1 match record olmalı
```

### 3. Swipe Limit Validation
```typescript
// Free user 10 swipe yaptıktan sonra
for (let i = 0; i < 11; i++) {
  const result = await matchService.swipeUser(userId, targetId, 'like');
}
// 11. swipe fail etmeli
```

### 4. Payout Escrow
```typescript
// Payout request at
const payout = await payoutService.requestPayout({
  trainerId: 'xxx',
  amount: 500
});
// available_balance düşmeli, held_balance artmalı

// Payout başarısız ol
await payoutService.cancelPayout(payout.payoutId);
// held_balance düşmeli, available_balance geri dönmeli
```

## 📊 Monitoring

Migration'dan sonra izlemeniz gerekenler:

```sql
-- 1. Constraint violation'ları kontrol et
SELECT * FROM pg_stat_user_tables WHERE relname IN ('bookings', 'matches', 'swipes');

-- 2. Index kullanımını kontrol et
SELECT * FROM pg_stat_user_indexes WHERE indexrelname LIKE 'idx_%';

-- 3. RPC function performance
SELECT * FROM pg_stat_user_functions WHERE funcname IN (
  'decrement_daily_swipes',
  'create_match_if_not_exists',
  'hold_balance_for_payout'
);
```

## 🔄 Automatic Swipe Reset

Daily swipe reset için cron job kurun:

### Supabase ile (pg_cron extension)
```sql
-- pg_cron extension'ı aktif et
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Her gece 00:00'da swipe'ları sıfırla
SELECT cron.schedule(
  'reset-daily-swipes',
  '0 0 * * *',
  $$SELECT reset_daily_swipes()$$
);
```

### Alternatif: External Cron (GitHub Actions)
`.github/workflows/reset-swipes.yml` oluşturun:
```yaml
name: Reset Daily Swipes
on:
  schedule:
    - cron: '0 0 * * *' # Her gün 00:00 UTC
jobs:
  reset:
    runs-on: ubuntu-latest
    steps:
      - uses: supabase/setup-cli@v1
      - run: |
          supabase db execute --db-url ${{ secrets.SUPABASE_DB_URL }} \
            "SELECT reset_daily_swipes()"
```

## ✅ Verification Checklist

Migration başarılı olduğunu doğrulamak için:

- [ ] Constraint'ler eklendi: `SELECT * FROM information_schema.table_constraints WHERE table_name IN ('bookings', 'matches', 'swipes');`
- [ ] Index'ler oluşturuldu: `SELECT * FROM pg_indexes WHERE tablename IN ('bookings', 'matches', 'messages');`
- [ ] RPC fonksiyonları çalışıyor: `SELECT * FROM pg_proc WHERE proname LIKE '%balance%';`
- [ ] RLS policies aktif: `SELECT * FROM pg_policies;`
- [ ] Mevcut veriler etkilenmedi: `SELECT COUNT(*) FROM bookings;`
- [ ] Test senaryoları geçti

## 🚨 Sorun Giderme

### Problem: "Constraint violation" hatası
**Çözüm:** Cleanup SQL'lerini çalıştırın (yukarıda)

### Problem: RPC function bulunamıyor
**Çözüm:** 
```sql
SELECT * FROM pg_proc WHERE proname = 'decrement_daily_swipes';
-- Boşsa, function'ı tekrar oluşturun
```

### Problem: Performance düşüşü
**Çözüm:**
```sql
-- Index'leri yeniden oluştur
REINDEX TABLE bookings;
REINDEX TABLE matches;
```

## 📞 Support

Sorularınız için:
- GitHub Issues: [Proje Repository](https://github.com/fatihreha/Miro)
- Supabase Docs: [Database Best Practices](https://supabase.com/docs/guides/database)
