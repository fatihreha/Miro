# Cloudflare Security Setup Guide

## Why Cloudflare?

- 🛡️ DDoS Protection (Layer 3, 4, 7)
- 🚀 CDN (Global content delivery)
- 🔒 WAF (Web Application Firewall)
- ⚡ Performance boost
- 💰 Free tier yeterli!

---

## Setup (15 minutes)

### 1. Cloudflare Account Oluşturma

1. https://dash.cloudflare.com/sign-up
2. Email ile kayıt olun
3. Email verify edin

### 2. Domain Ekleme

```bash
# Example domain: sportpulse.app

1. Dashboard → Add a Site
2. Enter: sportpulse.app
3. Select Plan: Free (başlangıç için yeterli)
4. Click: Continue
```

### 3. DNS Records

Cloudflare otomatik DNS kayıtlarını bulacak:

```
Type    Name    Content                     Proxy
A       @       your-server-ip              ✅ Proxied
CNAME   www     sportpulse.app              ✅ Proxied
CNAME   api     api.supabase.co             🔶 DNS Only
```

**Önemli:** Supabase endpoints "DNS Only" olmalı!

### 4. Nameservers Değiştirme

Domain registrar'ınızda (GoDaddy, Namecheap, etc.):

```
Cloudflare verdiği nameservers:
ns1.cloudflare.com
ns2.cloudflare.com

Domain settings → Nameservers → Custom
Mevcut NS kayıtlarını silin
Cloudflare NS'leri girin
Save
```

**Propagation:** 24 saat sürebilir (genellikle 1 saat)

---

## Security Settings

### 5. SSL/TLS Configuration

```
Dashboard → SSL/TLS → Overview

Mode: Full (strict) ✅

Automatic HTTPS Rewrites: ON ✅
Always Use HTTPS: ON ✅
Minimum TLS Version: TLS 1.2 ✅
```

### 6. Firewall Rules

```
Dashboard → Security → WAF → Create firewall rule

Rule 1: Block known bots
Expression: (cf.bot_management.score lt 30)
Action: Block

Rule 2: Rate limiting
Expression: (http.request.uri.path contains "/api/")
Action: Challenge
When: More than 100 requests per minute

Rule 3: Geographic blocking (optional)
Expression: (ip.geoip.country in {"CN" "RU"})
Action: Challenge
```

### 7. Rate Limiting

```
Dashboard → Security → WAF → Rate limiting rules

Rule: API Rate Limit
If: Hostname equals sportpulse.app AND
    URI Path starts with /api/
Then: Rate limit
Requests: 100 per minute
Duration: 1 minute
Action: Block
```

### 8. Bot Fight Mode

```
Dashboard → Security → Bots

Bot Fight Mode: ON ✅
(Free tier - basic bot protection)

Super Bot Fight Mode: Upgrade to Pro
(Advanced ML-based detection)
```

### 9. Security Level

```
Dashboard → Security → Settings

Security Level: High ✅
Challenge Passage: 30 minutes ✅
Browser Integrity Check: ON ✅
```

---

## Performance Optimization

### 10. Caching Rules

```
Dashboard → Caching → Configuration

Browser Cache TTL: 4 hours
Crawlers Cache TTL: 4 hours

Cache Level: Standard ✅
```

### 11. Auto Minify

```
Dashboard → Speed → Optimization

Auto Minify:
✅ JavaScript
✅ CSS  
✅ HTML

Brotli: ON ✅
Early Hints: ON ✅
```

---

## Monitoring

### 12. Analytics

```
Dashboard → Analytics → Traffic

Monitor:
- Requests per day
- Bandwidth usage
- Threats blocked
- Cache hit rate (aim 80%+)
```

### 13. Security Events

```
Dashboard → Security → Events

Review blocked requests daily
Adjust firewall rules if needed
```

---

## Testing

### Verify DDoS Protection

```bash
# Test rate limiting (will be blocked)
for i in {1..200}; do
  curl https://sportpulse.app/api/test
done

# Expected: 429 Too Many Requests after ~100 requests
```

### Verify SSL

```bash
# Check SSL grade
https://www.ssllabs.com/ssltest/analyze.html?d=sportpulse.app

# Target: A+ rating
```

### Verify Caching

```bash
# Check cache status
curl -I https://sportpulse.app

# Look for header:
CF-Cache-Status: HIT (good)
CF-Cache-Status: MISS (first request)
```

---

## Security Headers

### 14. Transform Rules (Additional Security)

```
Dashboard → Rules → Transform Rules → Modify Response Header

Add Headers:
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=()
```

---

## Costs

| Plan | Price/Month | Features |
|------|-------------|----------|
| Free | $0 | Basic DDoS, CDN, SSL |
| Pro | $20 | Advanced DDoS, WAF, Image optimization |
| Business | $200 | Full WAF, Guaranteed uptime |

**Recommendation:** Start Free, upgrade to Pro at 10K users

---

## Troubleshooting

### Issue: "Too Many Redirects"

```
Fix: SSL/TLS → Overview → Mode: Full (strict)
```

### Issue: "API Calls Blocked"

```
Fix: Firewall rules → Bypass rule for /api/* with valid token
```

### Issue: "Slow API Responses"

```
Fix: Ensure Supabase DNS is "DNS Only" not "Proxied"
```

---

## ✅ Setup Complete!

1. Domain added to Cloudflare ✅
2. Nameservers changed ✅
3. SSL enabled ✅
4. Firewall rules configured ✅
5. Rate limiting active ✅
6. Bot protection ON ✅
7. Security headers added ✅

**Next:** Test dengan real traffic, monitor 1 hafta

**Security Status:** 🛡️ **HARDENED**
