document.addEventListener('DOMContentLoaded', () => {
  // === CONFIG CHECK ===
  const config = window.APP_CONFIG || {
    DELIVERY_METHOD: 'custom_api',
    SERVER_URL: 'http://localhost:5000/api/pickup',
    SUCCESS_MESSAGE: 'Đã gửi tọa độ thành công! Chờ mình một chút nhé, mình đang qua đón bạn đây... 🐱'
  };

  // === UI ELEMENTS ===
  const mainCard = document.getElementById('main-card');
  const successCard = document.getElementById('success-card');
  const pickupForm = document.getElementById('pickup-form');
  const nameInput = document.getElementById('pickup-name');
  const searchInput = document.getElementById('address-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const suggestionsList = document.getElementById('search-suggestions');
  const addressDisplay = document.getElementById('address-display');
  const timeInput = document.getElementById('pickup-time');
  const notesInput = document.getElementById('pickup-notes');
  const submitBtn = document.getElementById('submit-btn');
  const locateBtn = document.getElementById('locate-btn');
  
  const successTextContent = document.getElementById('success-text-content');
  const summaryName = document.getElementById('summary-name');
  const summaryAddress = document.getElementById('summary-address');
  const summaryTime = document.getElementById('summary-time');
  const editBtn = document.getElementById('edit-btn');
  const catBgContainer = document.getElementById('cat-bg');
  const emailInput = document.getElementById('pickup-email');

  // Feedback elements
  const feedbackSection   = document.getElementById('feedback-section');
  const starBtns          = document.querySelectorAll('.star-btn');
  const starLabel         = document.getElementById('star-label');
  const feedbackTextarea  = document.getElementById('feedback-text');
  const feedbackPhoto     = document.getElementById('feedback-photo');
  const photoPreviewWrap  = document.getElementById('photo-preview-wrap');
  const photoPreviewImg   = document.getElementById('photo-preview-img');
  const removePhotoBtn    = document.getElementById('remove-photo-btn');
  const feedbackSubmitBtn = document.getElementById('feedback-submit-btn');
  const feedbackThanks    = document.getElementById('feedback-thanks');

  // === STATE VARIABLES ===
  let map;
  let marker;
  let selectedCoords = null;
  let selectedAddress = '';
  let searchDebounceTimer = null;
  let selectedStar = 0;
  let feedbackPhotoBase64 = null;

  // === 1. TẠO MÈO/DẤU CHÂN BAY NHẸ NHÀNG Ở BACKGROUND ===
  function createFloatingCats() {
    const catSymbols = ['🐱', '😸', '😻', '😽', '🐾', '🐈', '🐈‍⬛'];
    const maxCats = 12;
    
    // Spawn initial cats
    for (let i = 0; i < maxCats; i++) {
      spawnCat(true);
    }

    // Keep spawning over time
    setInterval(() => {
      if (catBgContainer.childElementCount < maxCats) {
        spawnCat(false);
      }
    }, 2500);
  }

  function spawnCat(initial = false) {
    const cat = document.createElement('div');
    cat.classList.add('floating-cat');
    
    const catSymbols = ['🐱', '😸', '😻', '😽', '🐾', '🐈', '🐈‍⬛'];
    cat.innerText = catSymbols[Math.floor(Math.random() * catSymbols.length)];
    
    // Thuộc tính ngẫu nhiên
    const size = Math.random() * 15 + 15; // 15px - 30px
    const left = Math.random() * 100; // 0% - 100%
    const duration = Math.random() * 5 + 7; // 7s - 12s
    const delay = initial ? -(Math.random() * duration) : 0; // Tránh dồn cục lúc bắt đầu
    
    cat.style.fontSize = `${size}px`;
    cat.style.left = `${left}%`;
    cat.style.animationDuration = `${duration}s`;
    cat.style.animationDelay = `${delay}s`;
    cat.style.pointerEvents = 'auto';
    cat.style.cursor = 'pointer';
    
    // Xóa khi kết thúc animation
    cat.addEventListener('animationend', () => {
      cat.remove();
    });

    // Hiệu ứng nổi lên khi click
    cat.addEventListener('click', (e) => {
      e.stopPropagation();
      popStickerAt(e.clientX, e.clientY, cat.innerText);
      cat.remove();
    });

    catBgContainer.appendChild(cat);
  }

  createFloatingCats();

  // === 1b. STICKER MÈO TRUÔI NỔI 2 BÊN MÀN HÌNH ===
  function createSideStickers() {
    const catStickers = ['🐱', '😸', '😹', '😺', '😻', '😼', '😽', '😾', '😿', '🐈', '🐈‍⬛', '🐾'];
    const maxSideStickers = 8;

    // Spawn các sticker ban đầu rải đều
    for (let i = 0; i < maxSideStickers; i++) {
      setTimeout(() => spawnSideSticker(true), i * 600);
    }

    // Spawn liên tục
    setInterval(() => {
      const sideStickers = document.querySelectorAll('.side-sticker');
      if (sideStickers.length < maxSideStickers) {
        spawnSideSticker(false);
      }
    }, 1800);
  }

  function spawnSideSticker(initial = false) {
    const sticker = document.createElement('div');
    sticker.classList.add('side-sticker');

    const catStickers = ['🐱', '😸', '😹', '😺', '😻', '😼', '😽', '😾', '😿', '🐈', '🐾'];
    sticker.innerText = catStickers[Math.floor(Math.random() * catStickers.length)];

    // Ngẫu nhiên trái (0) hoặc phải (1)
    const isLeft = Math.random() < 0.5;
    sticker.classList.add(isLeft ? 'side-sticker--left' : 'side-sticker--right');

    const size = Math.random() * 18 + 26; // 26px - 44px, to hơn floating cats
    const duration = Math.random() * 6 + 9; // 9s - 15s
    const delay = initial ? -(Math.random() * duration) : 0;
    const wobble = (Math.random() - 0.5) * 24; // lắắc ít sang nắu khi bay lên

    sticker.style.fontSize = `${size}px`;
    sticker.style.animationDuration = `${duration}s`;
    sticker.style.animationDelay = `${delay}s`;
    sticker.style.setProperty('--wobble', `${wobble}px`);
    sticker.style.pointerEvents = 'auto';
    sticker.style.cursor = 'pointer';

    sticker.addEventListener('animationend', () => sticker.remove());

    // Hiệu ứng nổi lên khi click
    sticker.addEventListener('click', (e) => {
      e.stopPropagation();
      popStickerAt(e.clientX, e.clientY, sticker.innerText);
      sticker.remove();
    });

    catBgContainer.appendChild(sticker);
  }

  createSideStickers();

  // === 1c. HIỆU ỨNG NỔI LÊN KHI CLICK VÀO STICKER ===
  function popStickerAt(x, y, emoji) {
    const catSymbols = ['🐱', '😸', '😻', '😽', '🐾', '🐈', '✨', '💫', '⭐'];
    const count = Math.floor(Math.random() * 5) + 10; // 10-14 hạt

    // Hiệu ứng "pop" chính - emoji to lên rồi mờ đi
    const pop = document.createElement('div');
    pop.classList.add('sticker-pop');
    pop.innerText = emoji;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    document.body.appendChild(pop);
    pop.addEventListener('animationend', () => pop.remove());

    // Các hạt bay tứ phía
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.classList.add('sticker-burst-particle');
      p.innerText = catSymbols[Math.floor(Math.random() * catSymbols.length)];

      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const dist = Math.random() * 90 + 50;
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist - 30;
      const size = Math.random() * 14 + 12;
      const dur = Math.random() * 0.4 + 0.6;

      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.fontSize = `${size}px`;
      p.style.setProperty('--bx', `${dx}px`);
      p.style.setProperty('--by', `${dy}px`);
      p.style.animationDuration = `${dur}s`;
      p.style.animationDelay = `${Math.random() * 0.1}s`;

      document.body.appendChild(p);
      p.addEventListener('animationend', () => p.remove());
    }
  }

  // === 2. THIẾT LẬP THỜI GIAN MẶC ĐỊNH (Hiện tại + 1 tiếng) ===
  function setDefaultPickupTime() {
    const now = new Date();
    // Cộng thêm 1 giờ
    now.setHours(now.getHours() + 1);
    
    // Format thành yyyy-MM-ddThh:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    timeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }
  setDefaultPickupTime();

  // === 3. KHỞI TẠO BẢN ĐỒ LEAFLET ===
  const defaultCoords = [21.0285, 105.8542]; // Hà Nội mặc định
  
  function initMap() {
    addressDisplay.textContent = 'Đang tải bản đồ và định vị...';
    
    map = L.map('map', {
      zoomControl: false // Ẩn zoom gốc để giao diện gọn gàng hơn
    }).setView(defaultCoords, 15);

    // Sử dụng layer bản đồ đẹp, mượt mà từ CartoDB (style sáng, ấm áp phù hợp thiết kế)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    // Đưa nút zoom sang góc trên phải (nếu cần dùng)
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tạo icon marker mèo dễ thương
    const catIcon = L.divIcon({
      className: 'cat-marker-wrapper',
      html: '<div class="cat-marker">🐱</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });

    // Tạo marker mặc định
    marker = L.marker(defaultCoords, { icon: catIcon, draggable: false }).addTo(map);
    selectedCoords = { lat: defaultCoords[0], lng: defaultCoords[1] };
    
    // Lấy địa chỉ của tọa độ mặc định ban đầu
    reverseGeocode(defaultCoords[0], defaultCoords[1]);

    // Lắng nghe sự kiện click trên bản đồ để chọn tọa độ mới
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      updateMarkerPosition(lat, lng);
    });

    // Thử định vị vị trí ngay lúc khởi đầu
    tryGeolocation(false); // Chế độ im lặng ban đầu, không báo lỗi phiền phức nếu bị từ chối
  }

  initMap();

  // Cập nhật vị trí marker và truy vấn địa chỉ mới
  function updateMarkerPosition(lat, lng) {
    selectedCoords = { lat, lng };
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
    reverseGeocode(lat, lng);
  }

  // === 4. TRUY VẤN TỌA ĐỘ RA ĐỊA CHỈ (REVERSE GEOCODING) ===
  async function reverseGeocode(lat, lng) {
    addressDisplay.textContent = 'Đang giải mã tọa độ địa điểm...';
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
        headers: { 'Accept-Language': 'vi,en' }
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      if (data && data.display_name) {
        selectedAddress = cleanAddressName(data.display_name);
        addressDisplay.textContent = `📍 ${selectedAddress}`;
        searchInput.value = selectedAddress;
        clearSearchBtn.style.display = 'block';
      } else {
        selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        addressDisplay.textContent = `📍 Tọa độ: ${selectedAddress}`;
      }
    } catch (error) {
      console.error('Lỗi phân tích địa chỉ:', error);
      selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      addressDisplay.textContent = `📍 Tọa độ: ${selectedAddress}`;
    }
  }

  // Dọn dẹp địa chỉ hiển thị bớt rác (rút ngắn quốc gia)
  function cleanAddressName(addressStr) {
    return addressStr
      .replace(', Việt Nam', '')
      .replace(', Vietnam', '');
  }

  // === 5. ĐỊNH VỊ VỊ TRÍ HIỆN TẠI (GEOLOCATION & IP FALLBACK) ===
  function tryGeolocation(showAlerts = true) {
    if (!navigator.geolocation) {
      if (showAlerts) {
        alert('Trình duyệt không hỗ trợ GPS. Hệ thống sẽ thử định vị ước tính qua IP mạng của bạn...');
      }
      fallbackIPGeolocation();
      return;
    }

    if (showAlerts) {
      addressDisplay.textContent = 'Đang yêu cầu GPS định vị...';
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateMarkerPosition(latitude, longitude);
      },
      (error) => {
        console.warn('Lỗi GPS Geolocation:', error);
        // Fallback sang IP Geolocation khi lỗi GPS
        fallbackIPGeolocation();
        if (showAlerts && error.code === error.PERMISSION_DENIED) {
          alert('Quyền GPS bị từ chối. Hệ thống đã tự động định vị qua IP mạng của bạn!');
        }
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }

  async function fallbackIPGeolocation() {
    try {
      const response = await fetch('https://freeipapi.com/api/json');
      if (!response.ok) throw new Error('IP Geolocation API failed');
      const data = await response.json();
      if (data && data.latitude && data.longitude) {
        updateMarkerPosition(data.latitude, data.longitude);
      }
    } catch (e) {
      console.warn('Không thể định vị bằng IP:', e);
    }
  }

  // Bấm nút định vị tròn trên bản đồ
  locateBtn.addEventListener('click', () => {
    tryGeolocation(true);
  });

  // === 6. TÌM KIẾM ĐỊA CHỈ (AUTOCOMPLETE SUGGESTIONS) ===
  // Hiển thị gợi ý tự động lấy vị trí khi click vào ô tìm kiếm trống
  searchInput.addEventListener('focus', () => {
    if (searchInput.value.trim().length === 0) {
      suggestionsList.innerHTML = '<li id="use-gps-suggestion" style="font-weight: 600; color: var(--primary-color); border-bottom: none;">📍 Tự động lấy vị trí hiện tại của bạn</li>';
      suggestionsList.classList.remove('hidden');
      
      document.getElementById('use-gps-suggestion').addEventListener('click', (e) => {
        e.stopPropagation();
        tryGeolocation(true);
        suggestionsList.classList.add('hidden');
      });
    }
  });

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    
    // Toggle nút xóa tìm kiếm
    clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';

    if (query.length < 3) {
      suggestionsList.classList.add('hidden');
      return;
    }

    // Debounce tránh spam API liên tục khi gõ
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      fetchSuggestions(query);
    }, 450000 / 1000); // Khoảng 450ms
  });

  async function fetchSuggestions(query) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=vn`, {
        headers: { 'Accept-Language': 'vi,en' }
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      
      displaySuggestions(data);
    } catch (error) {
      console.error('Lỗi tải gợi ý địa điểm:', error);
    }
  }

  function displaySuggestions(items) {
    suggestionsList.innerHTML = '';
    
    if (!items || items.length === 0) {
      suggestionsList.classList.add('hidden');
      return;
    }

    items.forEach(item => {
      const li = document.createElement('li');
      const cleanName = cleanAddressName(item.display_name);
      li.textContent = cleanName;
      
      li.addEventListener('click', () => {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        
        selectedAddress = cleanName;
        searchInput.value = cleanName;
        addressDisplay.textContent = `📍 ${cleanName}`;
        
        selectedCoords = { lat, lng: lon };
        marker.setLatLng([lat, lon]);
        map.setView([lat, lon], 16);
        
        suggestionsList.classList.add('hidden');
      });
      
      suggestionsList.appendChild(li);
    });

    suggestionsList.classList.remove('hidden');
  }

  // Ẩn suggestions khi click ra ngoài
  document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsList.contains(e.target)) {
      suggestionsList.classList.add('hidden');
    }
  });

  // Nút xóa nhanh ô tìm kiếm
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    suggestionsList.classList.add('hidden');
    searchInput.focus();
  });

  // === 7. HIỆU ỨNG PHÁO HOA CÁT VÀ DẤU CHÂN KHI SUBMIT ===
  function createCatExplosion(e) {
    // Lấy tọa độ click hoặc tọa độ trung tâm nút nếu submit bằng phím enter
    let x, y;
    if (e && e.clientX && e.clientY) {
      x = e.clientX;
      y = e.clientY;
    } else {
      const rect = submitBtn.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const catSymbols = ['🐱', '😸', '😻', '😽', '🐾', '🐈', '🐾'];
    const particleCount = 20;

    for (let i = 0; i < particleCount; i++) {
      const p = document.createElement('div');
      p.classList.add('particle');
      p.innerText = catSymbols[Math.floor(Math.random() * catSymbols.length)];
      
      // Tính toán hướng bay ngẫu nhiên theo hình tròn
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 100 + 60; // Tốc độ bay xa
      const destinationX = Math.cos(angle) * velocity;
      const destinationY = Math.sin(angle) * velocity - 40; // Bay hơi hướng lên
      
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      p.style.setProperty('--x', `${destinationX}px`);
      p.style.setProperty('--y', `${destinationY}px`);
      
      // Kích thước ngẫu nhiên
      const size = Math.random() * 12 + 10;
      p.style.fontSize = `${size}px`;
      
      document.body.appendChild(p);
      
      p.addEventListener('animationend', () => {
        p.remove();
      });
    }
  }

  // === 8. GỬI DỮ LIỆU ĐI (SUBMIT DATA) ===
  pickupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const pickupTime = timeInput.value;
    const notes = notesInput.value.trim();
    const addressVal = searchInput.value.trim();

    if (!name) {
      alert('Vui lòng nhập tên của bạn nhé!');
      return;
    }

    if (!addressVal && !selectedCoords) {
      alert('Vui lòng nhập địa chỉ đón hoặc chọn một địa điểm trên bản đồ nhé!');
      return;
    }

    if (!pickupTime) {
      alert('Vui lòng chọn thời gian muốn đến đón nha!');
      return;
    }

    // Hiệu ứng nút bấm và pháo hoa mèo
    submitBtn.disabled = true;
    const originalBtnHTML = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Đang gửi định vị... 🚗</span>';
    createCatExplosion(e);

    // Format ngày giờ hiển thị ở màn hình thành công
    const formattedTime = new Date(pickupTime).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Dữ liệu chuẩn bị gửi đi
    const payload = {
      name: name,
      email: emailInput.value.trim() || '',
      address: addressVal || selectedAddress || (selectedCoords ? `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}` : ''),
      latitude: selectedCoords ? selectedCoords.lat : null,
      longitude: selectedCoords ? selectedCoords.lng : null,
      pickup_time: pickupTime,
      formatted_time: formattedTime,
      notes: notes,
      google_maps_link: selectedCoords ? `https://www.google.com/maps/search/?api=1&query=${selectedCoords.lat},${selectedCoords.lng}` : ''
    };

    let isSuccess = false;

    try {
      if (config.DELIVERY_METHOD === 'telegram') {
        isSuccess = await sendToTelegram(payload);
      } else if (config.DELIVERY_METHOD === 'email') {
        isSuccess = await sendToEmail(payload);
      } else {
        isSuccess = await sendToCustomAPI(payload);
      }
    } catch (err) {
      console.error('Lỗi khi gửi dữ liệu:', err);
    }

    if (isSuccess) {
      // Chuyển sang màn hình thành công
      summaryName.textContent = name;
      summaryAddress.textContent = payload.address;
      summaryTime.textContent = formattedTime;
      successTextContent.textContent = config.SUCCESS_MESSAGE;

      mainCard.classList.add('hidden');
      successCard.classList.remove('hidden');
    } else {
      // Phục hồi nút bấm và báo lỗi
      alert('Có lỗi xảy ra khi gửi thông tin đi. Vui lòng thử lại hoặc gửi trực tiếp nhé!');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnHTML;
    }
  });

  // Gửi email qua API Web3Forms (Miễn phí gửi trực tiếp về Gmail)
  async function sendToEmail(payload) {
    const accessKey = config.WEB3FORMS_ACCESS_KEY;
    if (!accessKey || accessKey.includes('YOUR_WEB3FORMS_ACCESS_KEY')) {
      console.error('Chưa cấu hình Web3Forms Access Key.');
      return false;
    }

    // Định dạng dữ liệu gửi lên Web3Forms
    const formData = {
      access_key: accessKey,
      subject: `🚗 YÊU CẦU ĐÓN: ${payload.name} 🚗`,
      from_name: 'App Đón Bạn (Cat Pickup)',
      
      '👤 Họ tên': payload.name,
      '📍 Địa chỉ đón': payload.address,
      '⏰ Thời gian đón': payload.formatted_time,
      '💌 Lời nhắn': payload.notes || 'Không có lời nhắn',
      '🌐 Bản đồ Google Maps': payload.google_maps_link || 'Địa chỉ nhập thủ công (Không có GPS)'
    };

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      return response.ok && data.success;
    } catch (e) {
      console.error('Lỗi khi gửi qua Web3Forms:', e);
      return false;
    }
  }

  // Gửi qua Custom API Server của người dùng
  async function sendToCustomAPI(payload) {
    try {
      const response = await fetch(config.SERVER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      return response.ok;
    } catch (e) {
      console.error('Lỗi kết nối tới Custom API Server:', e);
      return false;
    }
  }

  // Gửi trực tiếp qua Telegram Bot
  async function sendToTelegram(payload) {
    const token = config.TELEGRAM_BOT_TOKEN;
    const chatId = config.TELEGRAM_CHAT_ID;
    
    if (!token || token.includes('YOUR_TELEGRAM_BOT_TOKEN') || !chatId) {
      console.error('Chưa cấu hình Telegram Bot Token hoặc Chat ID.');
      return false;
    }

    const mapsLine = payload.google_maps_link 
      ? `🗺️ *Bản đồ Google Maps:* \n${payload.google_maps_link}` 
      : `⚠️ *Không có dữ liệu GPS (Địa chỉ nhập thủ công)*`;

    const messageText = `🚗 *YÊU CẦU ĐÓN BẠN* 🚗\n\n` +
      `👤 *Người cần đón:* ${payload.name}\n` +
      `📍 *Địa điểm:* ${payload.address}\n` +
      `⏰ *Thời gian:* ${payload.formatted_time}\n` +
      `💌 *Lời nhắn:* ${payload.notes || 'Không có lời nhắn'}\n\n` +
      mapsLine;

    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'Markdown'
        })
      });
      return response.ok;
    } catch (e) {
      console.error('Lỗi khi gửi qua API Telegram:', e);
      return false;
    }
  }

  // === 9. NÚt QUAY LẠI SỬa ĐỊA CHỈ ===
  editBtn.addEventListener('click', () => {
    successCard.classList.add('hidden');
    mainCard.classList.remove('hidden');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<span>Gửi định vị đón bạn 🚗</span>';

    // Reset feedback về trạng thái ban đầu
    selectedStar = 0;
    starBtns.forEach(b => b.classList.remove('active', 'pop'));
    starLabel.textContent = 'Chọn đánh giá của bạn';
    feedbackTextarea.value = '';
    feedbackPhoto.value = '';
    feedbackPhotoBase64 = null;
    photoPreviewWrap.classList.add('hidden');
    photoPreviewImg.src = '';
    feedbackSection.classList.remove('hidden');
    feedbackThanks.classList.add('hidden');
    feedbackSubmitBtn.disabled = false;
    feedbackSubmitBtn.innerHTML = '<span>Gửi feedback 💌</span>';
    
    // Cập nhật lại bản đồ vì kích thước container có thể thay đổi sau khi ẩn/hiện
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  });

  // === 10. FEEDBACK LOGIC ===

  // -- Star rating --
  const starLabels = ['', 'Tệ quá 😿', 'Chưa ổn lắm 😾', 'Bình thường 😺', 'Vui lắm! 😻', 'Tuyệt vời! 🥰'];

  starBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      selectedStar = parseInt(btn.dataset.value);
      starBtns.forEach((b, i) => {
        b.classList.toggle('active', i < selectedStar);
      });
      // Pop animation chỉ sao được chọn
      btn.classList.remove('pop');
      void btn.offsetWidth; // reflow
      btn.classList.add('pop');
      btn.addEventListener('animationend', () => btn.classList.remove('pop'), { once: true });
      starLabel.textContent = starLabels[selectedStar];
    });

    // Hover preview
    btn.addEventListener('mouseenter', () => {
      const hoverVal = parseInt(btn.dataset.value);
      starBtns.forEach((b, i) => b.style.color = i < hoverVal ? '#f1c40f' : '');
    });
    btn.addEventListener('mouseleave', () => {
      starBtns.forEach((b, i) => b.style.color = i < selectedStar ? '#f1c40f' : '');
    });
  });

  // -- Photo preview --
  feedbackPhoto.addEventListener('change', () => {
    const file = feedbackPhoto.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      feedbackPhotoBase64 = e.target.result; // data:image/...;base64,...
      photoPreviewImg.src = feedbackPhotoBase64;
      photoPreviewWrap.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  });

  removePhotoBtn.addEventListener('click', () => {
    feedbackPhoto.value = '';
    feedbackPhotoBase64 = null;
    photoPreviewImg.src = '';
    photoPreviewWrap.classList.add('hidden');
  });

  // -- Submit feedback --
  feedbackSubmitBtn.addEventListener('click', async () => {
    if (!selectedStar && !feedbackTextarea.value.trim() && !feedbackPhotoBase64) {
      alert('Vui lòng chọn sao hoặc viết nhận xét nhé!');
      return;
    }

    feedbackSubmitBtn.disabled = true;
    feedbackSubmitBtn.innerHTML = '<span>Đang gửi... 💌</span>';

    const feedbackPayload = {
      name: summaryName.textContent,
      email: emailInput.value.trim() || '',
      star: selectedStar,
      star_label: starLabels[selectedStar] || '',
      feedback_text: feedbackTextarea.value.trim(),
      photo_base64: feedbackPhotoBase64 || null,
      address: summaryAddress.textContent,
      pickup_time: summaryTime.textContent,
    };

    try {
      if (config.DELIVERY_METHOD === 'telegram') {
        await sendFeedbackToTelegram(feedbackPayload);
      } else if (config.DELIVERY_METHOD === 'email') {
        await sendFeedbackToEmail(feedbackPayload);
      } else {
        await sendFeedbackToCustomAPI(feedbackPayload);
      }
    } catch (err) {
      console.error('Lỗi gửi feedback:', err);
    }

    // Hiện cảm ơn
    feedbackSection.classList.add('hidden');
    feedbackThanks.classList.remove('hidden');
  });

  async function sendFeedbackToTelegram(fb) {
    const token = config.TELEGRAM_BOT_TOKEN;
    const chatId = config.TELEGRAM_CHAT_ID;
    if (!token || token.includes('YOUR_TELEGRAM_BOT_TOKEN') || !chatId) return;

    const stars = '⭐'.repeat(fb.star || 0);
    const msg = `💬 *FEEDBACK CHUYẾN ĐÓN*\n\n` +
      `👤 *Họ tên:* ${fb.name}\n` +
      (fb.email ? `📧 *Email:* ${fb.email}\n` : '') +
      `📍 *Điểm đón:* ${fb.address}\n` +
      `⏰ *Thời gian:* ${fb.pickup_time}\n\n` +
      `${stars || '✅'} *Đánh giá:* ${fb.star_label || 'Không chọn sao'}\n` +
      `📝 *Nhận xét:* ${fb.feedback_text || 'Không có nhận xét'}\n`;

    // Gửi tin nhắn text trước
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    });

    // Nếu có ảnh, gửi ảnh riêng
    if (fb.photo_base64) {
      try {
        // Chuyển base64 sang Blob
        const res = await fetch(fb.photo_base64);
        const blob = await res.blob();
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', blob, 'feedback.jpg');
        formData.append('caption', `📷 Ảnh kỷ niệm của ${fb.name}`);
        await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
          method: 'POST',
          body: formData
        });
      } catch (e) { console.warn('Không gửi được ảnh:', e); }
    }
  }

  async function sendFeedbackToEmail(fb) {
    const accessKey = config.WEB3FORMS_ACCESS_KEY;
    if (!accessKey || accessKey.includes('YOUR_WEB3FORMS_ACCESS_KEY')) return;
    const stars = '⭐'.repeat(fb.star || 0);
    await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        access_key: accessKey,
        subject: `💬 FEEDBACK TỪ ${fb.name}`,
        from_name: 'App Đón Bạn (Feedback)',
        '👤 Họ tên': fb.name,
        '📧 Email': fb.email || 'Không cung cấp',
        [`${stars || '⚠️'} Đánh giá`]: fb.star_label || 'Không chọn sao',
        '📝 Nhận xét': fb.feedback_text || 'Không có nhận xét',
        '📍 Điểm đón': fb.address,
        '⏰ Thời gian': fb.pickup_time,
        '🖼️ Ảnh kỷ niệm': fb.photo_base64 ? '(Có kèm ảnh – xem trong API hoặc Telegram)' : 'Không có ảnh',
      })
    });
  }

  async function sendFeedbackToCustomAPI(fb) {
    try {
      await fetch(`${config.SERVER_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fb)
      });
    } catch (e) { console.warn('Không gửi được feedback:', e); }
  }
});
