const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const useragent = require('express-useragent');
const ejsLayouts = require('express-ejs-layouts');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Oturum yönetimi
app.use(session({
  secret: 'fenow2g-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // HTTPS kullanılıyorsa true yapın
}));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(useragent.express());

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(ejsLayouts);
app.set('layout', 'layout');

// Routes
app.get('/', (req, res) => {
  const browserInfo = {
    browser: req.useragent.browser,
    version: req.useragent.version,
    os: req.useragent.os,
    platform: req.useragent.platform,
    isMobile: req.useragent.isMobile
  };
  
  res.render('index', { browserInfo });
});

app.get('/about', (req, res) => {
  const browserInfo = {
    browser: req.useragent.browser,
    version: req.useragent.version,
    os: req.useragent.os,
    platform: req.useragent.platform,
    isMobile: req.useragent.isMobile
  };
  
  res.render('about', { browserInfo });
});

app.get('/room/:id', (req, res) => {
  const roomId = req.params.id;
  const browserInfo = {
    browser: req.useragent.browser,
    version: req.useragent.version,
    os: req.useragent.os,
    platform: req.useragent.platform,
    isMobile: req.useragent.isMobile
  };
  
  res.render('room', { roomId, browserInfo, req, username: req.session.username });
});

// Create a new room and redirect
app.post('/create-room', (req, res) => {
  const roomId = generateRoomId();
  const username = req.body.username || 'Misafir';
  
  // Kullanıcı adını oturumda sakla
  req.session.username = username;
  
  res.redirect(`/room/${roomId}`);
});

// Socket.io bağlantı yönetimi
const rooms = {};

// Socket.io connection
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);
  
  socket.on('join-room', (roomId, userId, username) => {
    // Odaya katıl
    socket.join(roomId);
    
    // Kullanıcı bilgilerini sakla
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: {},
        currentVideoUrl: null,
        currentVideoTime: 0,
        videoState: 'paused',
        lastEventTime: 0 // Son olayın zamanını kaydet
      };
    }
    
    // Kullanıcıyı odaya ekle
    rooms[roomId].users[socket.id] = {
      id: userId,
      username: username,
      lastEventTime: 0 // Bu kullanıcının son olay zamanını kaydet
    };
    
    // Aktif video varsa yeni katılan kullanıcıya bildir
    if (rooms[roomId].currentVideoUrl) {
      socket.emit('current-video', rooms[roomId].currentVideoUrl, rooms[roomId].currentVideoTime, rooms[roomId].videoState);
    }
    
    // Diğer kullanıcılara bağlantı bildir
    socket.to(roomId).emit('user-connected', userId, username);
    
    socket.on('disconnect', () => {
      if (rooms[roomId] && rooms[roomId].users[socket.id]) {
        const disconnectedUser = rooms[roomId].users[socket.id];
        delete rooms[roomId].users[socket.id];
        
        // Eğer odada hiç kullanıcı kalmadıysa, odayı temizle
        if (Object.keys(rooms[roomId].users).length === 0) {
          delete rooms[roomId];
        }
        
        socket.to(roomId).emit('user-disconnected', userId, disconnectedUser.username);
      }
    });
    
    // Olay işleme yardımcı fonksiyonu - hızlı tekrarlanan olayları engeller
    function handleEvent(eventType, currentTime, minInterval = 1000) {
      const now = Date.now();
      const user = rooms[roomId]?.users[socket.id];
      
      // Kullanıcı veya oda yoksa işlem yapma
      if (!user || !rooms[roomId]) return false;
      
      // Son olaydan bu yana geçen süreyi kontrol et (hem kullanıcı hem de oda için)
      if ((now - user.lastEventTime < minInterval) || 
          (now - rooms[roomId].lastEventTime < minInterval)) {
        console.log(`Çok sık ${eventType} isteği: İşlem engellendi - ${username}`);
        return false;
      }
      
      // Olay zamanlarını güncelle
      user.lastEventTime = now;
      rooms[roomId].lastEventTime = now;
      
      return true;
    }
    
    // Video sync events
    socket.on('video-play', (currentTime) => {
      // Çok sık tekrarlanan olayları engelle
      if (!handleEvent('play', currentTime)) return;
      
      // Video durumunu kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoTime = currentTime;
        rooms[roomId].videoState = 'playing';
      }
      socket.to(roomId).emit('video-play', currentTime);
    });
    
    socket.on('video-pause', (currentTime) => {
      // Çok sık tekrarlanan olayları engelle
      if (!handleEvent('pause', currentTime)) return;
      
      // Video durumunu kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoTime = currentTime;
        rooms[roomId].videoState = 'paused';
      }
      socket.to(roomId).emit('video-pause', currentTime);
    });
    
    socket.on('video-seek', (currentTime) => {
      // Çok sık tekrarlanan olayları engelle
      if (!handleEvent('seek', currentTime)) return;
      
      // Video durumunu kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoTime = currentTime;
      }
      socket.to(roomId).emit('video-seek', currentTime);
    });
    
    socket.on('change-video', (videoUrl) => {
      // Video URL'sini odada kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoUrl = videoUrl;
        rooms[roomId].currentVideoTime = 0;
        rooms[roomId].videoState = 'paused';
      }
      
      socket.to(roomId).emit('change-video', videoUrl);
    });
    
    // Sync check events
    socket.on('check-sync', (data) => {
      // Çok sık tekrarlanan olayları engelle
      if (!handleEvent('check-sync', data.time, 5000)) return;
      
      // Senkronizasyon verilerini kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoTime = data.time;
        rooms[roomId].videoState = data.state === 1 ? 'playing' : 'paused';
      }
      socket.to(roomId).emit('check-sync', data);
    });
    
    socket.on('sync-response', (data) => {
      // Çok sık tekrarlanan olayları engelle
      if (!handleEvent('sync-response', data.time, 5000)) return;
      
      // Senkronizasyon yanıt verilerini kaydet
      if (rooms[roomId]) {
        rooms[roomId].currentVideoTime = data.time;
        rooms[roomId].videoState = data.state === 1 ? 'playing' : 'paused';
      }
      io.to(roomId).emit('sync-response', data);
    });
    
    // Chat messages
    socket.on('send-message', (message) => {
      io.to(roomId).emit('receive-message', message, userId);
    });
  });
});

// Generate random room ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8);
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor`);
}); 