# 🛡️ Security Headers - Cloudflare Setup Guide

## Hızlı Kurulum (5 dakika)

### Cloudflare Dashboard'dan

1. **Cloudflare Dashboard** → Domain seçin
2. **Rules** → **Transform Rules** → **Modify Response Header**
3. **Create Rule** tıklayın
4. Aşağıdaki başlıkları ekleyin:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;
```

### Cloudflare Pages (Otomatik)

`_headers` dosyası zaten `public/` klasöründe. Deploy ettiğinizde otomatik yüklenir.

## Güvenlik Başlıkları Açıklaması

| Header | Koruma | Açıklama |
|--------|---------|----------|
| `X-Frame-Options: DENY` | Clickjacking | Site iframe'de açılamaz |
| `X-Content-Type-Options: nosniff` | MIME Sniffing | Tarayıcı dosya tiplerini tahmin etmez |
| `Strict-Transport-Security` | Man-in-Middle | Sadece HTTPS |
| `Content-Security-Policy` | XSS | Script/stil kaynakları kısıtlı |

## Doğrulama

Deploy sonrası test için:

```bash
curl -I https://sportpulse.app
```

Veya: https://securityheaders.com sitesinde test edin

## 🎯 Beklenen Skor

- SecurityHeaders.com: **A+ Rating**
- 5/5 güvenlik başlığı ✅
