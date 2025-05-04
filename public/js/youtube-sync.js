// YouTube API entegrasyonu ve senkronizasyon fonksiyonları
let youtubePlayer = null;
let youtubeReady = false;
let youtubeCurrentVideo = null;
let youtubeStartTime = 0;
let syncStatusElement = null;
let syncInterval = null;
let socket = null;
let roomId = null;
let userId = null;
let pendingVideoState = null;

// YouTube API'yi Yükle
function loadYouTubeAPI() {
  if (!window.YT && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

// YouTube API hazır olduğunda çağrılır
function onYouTubeIframeAPIReady() {
  youtubeReady = true;
  console.log('YouTube API hazır');
  
  // Eğer bekleyen bir video varsa yükle
  if (youtubeCurrentVideo) {
    createYouTubePlayer(youtubeCurrentVideo, youtubeStartTime);
    
    // If there's a pending video state, apply it after a short delay
    if (pendingVideoState === 'playing') {
      setTimeout(() => {
        if (youtubePlayer) {
          youtubePlayer.playVideo();
        }
      }, 1000);
    }
  }
}

// YouTube oynatıcısını oluştur
function createYouTubePlayer(videoId, startTime) {
  // Eğer API hazır değilse, video ID'sini sakla ve sonra tekrar dene
  if (!youtubeReady) {
    youtubeCurrentVideo = videoId;
    youtubeStartTime = startTime || 0;
    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
    }
    return;
  }
  
  // Eğer zaten bir oynatıcı varsa, sadece videoyu değiştir
  if (youtubePlayer) {
    try {
      if (startTime > 0) {
        console.log('Seeking to:', startTime);
        youtubePlayer.loadVideoById({
          videoId: videoId,
          startSeconds: startTime
        });
      } else {
        youtubePlayer.loadVideoById(videoId);
      }
      updateSyncStatus("active");
    } catch (error) {
      console.error('YouTube player error:', error);
    }
    return;
  }
  
  // YouTube oynatıcı div'i oluştur
  const videoContainer = document.querySelector('.video-container');
  const oldPlayer = document.getElementById('video-player');
  
  if (oldPlayer) {
    oldPlayer.style.display = 'none';
  }
  
  // Check if YouTube container already exists
  let youtubeContainer = document.getElementById('youtube-player');
  if (!youtubeContainer) {
    youtubeContainer = document.createElement('div');
    youtubeContainer.id = 'youtube-player';
    videoContainer.appendChild(youtubeContainer);
  }
  
  // Prevent looping by disabling related videos and setting loop to 0
  const playerVars = {
    'autoplay': 0,
    'controls': 1,
    'rel': 0,
    'fs': 1,
    'modestbranding': 1,
    'loop': 0,
    'playlist': videoId
  };
  
  // Only set start time if it's greater than 0
  if (startTime > 0) {
    playerVars.start = Math.floor(startTime);
  }
  
  // YouTube oynatıcıyı oluştur
  youtubePlayer = new YT.Player('youtube-player', {
    videoId: videoId,
    playerVars: playerVars,
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange,
      'onError': onPlayerError
    }
  });
}

// Oynatıcı hazır olduğunda çağrılır
function onPlayerReady(event) {
  console.log('YouTube oynatıcı hazır');
  updateSyncStatus("active");
  
  // Senkronizasyon kontrolünü daha seyrek yap (5 saniyeden 15 saniyeye çıkar)
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = setInterval(checkSync, 15000);
  
  // Son senkronizasyon zamanını kaydet
  window.lastSyncTime = Date.now();
}

// Oynatıcı durumu değiştiğinde çağrılır
function onPlayerStateChange(event) {
  if (!socket || window.isJoiningRoom) return;
  
  // Son olaydan bu yana geçen süreyi kontrol et
  const now = Date.now();
  if (window.lastVideoEventTime && (now - window.lastVideoEventTime < 2000)) {
    console.log('Çok sık YouTube oynatıcı durumu değişikliği: İşlem engellendi');
    return;
  }
  window.lastVideoEventTime = now;
  
  // YT.PlayerState değerleri:
  // -1 (başlatılmadı), 0 (bitti), 1 (oynatılıyor), 2 (duraklatıldı), 3 (arabelleğe alınıyor), 5 (video ipuçları)
  
  switch (event.data) {
    case YT.PlayerState.PLAYING:
      socket.emit('video-play', youtubePlayer.getCurrentTime());
      updateSyncStatus("active");
      break;
    case YT.PlayerState.PAUSED:
      socket.emit('video-pause', youtubePlayer.getCurrentTime());
      updateSyncStatus("active");
      break;
  }
}

// Oynatıcı hatası oluştuğunda çağrılır
function onPlayerError(event) {
  console.error('YouTube oynatıcı hatası:', event.data);
  updateSyncStatus("error");
}

// YouTube videosu yükle
function loadYouTubeVideo(url, startTime, videoState) {
  const videoId = extractYouTubeVideoId(url);
  
  if (!videoId) {
    console.error('Geçersiz YouTube URL\'si');
    return false;
  }
  
  // If API is not ready yet, store the state for later
  if (!youtubeReady) {
    youtubeCurrentVideo = videoId;
    youtubeStartTime = startTime || 0;
    pendingVideoState = videoState;
    return true;
  }
  
  createYouTubePlayer(videoId, startTime || 0);
  
  // Apply the video state if provided
  if (videoState === 'playing' && youtubePlayer) {
    setTimeout(() => {
      youtubePlayer.playVideo();
    }, 1000);
  }
  
  return true;
}

// YouTube video ID'sini URL'den ayıkla
function extractYouTubeVideoId(url) {
  let videoId = null;
  
  // youtu.be/abc123 formatı
  if (url.includes('youtu.be/')) {
    const urlParts = url.split('youtu.be/');
    if (urlParts.length > 1) {
      videoId = urlParts[1].split('?')[0];
    }
  } 
  // youtube.com/watch?v=abc123 formatı
  else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1]);
    videoId = urlParams.get('v');
  }
  // youtube.com/embed/abc123 formatı
  else if (url.includes('youtube.com/embed/')) {
    const urlParts = url.split('youtube.com/embed/');
    if (urlParts.length > 1) {
      videoId = urlParts[1].split('?')[0];
    }
  }
  
  return videoId;
}

// URL'nin YouTube URL'si olup olmadığını kontrol et
function isYouTubeUrl(url) {
  return url.includes('youtu.be/') || 
         url.includes('youtube.com/watch') || 
         url.includes('youtube.com/embed/');
}

// Senkronizasyon kontrolü
function checkSync() {
  if (!youtubePlayer || !socket || window.isJoiningRoom) return;
  
  // Son senkronizasyondan bu yana en az 10 saniye geçmiş olmalı
  const now = Date.now();
  if (window.lastSyncTime && (now - window.lastSyncTime < 10000)) {
    console.log('Çok sık senkronizasyon istekleri engellendi');
    return;
  }
  
  const playerState = youtubePlayer.getPlayerState();
  // Sadece oynatma durumunda senkronizasyonu kontrol et
  if (playerState === YT.PlayerState.PLAYING) {
    // Increment the sync attempt counter if it exists, or initialize it
    window.syncAttempts = window.syncAttempts || 0;
    window.syncAttempts++;
    
    // Limit sync attempts to prevent looping (reset after 5 attempts)
    if (window.syncAttempts > 5) {
      window.syncAttempts = 0;
      return;
    }
    
    updateSyncStatus("syncing");
    
    // Son senkronizasyon zamanını güncelle
    window.lastSyncTime = now;
    
    socket.emit('check-sync', {
      time: youtubePlayer.getCurrentTime(),
      state: playerState
    });
    
    // Reset sync counter after successful check
    setTimeout(() => {
      window.syncAttempts = 0;
    }, 10000);
  }
}

// Senkronizasyon durumunu güncelle
function updateSyncStatus(status) {
  if (!syncStatusElement) {
    syncStatusElement = document.querySelector('.status-indicator');
  }
  
  if (syncStatusElement) {
    syncStatusElement.className = 'status-indicator ' + status;
    
    switch (status) {
      case "active":
        syncStatusElement.textContent = "Aktif";
        break;
      case "syncing":
        syncStatusElement.textContent = "Senkronize Ediliyor";
        break;
      case "error":
        syncStatusElement.textContent = "Hata";
        break;
    }
  }
}

// Socket.io ve YouTube oynatıcısını bağla
function initYouTubeSync(socketInstance, roomIdValue, userIdValue) {
  socket = socketInstance;
  roomId = roomIdValue;
  userId = userIdValue;
  
  loadYouTubeAPI();
  
  if (!window.onYouTubeIframeAPIReady) {
    window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
  }
  
  // Socket.io olaylarını dinle
  socket.on('video-play', (currentTime) => {
    if (youtubePlayer && youtubeReady && !window.isJoiningRoom) {
      const currentPlayerTime = youtubePlayer.getCurrentTime();
      // 1 saniyeden fazla fark varsa zaman ayarla
      if (Math.abs(currentPlayerTime - currentTime) > 1) {
        youtubePlayer.seekTo(currentTime, true);
      }
      youtubePlayer.playVideo();
    }
  });
  
  socket.on('video-pause', (currentTime) => {
    if (youtubePlayer && youtubeReady && !window.isJoiningRoom) {
      const currentPlayerTime = youtubePlayer.getCurrentTime();
      // 1 saniyeden fazla fark varsa zaman ayarla
      if (Math.abs(currentPlayerTime - currentTime) > 1) {
        youtubePlayer.seekTo(currentTime, true);
      }
      youtubePlayer.pauseVideo();
    }
  });
  
  socket.on('video-seek', (currentTime) => {
    if (youtubePlayer && youtubeReady && !window.isJoiningRoom) {
      youtubePlayer.seekTo(currentTime, true);
    }
  });
  
  socket.on('sync-response', (data) => {
    if (youtubePlayer && youtubeReady && data.userId !== userId && !window.isJoiningRoom) {
      const currentPlayerTime = youtubePlayer.getCurrentTime();
      // Daha yüksek bir eşik değeri kullan (2 saniyeden 5 saniyeye çıkar)
      if (Math.abs(currentPlayerTime - data.time) > 5) {
        console.log(`Senkronizasyon: ${currentPlayerTime} -> ${data.time}`);
        youtubePlayer.seekTo(data.time, true);
      }
      
      updateSyncStatus("active");
    }
  });
} 