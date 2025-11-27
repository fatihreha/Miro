# Supabase Backup & Recovery Guide

## Automated Backups Setup (5 minutes)

### 1. Enable Daily Backups

1. **Supabase Dashboard'a gidin:**
   - https://supabase.com/dashboard/project/YOUR_PROJECT_ID
   - Settings → Database → Backups

2. **Automated Backups ayarları:**
   ```
   ✅ Enable automated backups: ON
   📅 Frequency: Daily (otomatik)
   🕐 Time: 02:00 UTC (gece 05:00 TR saati)
   💾 Retention: 7 days (Free tier) / 30 days (Pro tier - önerilen)
   ```

3. **Point-in-Time Recovery (PITR):**
   - Pro plan gerektirir ($25/month)
   - Son 7 güne kadar herhangi bir zamana dönebilirsiniz
   - **ÖNERİLİR** production için

---

## Manual Backup (Haftalık Yapın)

### PostgreSQL Dump

```bash
# Supabase CLI ile backup alma
npx supabase db dump -f backup.sql

# Veya pg_dump ile
pg_dump -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  -f backup_$(date +%Y%m%d).sql
```

**Backup location:**
```
backups/
  ├── daily/
  │   ├── backup_20250127.sql
  │   ├── backup_20250126.sql
  │   └── backup_20250125.sql
  └── weekly/
      ├── backup_week_04.sql
      └── backup_week_03.sql
```

---

## Recovery Procedures

### Scenario 1: Data Corruption (Partial)

**Belirli tablolarda hata:**

```sql
-- 1. Sadece etkilenen tabloyu restore et
BEGIN;

-- Mevcut veriyi yedek tabloya kopyala
CREATE TABLE users_corrupted AS SELECT * FROM users;

-- Backup'tan restore
\i backup_20250127.sql

-- Sadece users tablosunu geri yükle
TRUNCATE users CASCADE;
-- Backup dosyasında users INSERT'lerini çalıştır

COMMIT;
```

### Scenario 2: Complete Database Loss

**Tam restore:**

```bash
# 1. Yeni Supabase project oluştur (veya mevcut)

# 2. Schema'yı restore et
psql -h db.your-project.supabase.co \
  -U postgres \
  -d postgres \
  -f backup_20250127.sql

# 3. RLS policies verify
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

# 4. Functions verify
SELECT proname 
FROM pg_proc 
WHERE pronamespace = 'public'::regnamespace;

# 5. Indexes verify
SELECT indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Scenario 3: Point-in-Time Recovery (PITR)

**Pro plan ile:**

```bash
# 1. Supabase Dashboard → Database → Backups
# 2. Select date & time
# 3. Click "Restore"
# 4. Wait for completion (5-30 min)
# 5. Verify data integrity
```

---

## Backup Best Practices

### Retention Policy

| Frequency | Retention | Purpose |
|-----------|-----------|---------|
| Hourly | 24 hours | Quick recovery |
| Daily | 7 days | Recent changes |
| Weekly | 4 weeks | Long-term |
| Monthly | 12 months | Compliance |

### Storage

```bash
# Local backups
backups/
  ├── schema.sql (structure only)
  ├── data.sql (data only)
  └── full_$(date).sql (everything)

# Cloud backup (Amazon S3)
aws s3 cp backup.sql s3://sportpulse-backups/$(date +%Y%m%d)/

# Google Cloud Storage
gsutil cp backup.sql gs://sportpulse-backups/$(date +%Y%m%d)/
```

---

## Recovery Time Objectives (RTO/RPO)

### Definitions
- **RTO** (Recovery Time Objective): Maksimum downtime
- **RPO** (Recovery Point Objective): Maksimum data loss

### Our Targets

| Scenario | RTO | RPO | Method |
|----------|-----|-----|--------|
| Single table corruption | 1 hour | 24 hours | Manual restore |
| Database corruption | 4 hours | 24 hours | Full restore |
| Complete data loss | 8 hours | 1 hour | PITR (Pro) |
| Disaster recovery | 24 hours | 24 hours | Cloud backup |

---

## Testing Backups (Monthly)

### Test Restore Procedure

```bash
# 1. Create test project
# 2. Restore latest backup
# 3. Verify data:

# Check row counts
SELECT 
  schemaname, 
  tablename, 
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

# Sample data check
SELECT * FROM users LIMIT 10;
SELECT * FROM matches LIMIT 10;
SELECT * FROM messages LIMIT 10;

# 4. Test critical queries
SELECT COUNT(*) FROM users WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM matches WHERE created_at > NOW() - INTERVAL '7 days';

# 5. Document results
```

---

## Backup Monitoring

### Automated Alerts

```typescript
// Supabase Edge Function: check-backups
export default async (req: Request) => {
  const { data: backups } = await supabase
    .from('pg_stat_backup')
    .select('*')
    .order('backup_start', { ascending: false })
    .limit(1);

  const lastBackup = backups[0];
  const hoursSinceBackup = 
    (Date.now() - new Date(lastBackup.backup_start).getTime()) / 1000 / 60 / 60;

  if (hoursSinceBackup > 48) {
    // Send alert
    await sendSlackAlert('⚠️ Backup overdue! Last backup: ' + lastBackup.backup_start);
  }

  return new Response('OK');
};
```

### Dashboard Checks

Weekly verification:
- ✅ Last backup date
- ✅ Backup size (should be growing)
- ✅ Backup status (success/failed)
- ✅ Storage space available

---

## Emergency Contacts

```
Database Admin: [your-email@company.com]
Supabase Support: https://supabase.com/support
Emergency hotline: [phone number]
```

---

## Disaster Recovery Checklist

- [ ] Identify incident type
- [ ] Notify team lead
- [ ] Stop all write operations
- [ ] Assess data loss scope
- [ ] Select recovery method
- [ ] Create recovery plan
- [ ] Execute restore
- [ ] Verify data integrity
- [ ] Resume operations
- [ ] Post-mortem analysis
- [ ] Update recovery procedures

---

## ✅ Setup Complete

1. Enable Supabase automated backups ✅
2. Set up weekly manual backups
3. Configure cloud backup storage
4. Test restore procedure monthly
5. Monitor backup health

**Next:** Phase 4 - Security Hardening
