document.addEventListener('DOMContentLoaded', () => {
  // Browser detection
  const browserInfo = {
    name: getBrowserName(),
    icon: getBrowserIcon()
  };
  
  // Display browser icon if available
  const browserIconElements = document.querySelectorAll('.browser-icon-container');
  if (browserIconElements.length > 0) {
    browserIconElements.forEach(container => {
      container.innerHTML = browserInfo.icon;
    });
  }

  // Check if we're on the home page
  if (document.getElementById('create-room-btn')) {
    const createRoomBtn = document.getElementById('create-room-btn');
    createRoomBtn.addEventListener('click', () => {
      const form = document.getElementById('create-room-form');
      form.submit();
    });
  }
});

// Function to get browser name
function getBrowserName() {
  const userAgent = navigator.userAgent;
  let browserName;
  
  if (userAgent.match(/chrome|chromium|crios/i)) {
    browserName = "Chrome";
  } else if (userAgent.match(/firefox|fxios/i)) {
    browserName = "Firefox";
  } else if (userAgent.match(/safari/i)) {
    browserName = "Safari";
  } else if (userAgent.match(/opr\//i)) {
    browserName = "Opera";
  } else if (userAgent.match(/edg/i)) {
    browserName = "Edge";
  } else {
    browserName = "Unknown";
  }
  
  return browserName;
}

// Function to get browser icon HTML
function getBrowserIcon() {
  const browserName = getBrowserName();
  let iconHTML = '';
  
  switch (browserName) {
    case 'Chrome':
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#4285F4"/><circle cx="50" cy="50" r="15" fill="#fff"/><path d="M50 35l25-20H25" fill="#EA4335"/><path d="M75 70L50 35" fill="#FBBC05"/><path d="M25 70L75 70" fill="#34A853"/><path d="M25 70L50 35" fill="#4285F4"/></svg>';
      break;
    case 'Firefox':
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FF9500"/><path d="M50 5C25 5 5 25 5 50s20 45 45 45 45-20 45-45S75 5 50 5zm25 50c0 13.8-11.2 25-25 25s-25-11.2-25-25 11.2-25 25-25 25 11.2 25 25z" fill="#E66000"/><path d="M75 20L20 75" stroke="#fff" stroke-width="5"/></svg>';
      break;
    case 'Safari':
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#fff"/><circle cx="50" cy="50" r="43" fill="none" stroke="#0080FF" stroke-width="2"/><path d="M25 25l50 50" stroke="#F03B42" stroke-width="2"/><path d="M75 25L25 75" stroke="#0080FF" stroke-width="2"/></svg>';
      break;
    case 'Opera':
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#FF1B2D"/><path d="M50 15c-10 0-20 10-20 35s10 35 20 35 20-10 20-35-10-35-20-35z" fill="#fff"/></svg>';
      break;
    case 'Edge':
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M5 50c0-25 20-45 45-45s45 20 45 45-20 45-45 45S5 75 5 50z" fill="#0078D7"/><path d="M35 65c5 5 15 5 30-5 0 0-5 15-25 15-15 0-20-10-20-10s10 5 15 0z" fill="#fff"/><path d="M20 40s0-15 15-15c15 0 25 5 35 15 0 0-20-5-35-5-10 0-15 5-15 5z" fill="#fff"/></svg>';
      break;
    default:
      iconHTML = '<svg class="browser-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#ccc"/><text x="50" y="55" font-size="12" text-anchor="middle" fill="#333">?</text></svg>';
  }
  
  return iconHTML;
} 