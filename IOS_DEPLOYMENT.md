# 📱 iOS'a Yükleme - Hızlı Başlangıç

## ⚠️ Gereksinimler

- **macOS** bilgisayar (Xcode sadece macOS'ta çalışır)
- **Apple Developer** hesabı (ücretsiz veya $99/yıl)
- **Xcode** 14.0+ (App Store'dan)
- **iPhone** (USB kablosu ile)

---

## 🚀 5 Adımda iOS'a Yükleme

### 1️⃣ iOS Platformu Ekle (Sadece İlk Kez)

```bash
cd c:\Users\Fatih\Desktop\sportpulse
npx cap add ios
```

### 2️⃣ Production Build

```bash
npm run build
npx cap sync ios
```

### 3️⃣ Xcode'da Aç

```bash
npx cap open ios
```

### 4️⃣ Signing Ayarla

Xcode'da:
1. Sol menüden **App** seç
2. **Signing & Capabilities** tab
3. **Team** → Apple Developer hesabını seç

### 5️⃣ iPhone'a Yükle

1. iPhone'u USB ile bağla
2. iPhone'da "Trust This Computer" → Güven
3. Xcode'da cihazını seç (üst menü)
4. Play butonu (▶️) bas

**iPhone'da (ilk kez):**
```
Settings → General → VPN & Device Management
→ Developer App → Trust
```

---

## 🔧 Windows'tan macOS'a Geçiş

### Seçenek 1: Mac Kullan
- Kendi Mac'in
- Arkadaştan ödünç
- Apple Store'da test et

### Seçenek 2: Cloud Mac Kirala
- [MacinCloud](https://www.macincloud.com/) - $30/ay
- [MacStadium](https://www.macstadium.com/) - $99/ay
- Uzaktan erişim (VNC/RDP)

### Seçenek 3: TestFlight (Sonra)
- İlk build için yine Mac gerek
- Sonrası OTA güncellenebilir

---

## 🐛 Sorun mu Yaşıyorsun?

**"macOS yok"** → Cloud Mac servisi kirala  
**"Signing error"** → Apple Developer hesabı ekle (Xcode Preferences)  
**"App açılmıyor"** → Settings → Trust developer  
**"Build failed"** → `cd ios/App && pod install`

---

## 📚 Detaylı Rehber

Tam adımlar için: `walkthrough.md` dosyasına bak

---

## ⏱️ Tahmini Süre

- İlk setup: ~30 dakika
- Sonraki build'ler: ~5 dakika

