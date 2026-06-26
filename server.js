const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Đường dẫn file lưu trữ dữ liệu bookings (lưu ở thư mục gốc để bảo mật)
const DB_FILE = path.join(__dirname, 'bookings.json');

// Mật khẩu admin mặc định
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Hàm đọc dữ liệu từ file
function loadBookings() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      return JSON.parse(data || '[]');
    }
  } catch (error) {
    console.error('Lỗi khi đọc file bookings.json:', error);
  }
  return [];
}

// Hàm ghi dữ liệu vào file
function saveBookings(bookings) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi file bookings.json:', error);
    return false;
  }
}

// Khởi tạo mảng bookings từ file
let bookings = loadBookings();

// Cấu hình CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware đọc JSON body
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));

// Middleware xác thực Admin bằng mật khẩu gửi qua Header Authorization
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập!' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <password>
  if (token !== ADMIN_PASSWORD) {
    return res.status(403).json({ success: false, message: 'Mật khẩu không chính xác!' });
  }
  next();
}

// ==========================================
// API ENDPOINTS CHO GUEST (NGƯỜI DÙNG)
// ==========================================

// 1. Tạo yêu cầu đón mới
app.post('/api/pickup', (req, res) => {
  const { name, email, address, latitude, longitude, pickup_time, formatted_time, notes, google_maps_link } = req.body;

  if (!name) {
    return res.status(400).json({ success: false, message: 'Thiếu tên người cần đón!' });
  }

  // Tạo ID ngẫu nhiên duy nhất
  const bookingId = 'bk_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

  const newBooking = {
    id: bookingId,
    name,
    email: email || '',
    address: address || '',
    latitude: latitude || null,
    longitude: longitude || null,
    pickup_time: pickup_time || '',
    formatted_time: formatted_time || '',
    notes: notes || '',
    google_maps_link: google_maps_link || '',
    created_at: new Date().toISOString(),
    status: 'active',
    // Dữ liệu feedback (sẽ cập nhật sau)
    feedback: null
  };

  bookings = loadBookings(); // Tải lại để đảm bảo dữ liệu mới nhất
  bookings.push(newBooking);
  saveBookings(bookings);

  console.log(`🚗 Đã nhận yêu cầu đón của: ${name} (ID: ${bookingId})`);

  res.status(200).json({
    success: true,
    booking_id: bookingId,
    message: 'Gửi yêu cầu đón thành công!'
  });
});

// 2. Gửi feedback cho chuyến đón
app.post(['/api/feedback', '/api/pickup/feedback'], (req, res) => {
  const { booking_id, name, star, star_label, feedback_text, photo_base64 } = req.body;

  bookings = loadBookings();
  let booking = null;

  // Tìm booking theo booking_id
  if (booking_id) {
    booking = bookings.find(b => b.id === booking_id);
  }

  // Nếu không tìm thấy bằng ID, fallback tìm booking mới nhất trùng tên
  if (!booking && name) {
    booking = bookings.filter(b => b.name === name).pop();
  }

  // Nếu vẫn không có, fallback lấy booking mới nhất trong danh sách
  if (!booking && bookings.length > 0) {
    booking = bookings[bookings.length - 1];
  }

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin chuyến đi để gửi feedback!' });
  }

  // Cập nhật feedback
  booking.feedback = {
    star: star || 0,
    star_label: star_label || '',
    feedback_text: feedback_text || '',
    photo_base64: photo_base64 || null,
    submitted_at: new Date().toISOString()
  };

  saveBookings(bookings);

  console.log(`💬 Đã nhận feedback cho chuyến đi của: ${booking.name} (ID: ${booking.id})`);

  res.status(200).json({ success: true, message: 'Gửi feedback thành công!' });
});

// ==========================================
// API ENDPOINTS CHO ADMIN (QUẢN TRỊ)
// ==========================================

// 1. Đăng nhập admin
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;

  if (password === ADMIN_PASSWORD) {
    return res.status(200).json({
      success: true,
      token: ADMIN_PASSWORD, // Sử dụng chính password làm token đơn giản
      message: 'Đăng nhập thành công!'
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Mật khẩu không chính xác!'
    });
  }
});

// 2. Lấy danh sách toàn bộ chuyến đón
app.get('/api/admin/bookings', authenticateAdmin, (req, res) => {
  bookings = loadBookings();
  res.status(200).json({
    success: true,
    bookings: bookings
  });
});

// 3. Xóa/Hoàn thành chuyến đón
app.delete('/api/admin/bookings/:id', authenticateAdmin, (req, res) => {
  const bookingId = req.params.id;

  bookings = loadBookings();
  const initialLength = bookings.length;
  bookings = bookings.filter(b => b.id !== bookingId);

  if (bookings.length === initialLength) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi cần xóa!' });
  }

  saveBookings(bookings);
  console.log(`🗑️ Đã xóa chuyến đón ID: ${bookingId}`);

  res.status(200).json({
    success: true,
    message: 'Đã hoàn thành/xóa chuyến đón!'
  });
});

// Serve index.html cho mọi route còn lại từ thư mục public
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});

module.exports = app;
