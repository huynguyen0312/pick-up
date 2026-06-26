document.addEventListener('DOMContentLoaded', () => {
  const config = window.APP_CONFIG || {
    SERVER_URL: 'http://localhost:5000/api/pickup'
  };

  // Trích xuất base API URL (bỏ đuôi /pickup hoặc /api/pickup nếu có)
  let apiBaseUrl = config.SERVER_URL;
  if (apiBaseUrl.endsWith('/api/pickup')) {
    apiBaseUrl = apiBaseUrl.replace('/api/pickup', '/api');
  } else if (apiBaseUrl.endsWith('/pickup')) {
    apiBaseUrl = apiBaseUrl.replace('/pickup', '');
  }

  // === UI ELEMENTS ===
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const loginForm = document.getElementById('admin-login-form');
  const passInput = document.getElementById('admin-pass-input');
  const logoutBtn = document.getElementById('logout-btn');

  // Stats
  const statTotalBookings = document.getElementById('stat-total-bookings');
  const statActiveBookings = document.getElementById('stat-active-bookings');
  const statAvgRating = document.getElementById('stat-avg-rating');

  // List
  const bookingsListContainer = document.getElementById('bookings-list-container');

  // Modal
  const photoModal = document.getElementById('photo-modal');
  const modalImgElement = document.getElementById('modal-img-element');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // === STATE ===
  let adminToken = sessionStorage.getItem('admin_token');
  let map = null;
  let markersGroup = null;
  let bookingsData = [];

  // Icon mèo dễ thương cho marker trên bản đồ của admin
  const adminCatIcon = L.divIcon({
    className: 'cat-marker-wrapper',
    html: '<div class="cat-marker" style="font-size: 32px; filter: drop-shadow(0 2px 5px rgba(0,0,0,0.2));">🐱</div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });

  // === 1. KIỂM TRA ĐĂNG NHẬP BAN ĐẦU ===
  if (adminToken) {
    showDashboard();
  }

  // Xử lý submit đăng nhập
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = passInput.value.trim();

    try {
      const response = await fetch(`${apiBaseUrl}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('admin_token', data.token);
        adminToken = data.token;
        showDashboard();
      } else {
        alert(data.message || 'Mật khẩu không chính xác!');
        passInput.value = '';
        passInput.focus();
      }
    } catch (error) {
      console.error('Lỗi kết nối tới server:', error);
      alert('Không thể kết nối tới server backend!');
    }
  });

  // Đăng xuất
  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_token');
    window.location.reload();
  });

  // === 2. HIỂN THỊ DASHBOARD & TẢI DỮ LIỆU ===
  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
    
    // Khởi tạo bản đồ nếu chưa có
    initAdminMap();
    
    // Tải dữ liệu các chuyến đi
    loadAdminData();
    
    // Tải mèo bay làm đẹp background
    createFloatingCats();
  }

  // Khởi tạo bản đồ Leaflet
  function initAdminMap() {
    if (map) return;

    map = L.map('admin-map', {
      zoomControl: false
    }).setView([21.0285, 105.8542], 12); // Hà Nội mặc định

    // Layer bản đồ
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // Khởi tạo group chứa markers để dễ quản lý
    markersGroup = L.featureGroup().addTo(map);
  }

  // Tải dữ liệu từ API Admin
  async function loadAdminData() {
    if (!adminToken) return;

    try {
      const response = await fetch(`${apiBaseUrl}/admin/bookings`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (response.status === 401 || response.status === 403) {
        sessionStorage.removeItem('admin_token');
        alert('Phiên đăng nhập hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!');
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (response.ok && data.success) {
        bookingsData = data.bookings || [];
        renderDashboard();
      } else {
        bookingsListContainer.innerHTML = `<p style="text-align: center; color: #e74c3c;">Lỗi tải dữ liệu: ${data.message}</p>`;
      }
    } catch (error) {
      console.error('Lỗi khi fetch dữ liệu:', error);
      bookingsListContainer.innerHTML = '<p style="text-align: center; color: #e74c3c;">Lỗi kết nối tới server backend!</p>';
    }
  }

  // === 3. RENDER DASHBOARD (STATS, LIST, MAP MARKERS) ===
  function renderDashboard() {
    // 3a. Tính toán và hiển thị thống kê
    const totalCount = bookingsData.length;
    const activeCount = bookingsData.filter(b => b.status === 'active').length;
    
    // Tính rating trung bình
    const ratingBookings = bookingsData.filter(b => b.feedback && b.feedback.star > 0);
    let avgRatingStr = '—';
    if (ratingBookings.length > 0) {
      const sum = ratingBookings.reduce((acc, b) => acc + b.feedback.star, 0);
      avgRatingStr = (sum / ratingBookings.length).toFixed(1) + ' ⭐';
    }

    statTotalBookings.textContent = totalCount;
    statActiveBookings.textContent = activeCount;
    statAvgRating.textContent = avgRatingStr;

    // Sắp xếp chuyến đi mới nhất lên đầu
    const sortedBookings = [...bookingsData].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // 3b. Xóa markers cũ và vẽ lại
    markersGroup.clearLayers();
    const mapBounds = [];

    // 3c. Vẽ danh sách và markers
    bookingsListContainer.innerHTML = '';
    
    if (sortedBookings.length === 0) {
      bookingsListContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted); margin: 40px 0;">Chưa có yêu cầu đón nào 🐾</p>';
      return;
    }

    sortedBookings.forEach(booking => {
      // 1. Vẽ marker lên bản đồ nếu có tọa độ hợp lệ
      if (booking.latitude && booking.longitude) {
        const lat = parseFloat(booking.latitude);
        const lng = parseFloat(booking.longitude);
        mapBounds.push([lat, lng]);

        const marker = L.marker([lat, lng], { icon: adminCatIcon });
        
        // Popup trên bản đồ
        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; font-size: 0.9rem; min-width: 150px;">
            <strong style="color: var(--primary-color);">${booking.name}</strong>
            <div style="margin-top: 4px;">⏰ ${booking.formatted_time || booking.pickup_time}</div>
            <div style="font-size: 0.78rem; color: #666; margin-top: 4px; border-top: 1px solid #eee; padding-top: 4px;">📍 ${booking.address}</div>
          </div>
        `);
        
        markersGroup.addLayer(marker);
        
        // Liên kết marker với booking id để dễ tìm
        booking._marker = marker;
      }

      // 2. Tạo phần tử hiển thị trong danh sách
      const card = document.createElement('div');
      card.className = 'booking-item';
      card.dataset.id = booking.id;

      // Xử lý hiển thị feedback nếu có
      let feedbackHTML = '';
      if (booking.feedback) {
        const starsStr = '★'.repeat(booking.feedback.star) + '☆'.repeat(5 - booking.feedback.star);
        feedbackHTML = `
          <div style="background: rgba(230, 126, 34, 0.05); padding: 10px; border-radius: 12px; border-left: 3px solid #f1c40f; margin-top: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
              <span style="color: #f1c40f; font-weight: 700; font-size: 0.95rem;">${starsStr}</span>
              <span style="color: var(--text-muted); font-size: 0.75rem;">${booking.feedback.star_label || ''}</span>
            </div>
            ${booking.feedback.feedback_text ? `<p style="margin: 5px 0 0; font-size: 0.82rem; color: #555; font-style: italic;">"${booking.feedback.feedback_text}"</p>` : ''}
            
            ${booking.feedback.photo_base64 ? `
              <button class="photo-attached-btn" style="margin-top: 8px;" onclick="openPhotoModal('${booking.feedback.photo_base64.replace(/'/g, "\\'")}')">
                📷 Xem ảnh kỷ niệm
              </button>
            ` : ''}
          </div>
        `;
      }

      card.innerHTML = `
        <div class="booking-item-header">
          <span class="booking-item-name">${booking.name}</span>
          <span class="booking-item-time">${booking.formatted_time || booking.pickup_time}</span>
        </div>
        <div class="booking-item-body">
          <div><strong>📍 Điểm đón:</strong> ${booking.address}</div>
          ${booking.notes ? `<div><strong>🐾 Lời nhắn:</strong> ${booking.notes}</div>` : ''}
          
          ${booking.google_maps_link ? `
            <div>
              <strong>🗺️ Google Maps:</strong> 
              <a href="${booking.google_maps_link}" target="_blank" style="color: var(--primary-color); font-weight: 500;">Link vị trí</a>
            </div>
          ` : ''}
          
          ${feedbackHTML}
        </div>
        <div class="booking-item-meta">
          <span>📅 Đăng lúc: ${new Date(booking.created_at).toLocaleTimeString('vi-VN')} ${new Date(booking.created_at).toLocaleDateString('vi-VN')}</span>
        </div>
        <div class="booking-item-actions">
          <button class="complete-btn" onclick="completeBooking('${booking.id}')">Đón xong / Xóa</button>
        </div>
      `;

      // Click card bay tới vị trí trên bản đồ
      card.addEventListener('click', (e) => {
        // Tránh bay map khi click nút Xóa hay Xem ảnh
        if (e.target.closest('button') || e.target.closest('a')) return;
        
        if (booking.latitude && booking.longitude) {
          const lat = parseFloat(booking.latitude);
          const lng = parseFloat(booking.longitude);
          map.setView([lat, lng], 16);
          if (booking._marker) {
            booking._marker.openPopup();
          }
        }
      });

      bookingsListContainer.appendChild(card);
    });

    // 3d. Zoom bản đồ bao trùm toàn bộ markers
    if (mapBounds.length > 0) {
      map.fitBounds(mapBounds, { padding: [40, 40] });
    }
  }

  // === 4. ĐÓN XONG / XÓA BOOKING ===
  window.completeBooking = async function(id) {
    if (!confirm('Bạn đã đón xong hoặc muốn xóa yêu cầu này? Dữ liệu sẽ biến mất vĩnh viễn.')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/admin/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Tải lại bảng dữ liệu
        loadAdminData();
      } else {
        alert(data.message || 'Lỗi khi xóa chuyến đón!');
      }
    } catch (error) {
      console.error('Lỗi kết nối:', error);
      alert('Không thể kết nối tới server để thực hiện yêu cầu!');
    }
  };

  // === 5. MODAL XEM ẢNH ===
  window.openPhotoModal = function(base64Src) {
    modalImgElement.src = base64Src;
    photoModal.classList.add('active');
  };

  modalCloseBtn.addEventListener('click', () => {
    photoModal.classList.remove('active');
    modalImgElement.src = '';
  });

  // Tự động đóng modal khi click ra ngoài vùng ảnh
  photoModal.addEventListener('click', (e) => {
    if (e.target === photoModal) {
      photoModal.classList.remove('active');
      modalImgElement.src = '';
    }
  });

  // === 6. BACKGROUND ANIMATIONS (MÈO BAY) ===
  function createFloatingCats() {
    const catBgContainer = document.getElementById('cat-bg');
    if (!catBgContainer) return;
    
    // Clear old ones
    catBgContainer.innerHTML = '';
    
    const catSymbols = ['🐱', '😸', '😻', '😽', '🐾', '🐈', '🐾'];
    const maxCats = 8;
    
    for (let i = 0; i < maxCats; i++) {
      spawnCat(true);
    }

    setInterval(() => {
      if (catBgContainer.childElementCount < maxCats) {
        spawnCat(false);
      }
    }, 3000);

    function spawnCat(initial = false) {
      const cat = document.createElement('div');
      cat.classList.add('floating-cat');
      cat.innerText = catSymbols[Math.floor(Math.random() * catSymbols.length)];
      
      const size = Math.random() * 15 + 15;
      const left = Math.random() * 100;
      const duration = Math.random() * 5 + 8;
      const delay = initial ? -(Math.random() * duration) : 0;
      
      cat.style.fontSize = `${size}px`;
      cat.style.left = `${left}%`;
      cat.style.animationDuration = `${duration}s`;
      cat.style.animationDelay = `${delay}s`;
      cat.style.pointerEvents = 'none'; // Không cần click tương tác ở admin
      
      cat.addEventListener('animationend', () => cat.remove());
      catBgContainer.appendChild(cat);
    }
  }
});
