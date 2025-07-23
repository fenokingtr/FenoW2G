# 🎬 FenoW2G - Birlikte İzle

FenoW2G, kullanıcıların gerçek zamanlı olarak birlikte video izlemesine olanak tanıyan w2g.tv'den esinlenilmiş bir web uygulamasıdır. Platform, şık bir siyah-kırmızı tema ve tarayıcı algılama özelliği ile kullanıcı deneyimini optimize eder.

## ✨ Özellikler

- 🔄 **Video Senkronizasyonu**: Oynatma, duraklatma ve ileri sarma işlemleri gerçek zamanlı olarak senkronize edilir
- 💬 **Sohbet Sistemi**: Video izlerken diğer izleyicilerle sohbet edebilirsiniz
- 🌐 **Tarayıcı Algılama**: Uygulama tarayıcınızı tanımlar ve bu bilgiyi görüntüler
- 📺 **YouTube Desteği**: YouTube videolarını birlikte izleyin veya doğrudan video bağlantıları kullanın
- 📱 **Mobil Uyumlu**: Hem masaüstü hem de mobil cihazlarda çalışır
- 🎥 **Çoklu Platform Desteği**: YouTube, Vimeo, Dailymotion ve diğer platformların videoları desteklenir

## 🔧 Teknolojik Altyapı

- 🖥️ **Backend**: Node.js, Express
- ⚡ **Gerçek Zamanlı İletişim**: Socket.IO
- 🧩 **Şablonlama**: EJS
- 🎨 **Frontend**: Vanilla JavaScript, CSS3
- 🔍 **Tarayıcı Algılama**: express-useragent

## 🚀 Kurulum

1. Depoyu klonlayın:
```
git clone https://github.com/fenokingtr/FenoW2G.git
cd FenoW2G
```

2. Bağımlılıkları yükleyin:
```
npm install
```

3. Sunucuyu başlatın:
```
npm start
```

4. Geliştirme için (otomatik yeniden başlatma ile):
```
npm run dev
```

5. Tarayıcınızda açın:
```
http://localhost:3000
```

## 🎮 Nasıl Çalışır

1. 🏠 Ana sayfadan bir oda oluşturun
2. 🔗 Benzersiz oda URL'sini arkadaşlarınızla paylaşın
3. 📋 YouTube URL'si veya doğrudan video bağlantısı yapıştırın
4. 🎥 Gerçek zamanlı olarak senkronize şekilde birlikte izleyin
5. 💬 Entegre sohbet sistemi ile izleyicilerle sohbet edin

## 🔄 Video Senkronizasyon Teknolojisi

FenoW2G, odaya katılan tüm kullanıcılar arasında video oynatmayı senkronize etmek için gelişmiş bir mekanizma kullanır:

### 🛠️ Nasıl Çalışır?

1. **🖥️ Sunucu-Taraflı Durum Yönetimi**:
   - Sunucu her oda için mevcut videoyu, zaman damgasını ve oynatma durumunu saklar.
   - Yeni kullanıcılar katıldığında, sunucu mevcut video durumunu gönderir.

2. **📱 Client-Taraflı Senkronizasyon**:
   - Bir kullanıcı videoyu oynatır/duraklatır/ileri sarar: Bu eylem socket.io aracılığıyla diğer kullanıcılara gönderilir.
   - Tüm kullanıcılar bu değişikliği kendi oynatıcılarına uygular.
   - Periyodik kontroller, oynatma sürelerinin uyumunu sağlar.

3. **🔄 Farklı Hız ve Gecikme Sorunlarının Önlenmesi**:
   - `isJoiningRoom` bayrağı, yeni kullanıcılar katılırken sonsuz döngüleri önler.
   - Senkronizasyon girişimleri sayılarak ve sınırlanarak, yavaş bağlantılar için koruma sağlanır.
   - Zaman farkları belirli bir eşiği geçtiğinde senkronizasyon yapılır.

### 🐛 Sorun Giderme

#### 🔁 Video Baştan Başlıyor veya Döngüye Giriyor
Bu durum, sunucu ve istemciler arasındaki çift yönlü senkronizasyon sorunlarından kaynaklanabilir. Kod içinde `window.isJoiningRoom` bayrağı ve senkronizasyon limitleri bu sorunu çözmek için eklenmiştir.

```javascript
// server.js içinde:
// Oda bilgisi videoUrl, currentVideoTime ve videoState içerir
// rooms[roomId].currentVideoTime = currentTime;

// room.js içinde:
// Yeni kullanıcı katıldığında videoyu doğru konumdan başlatma
window.isJoiningRoom = true;
loadYouTubeVideo(videoUrl, currentTime, 'paused');
setTimeout(() => { window.isJoiningRoom = false; }, 3000);
```

#### ⏱️ Gecikme Farkları
Farklı kullanıcıların internet hızları değişiklik gösterebilir:

```javascript
// youtube-sync.js içinde:
// Sadece belirli bir zaman farkı varsa senkronize et
if (Math.abs(currentPlayerTime - currentTime) > 1) {
  youtubePlayer.seekTo(currentTime, true);
}
```

## 📂 Dosya Yapısı ve Düzenleme Kılavuzu

### 📁 Temel Dosyalar

- 🖥️ `server.js`: Ana sunucu dosyası. Express ve Socket.IO yapılandırmalarını içerir.
  - **🔌 Port Değiştirme**: 174. satırdaki `const PORT = process.env.PORT || 3000;` değerini değiştirin.
  - **🏠 Oda Yönetimi**: 70-175 satırlar arasında oda ve socket işlemleri yapılandırılmıştır.

- 📦 `package.json`: Proje bağımlılıkları ve komut dosyaları.

- 📁 `public/`: Statik dosyaları içerir (CSS, JavaScript, görseller).
  - 🎨 `public/css/style.css`: Sitenin ana stil dosyası. Siyah-kırmızı temayı burada düzenleyebilirsiniz.
    - **🌈 Tema Renkleri**: 1-10 satırlar arasındaki `:root` değişkenlerini değiştirin.
    - **📱 Mobil Uyumluluk**: 330-380 satırlar arasındaki media sorguları ile mobil görünüm düzenlenebilir.

  - 📜 `public/js/main.js`: Ana JavaScript dosyası. Tarayıcı algılama işlevlerini içerir.

  - 📜 `public/js/room.js`: Oda işlevselliği için JavaScript dosyası (video senkronizasyonu, sohbet).
    - **🎬 Video Yükleme**: 316-366 satırlar arasındaki `loadVideo()` fonksiyonu.
    - **🔄 Senkronizasyon**: 75-135 satırlar arasındaki video olayları.
    - **👥 Kullanıcı Yönetimi**: 275-295 satırlar arasındaki kullanıcı ekleme ve silme.

  - 📜 `public/js/youtube-sync.js`: YouTube API entegrasyonu ve senkronizasyon.
    - **🎥 YouTube API**: 10-25 satırlar arasında YouTube API yükleme.
    - **▶️ Oynatıcı Oluşturma**: 29-80 satırlar arasında oynatıcı oluşturma.
    - **🔄 Senkronizasyon**: 170-210 satırlar arasında socket olayları.

- 📁 `views/`: EJS şablon dosyalarını içerir.
  - 🧩 `views/layout.ejs`: Ana şablon dosyası.
  - 🏠 `views/index.ejs`: Ana sayfa şablonu.
  - 🎥 `views/room.ejs`: Oda sayfası şablonu.
  - ℹ️ `views/about.ejs`: Hakkında sayfası şablonu.

### 🛠️ Sık Yapılan Değişiklikler

#### 🔌 Port Değiştirme

Sunucunun çalıştığı portu değiştirmek için aşağıdaki yöntemlerden birini kullanabilirsiniz:

1. `server.js` dosyasında bulunan PORT sabitini değiştirin:
```javascript
// Şu satırı bulun (174. satır civarında)
const PORT = process.env.PORT || 3000;
// İstediğiniz porta değiştirin, örneğin:
const PORT = process.env.PORT || 8080;
```

2. Ortam değişkeni kullanarak:
```bash
# Windows'ta CMD:
set PORT=8080 && npm start

# Windows'ta PowerShell:
$env:PORT=8080; npm start

# Linux/Mac:
PORT=8080 npm start
```

#### 🎨 Tema Renklerini Değiştirme

Siyah-kırmızı temayı değiştirmek için `public/css/style.css` dosyasında şu kısmı bulun ve renkleri değiştirin:

```css
:root {
  --primary-bg: #121212;     /* Ana arka plan rengi */
  --secondary-bg: #1e1e1e;   /* İkincil arka plan rengi */
  --accent-color: #ff0000;   /* Vurgu rengi (kırmızı) */
  --accent-hover: #cc0000;   /* Vurgu rengi hover durumu */
  --text-color: #f5f5f5;     /* Ana metin rengi */
  --secondary-text: #bdbdbd; /* İkincil metin rengi */
  --border-color: #333333;   /* Kenarlık rengi */
}
```

#### ⚙️ Video Senkronizasyon Ayarları

Video senkronizasyon hassasiyetini ayarlamak için:

1. Zaman eşiğini değiştirme (`public/js/youtube-sync.js` içinde):
```javascript
// YouTube videoları için (184. satır civarında)
if (Math.abs(currentPlayerTime - currentTime) > 1) {
  youtubePlayer.seekTo(currentTime, true);
}

// public/js/room.js içinde standart videolar için:
if (Math.abs(videoPlayer.currentTime - currentTime) > 0.5) {
  videoPlayer.currentTime = currentTime;
}
```

2. Senkronizasyon kontrolünün sıklığını değiştirme:
```javascript
// public/js/youtube-sync.js içinde (87. satır civarında)
syncInterval = setInterval(checkSync, 5000); // 5000 ms (5 saniye)
```

#### 📱 Mobil Görünümü İyileştirme

Mobil görünümü özelleştirmek için `public/css/style.css` dosyasında media sorguları bölümünü düzenleyin:

```css
@media (max-width: 767px) {
  .video-container {
    min-height: 200px;
    aspect-ratio: 16 / 9;
    height: auto;
    max-height: 50vh;
  }
  
  /* Diğer mobil stilleri... */
}
```

### 🔧 Yeni Özellik Ekleme

#### 🎬 Yeni Video Platformu Desteği

Yeni bir video platformu eklemek için:

1. `public/js/room.js` dosyasında `isExternalVideoSite()` fonksiyonunu güncelleyin:
```javascript
function isExternalVideoSite(url) {
  return url.includes('vimeo.com') || 
         url.includes('dailymotion.com') || 
         url.includes('twitch.tv') ||
         url.includes('yabancidizi.io') ||
         url.includes('yeni-platform.com'); // Yeni platform ekleyin
}
```

2. `loadExternalVideo()` fonksiyonuna yeni platform için embed kodu ekleyin:
```javascript
function loadExternalVideo(url) {
  // ...mevcut kod...
  
  if (!url.includes('embed')) {
    // ...mevcut kod...
    } else if (url.includes('yeni-platform.com')) {
      const platformId = url.split('/').pop();
      iframe.src = `https://yeni-platform.com/embed/${platformId}`;
    } else {
      // ...mevcut kod...
    }
  }
}
```

#### 👥 Kullanıcı Yönetimini Genişletme

Kullanıcı yönetimini geliştirmek için:

1. `server.js` dosyasında oda kullanıcıları yapısını güncelleyin:
```javascript
if (!rooms[roomId]) {
  rooms[roomId] = {
    users: {},
    currentVideoUrl: null,
    currentVideoTime: 0,
    videoState: 'paused',
    // Yeni özellikler ekleyin:
    roomOwner: userId,
    settings: {
      allowGuestControl: true,
      // Diğer ayarlar...
    }
  };
}
```

## 🚀 Gelecek Güncellemeler

FenoW2G için planladığımız gelecek özellikler ve iyileştirmeler:

### 🔜 Yakında Gelecek Özellikler

- 🎭 **Kullanıcı Profil Resimleri**: Kullanıcıların özelleştirilmiş profil resimleri ekleyebilmesi
- 🔐 **Şifreli Odalar**: Özel izleme deneyimi için şifre korumalı odalar
- 🔊 **Sesli Sohbet Entegrasyonu**: Video izlerken sesli sohbet imkanı
- 📊 **İzleme İstatistikleri**: Odalarda kaç kişinin ne kadar süre izlediğini gösteren istatistikler
- 🌙 **Karanlık/Aydınlık Tema Seçeneği**: Farklı renk temaları arasında geçiş yapabilme

### 🛠️ Teknik İyileştirmeler

- ⚡ **Performans Optimizasyonu**: Daha hızlı yükleme süreleri ve daha az kaynak kullanımı
- 🔒 **Güvenlik Güncellemeleri**: Gelişmiş kimlik doğrulama ve yetkilendirme
- 📱 **Mobil Uygulama**: Native mobil uygulama geliştirme (iOS ve Android)
- 🧪 **Otomatik Testler**: Kapsamlı birim ve entegrasyon testleri

### 🌍 Genişletme Planları

- 🌐 **Çoklu Dil Desteği**: Türkçe, İngilizce, Almanca, Arapça ve diğer diller
- 📼 **Daha Fazla Platform Desteği**: Netflix, Disney+, Amazon Prime Video embed desteği
- 🎞️ **Playlist Özelliği**: Sırayla otomatik oynatılacak video listeleri oluşturabilme
- 📺 **Ekran Paylaşımı**: Tarayıcı sekmesi veya ekran paylaşımı ile yerel içerikleri izleyebilme

## ❓ Sorun Giderme

### 🚫 Sunucu Başlatma Sorunları

**🔴 EADDRINUSE Hatası**  
Port zaten kullanılıyorsa:
```bash
Error: listen EADDRINUSE: address already in use :::3000
```

Çözüm:
1. `server.js` dosyasında farklı bir port kullanın.
2. Mevcut portu kullanan işlemleri sonlandırın:
   ```bash
   # Windows'ta
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/Mac'te
   lsof -i :3000
   kill -9 <PID>
   ```

### 🔄 Senkronizasyon Sorunları

**🔁 Video Başa Dönüyor veya Sürekli Sarıyor**  
Senkronizasyon döngüsü meydana geliyorsa:

Çözüm:
1. Senkronizasyon eşiklerini düzenleyin (daha yüksek değerler kullanın).
2. Kullanıcıya odaya katıldığını daha uzun süre belirten `isJoiningRoom` süresini uzatın.
```javascript
// public/js/room.js içinde:
setTimeout(() => { window.isJoiningRoom = false; }, 5000); // 3000 ms yerine 5000 ms
```

**❌ Bazı Kullanıcılarda Video Çalışmıyor**  
Özellikle mobil cihazlarda autoplay kısıtlamaları olabilir:

Çözüm:
1. Kullanıcıya "Oynat" butonu ekleyin.
2. Autoplay sorunları için bir uyarı gösterin.

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.

## 👥 Katkıda Bulunanlar

- 🎬 w2g.tv benzer bir konsept üzerine oluşturulmuştur
- 🎨 Siyah-kırmızı tema özelliği
- 🌐 Tarayıcı algılama işlevselliği içerir 
