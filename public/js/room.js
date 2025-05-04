document.addEventListener('DOMContentLoaded', () => {
  // Get room ID from the page
  const roomId = document.getElementById('room-id').value;
  
  // Set joining flag to false by default
  window.isJoiningRoom = false;
  
  // Get username or ask for it
  let username = document.getElementById('username-value')?.value;
  if (!username) {
    const savedUsername = localStorage.getItem('fenow2g_username');
    if (savedUsername) {
      username = savedUsername;
    } else {
      username = prompt('Lütfen kullanıcı adınızı girin:') || 'Misafir';
      localStorage.setItem('fenow2g_username', username);
    }
  }
  
  // Connect to socket.io
  const socket = io();
  
  // Generate a unique user ID
  const userId = generateUserId();
  
  // Get DOM elements
  const videoPlayer = document.getElementById('video-player');
  const videoUrlInput = document.getElementById('video-url');
  const changeVideoBtn = document.getElementById('change-video-btn');
  const chatMessages = document.getElementById('chat-messages');
  const chatInput = document.getElementById('chat-input');
  const sendMessageBtn = document.getElementById('send-message-btn');
  const usersList = document.getElementById('users-list');
  const videoSources = document.querySelectorAll('.video-source');
  
  // Connected users (will be updated via socket)
  let connectedUsers = {};
  
  // Initialize YouTube sync
  initYouTubeSync(socket, roomId, userId);
  
  // Setup video source buttons
  if (videoSources) {
    videoSources.forEach(source => {
      source.addEventListener('click', () => {
        const sourceType = source.getAttribute('data-source');
        handleVideoSourceClick(sourceType);
      });
    });
  }
  
  // Join the room
  socket.emit('join-room', roomId, userId, username);
  
  // Listen for user connected
  socket.on('user-connected', (newUserId, newUsername) => {
    console.log(`Kullanıcı bağlandı: ${newUsername} (${newUserId})`);
    addUserToList(newUserId, newUsername);
    
    // Send a chat message that a new user joined
    const message = {
      content: `${newUsername} odaya katıldı`,
      sender: 'Sistem',
      timestamp: new Date().toISOString()
    };
    
    addMessageToChat(message, 'system');
  });
  
  // Listen for user disconnected
  socket.on('user-disconnected', (disconnectedUserId, disconnectedUsername) => {
    console.log(`Kullanıcı ayrıldı: ${disconnectedUsername} (${disconnectedUserId})`);
    removeUserFromList(disconnectedUserId);
    
    // Send a chat message that a user left
    const message = {
      content: `${disconnectedUsername} odadan ayrıldı`,
      sender: 'Sistem',
      timestamp: new Date().toISOString()
    };
    
    addMessageToChat(message, 'system');
  });
  
  // Listen for current video from server (when joining an existing room)
  socket.on('current-video', (videoUrl, currentTime, videoState) => {
    if (videoUrl) {
      videoUrlInput.value = videoUrl;
      
      // Set a flag to indicate we're loading a video from a join event
      window.isJoiningRoom = true;
      console.log('Odaya katılma işlemi başladı: Video yükleniyor');
      
      // For YouTube videos
      if (isYouTubeUrl(videoUrl)) {
        // Directly use loadYouTubeVideo but don't trigger playback right away
        loadYouTubeVideo(videoUrl, currentTime, 'paused');
        
        // Only after a delay, apply the proper state to avoid double events
        setTimeout(() => {
          if (window.youtubePlayer && window.youtubeReady) {
            if (videoState === 'playing') {
              window.youtubePlayer.playVideo();
            }
          }
          console.log('Odaya katılma işlemi tamamlandı');
          // Daha uzun bir süre için isJoiningRoom bayrağını aktif tut (3->8 saniye)
          setTimeout(() => {
            window.isJoiningRoom = false;
            console.log('Video senkronizasyonu aktif edildi');
          }, 5000);
        }, 3000);
      } 
      // For other video types
      else {
        loadVideo(videoUrl, currentTime, 'paused');
        
        // Only after a delay, apply proper state
        setTimeout(() => {
          if (videoPlayer && videoPlayer.style.display !== 'none') {
            if (videoState === 'playing') {
              videoPlayer.play().catch(error => {
                console.error('Video oynatma hatası:', error);
              });
            }
          }
          console.log('Odaya katılma işlemi tamamlandı');
          // Daha uzun bir süre için isJoiningRoom bayrağını aktif tut
          setTimeout(() => {
            window.isJoiningRoom = false;
            console.log('Video senkronizasyonu aktif edildi');
          }, 5000);
        }, 3000);
      }
    }
  });
  
  // Video controls for native video player
  if (videoPlayer) {
    // Play event
    videoPlayer.addEventListener('play', () => {
      if (!window.isJoiningRoom) {
        // Son olaydan bu yana geçen süreyi kontrol et
        const now = Date.now();
        if (now - window.lastVideoEventTime < VIDEO_EVENT_COOLDOWN) {
          console.log('Çok sık video oynatma isteği: İşlem engellendi');
          return;
        }
        window.lastVideoEventTime = now;
        
        socket.emit('video-play', videoPlayer.currentTime);
      }
    });
    
    // Pause event
    videoPlayer.addEventListener('pause', () => {
      if (!window.isJoiningRoom) {
        // Son olaydan bu yana geçen süreyi kontrol et
        const now = Date.now();
        if (now - window.lastVideoEventTime < VIDEO_EVENT_COOLDOWN) {
          console.log('Çok sık video duraklatma isteği: İşlem engellendi');
          return;
        }
        window.lastVideoEventTime = now;
        
        socket.emit('video-pause', videoPlayer.currentTime);
      }
    });
    
    // Seek event
    videoPlayer.addEventListener('seeked', () => {
      if (!window.isJoiningRoom) {
        // Son olaydan bu yana geçen süreyi kontrol et
        const now = Date.now();
        if (now - window.lastVideoEventTime < VIDEO_EVENT_COOLDOWN) {
          console.log('Çok sık video ileri sarma isteği: İşlem engellendi');
          return;
        }
        window.lastVideoEventTime = now;
        
        socket.emit('video-seek', videoPlayer.currentTime);
      }
    });
    
    // Listen for play from server
    socket.on('video-play', (currentTime) => {
      // Only handle if it's a native video, YouTube is handled separately
      if (videoPlayer.style.display !== 'none' && !window.isJoiningRoom) {
        if (Math.abs(videoPlayer.currentTime - currentTime) > 0.5) {
          videoPlayer.currentTime = currentTime;
        }
        videoPlayer.play().catch(error => {
          console.error('Video oynatma hatası:', error);
        });
      }
    });
    
    // Listen for pause from server
    socket.on('video-pause', (currentTime) => {
      // Only handle if it's a native video, YouTube is handled separately
      if (videoPlayer.style.display !== 'none' && !window.isJoiningRoom) {
        if (Math.abs(videoPlayer.currentTime - currentTime) > 0.5) {
          videoPlayer.currentTime = currentTime;
        }
        videoPlayer.pause();
      }
    });
    
    // Listen for seek from server
    socket.on('video-seek', (currentTime) => {
      // Only handle if it's a native video, YouTube is handled separately
      if (videoPlayer.style.display !== 'none' && !window.isJoiningRoom) {
        videoPlayer.currentTime = currentTime;
      }
    });
    
    // Listen for video change from server
    socket.on('change-video', (videoUrl) => {
      videoUrlInput.value = videoUrl;
      loadVideo(videoUrl);
    });
    
    // Change video button
    if (changeVideoBtn) {
      changeVideoBtn.addEventListener('click', () => {
        const videoUrl = videoUrlInput.value.trim();
        if (videoUrl) {
          socket.emit('change-video', videoUrl);
          loadVideo(videoUrl, 0, 'paused');
        }
      });
    }
    
    // URL input on Enter key press
    if (videoUrlInput) {
      videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          changeVideoBtn.click();
        }
      });
    }
  }
  
  // Chat functionality
  if (chatInput && sendMessageBtn) {
    // Send message on button click
    sendMessageBtn.addEventListener('click', sendMessage);
    
    // Send message on Enter key
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
    
    // Listen for chat messages from server
    socket.on('receive-message', (message, senderId) => {
      const isOwnMessage = senderId === userId;
      addMessageToChat(message, isOwnMessage ? 'own' : '');
    });
  }
  
  // Function to handle video source click
  function handleVideoSourceClick(sourceType) {
    let promptMessage = '';
    let defaultUrl = '';
    
    switch (sourceType) {
      case 'youtube':
        promptMessage = 'YouTube video ID veya URL girin:';
        defaultUrl = 'https://www.youtube.com/watch?v=';
        break;
      case 'vimeo':
        promptMessage = 'Vimeo video ID veya URL girin:';
        defaultUrl = 'https://vimeo.com/';
        break;
      case 'dailymotion':
        promptMessage = 'Dailymotion video ID veya URL girin:';
        defaultUrl = 'https://www.dailymotion.com/video/';
        break;
      case 'twitch':
        promptMessage = 'Twitch kanal adı veya video ID girin:';
        defaultUrl = 'https://www.twitch.tv/';
        break;
      case 'direct':
        promptMessage = 'Video URL girin (mp4, webm, vb.):';
        defaultUrl = 'https://';
        break;
      case 'iframe':
        promptMessage = 'Video URL girin:';
        defaultUrl = 'https://';
        break;
      default:
        promptMessage = 'Video URL girin:';
        defaultUrl = 'https://';
    }
    
    const inputUrl = prompt(promptMessage, defaultUrl);
    if (inputUrl && inputUrl !== defaultUrl) {
      videoUrlInput.value = inputUrl;
      changeVideoBtn.click();
    }
  }
  
  // Function to send a chat message
  function sendMessage() {
    const messageContent = chatInput.value.trim();
    if (messageContent) {
      const message = {
        content: messageContent,
        sender: username, // Use username instead of browser name
        timestamp: new Date().toISOString()
      };
      
      socket.emit('send-message', message);
      addMessageToChat(message, 'own');
      chatInput.value = '';
    }
  }
  
  // Function to add a message to the chat
  function addMessageToChat(message, messageClass) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    
    if (messageClass) {
      messageElement.classList.add(messageClass);
    }
    
    const senderElement = document.createElement('div');
    senderElement.classList.add('sender');
    senderElement.textContent = message.sender;
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('content');
    contentElement.textContent = message.content;
    
    const timestampElement = document.createElement('div');
    timestampElement.classList.add('timestamp');
    timestampElement.textContent = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.appendChild(senderElement);
    messageElement.appendChild(contentElement);
    messageElement.appendChild(timestampElement);
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to the bottom of the chat
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
  
  // Function to add a user to the list
  function addUserToList(userId, username) {
    if (!connectedUsers[userId]) {
      connectedUsers[userId] = {
        id: userId,
        name: username || `Kullanıcı (${getBrowserName()})`
      };
      
      updateUsersList();
    }
  }
  
  // Function to remove a user from the list
  function removeUserFromList(userId) {
    if (connectedUsers[userId]) {
      delete connectedUsers[userId];
      updateUsersList();
    }
  }
  
  // Function to update the users list
  function updateUsersList() {
    usersList.innerHTML = '';
    
    Object.values(connectedUsers).forEach(user => {
      const listItem = document.createElement('li');
      
      const iconContainer = document.createElement('span');
      iconContainer.classList.add('browser-icon-container');
      iconContainer.innerHTML = getBrowserIcon();
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = user.name;
      
      listItem.appendChild(iconContainer);
      listItem.appendChild(nameSpan);
      
      usersList.appendChild(listItem);
    });
  }
  
  // Function to load a video by URL
  function loadVideo(url, startTime, videoState) {
    // Check if it's a YouTube URL
    if (isYouTubeUrl(url)) {
      loadYouTubeVideo(url, startTime, videoState);
      
      // Hide the native video player if it exists
      if (videoPlayer) {
        videoPlayer.style.display = 'none';
      }
      
      // Remove any existing iframes that are not YouTube
      removeNonYouTubeIframes();
    } 
    // Check if external video site (that needs embedding)
    else if (isExternalVideoSite(url)) {
      loadExternalVideo(url);
      
      // Hide the native video player and YouTube player if any
      if (videoPlayer) {
        videoPlayer.style.display = 'none';
      }
      
      // Also remove YouTube iframe if exists
      const youtubeIframe = document.getElementById('youtube-player');
      if (youtubeIframe) {
        youtubeIframe.style.display = 'none';
      }
    }
    // Direct video file
    else {
      // For direct video files, use the native video player
      if (videoPlayer) {
        // Make sure the video player is visible
        videoPlayer.style.display = '';
        videoPlayer.src = url;
        videoPlayer.load();
        
        // Set initial time if provided
        if (startTime && startTime > 0) {
          videoPlayer.currentTime = startTime;
        }
        
        // Set initial playback state if provided
        if (videoState === 'playing') {
          videoPlayer.play().catch(error => {
            console.error('Video oynatma hatası:', error);
          });
        }
        
        // Hide YouTube player if exists
        const youtubeIframe = document.getElementById('youtube-player');
        if (youtubeIframe) {
          youtubeIframe.style.display = 'none';
        }
        
        // Remove any external video iframes
        removeExternalVideoIframes();
      }
    }
  }
  
  // Function to check if URL is an external video site (not YouTube)
  function isExternalVideoSite(url) {
    return url.includes('vimeo.com') || 
           url.includes('dailymotion.com') || 
           url.includes('twitch.tv') ||
           url.includes('yabancidizi.io') ||
           url.includes('kick.com');
  }
  
  // Function to load external video
  function loadExternalVideo(url) {
    // Remove any existing external video iframes
    removeExternalVideoIframes();
    
    // Create iframe for external video
    const videoContainer = document.querySelector('.video-container');
    const iframe = document.createElement('iframe');
    iframe.id = 'external-video';
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.frameBorder = '0';
    iframe.allowFullscreen = true;
    iframe.src = url;
    
    // If the URL isn't already an iframe src, try to extract the embed URL
    if (!url.includes('embed')) {
      if (url.includes('vimeo.com')) {
        const vimeoId = url.split('/').pop();
        iframe.src = `https://player.vimeo.com/video/${vimeoId}`;
      } else if (url.includes('dailymotion.com')) {
        const dailymotionId = url.split('/').pop().split('?')[0];
        iframe.src = `https://www.dailymotion.com/embed/video/${dailymotionId}`;
      } else if (url.includes('twitch.tv')) {
        const twitchChannel = url.split('/').pop().split('?')[0];
        iframe.src = `https://player.twitch.tv/?channel=${twitchChannel}&parent=${window.location.hostname}`;
      } else {
        // For any other site, try to embed directly (this may not work for all sites)
        iframe.src = url;
      }
    }
    
    // Add the iframe to the video container
    videoContainer.appendChild(iframe);
  }
  
  // Function to remove external video iframes
  function removeExternalVideoIframes() {
    const externalIframe = document.getElementById('external-video');
    if (externalIframe) {
      externalIframe.remove();
    }
  }
  
  // Function to remove non-YouTube iframes
  function removeNonYouTubeIframes() {
    const externalIframe = document.getElementById('external-video');
    if (externalIframe) {
      externalIframe.remove();
    }
  }
  
  // Function to generate a unique user ID
  function generateUserId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  // Add server check-sync events
  socket.on('check-sync', (data) => {
    // Only respond if we're the video host (first person in the room)
    const firstUserId = Object.keys(connectedUsers)[0];
    if (userId === firstUserId) {
      let currentTime = 0;
      let state = 0;
      
      // Get current time from appropriate player
      if (videoPlayer.style.display !== 'none' && !videoPlayer.paused) {
        currentTime = videoPlayer.currentTime;
        state = 1; // playing
      } else if (window.youtubePlayer && window.youtubeReady) {
        if (typeof window.youtubePlayer.getCurrentTime === 'function') {
          currentTime = window.youtubePlayer.getCurrentTime();
          state = window.youtubePlayer.getPlayerState();
        }
      }
      
      // Send back sync response
      socket.emit('sync-response', {
        time: currentTime,
        state: state,
        userId: userId
      });
    }
  });
  
  // Add current user to the list
  addUserToList(userId, username);
  
  // Video olayları için son işlem zamanını kaydet
  window.lastVideoEventTime = 0;
  const VIDEO_EVENT_COOLDOWN = 2000; // 2 saniye bekleme süresi
}); 