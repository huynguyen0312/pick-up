const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// === CẤU HÌNH SMTP GỬI EMAIL ===
const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : true, // mặc định true cho port 465 (SSL)
  auth: {
    user: (process.env.SMTP_USER || 'amshuuhuy10@gmail.com').trim(), // Gmail gửi mail
    pass: (process.env.SMTP_PASS || 'cezw mipq iuqt onol').replace(/\s+/g, '') // Mật khẩu ứng dụng Gmail (App Password)
  },
  to: (process.env.SMTP_TO || process.env.SMTP_USER || 'amshuuhuy10@gmail.com').trim() // Email nhận thông báo
};

// Cấu hình CORS để cho phép trang web từ GitHub Pages gửi request đến server của bạn
app.use(cors({
  origin: '*', // Trong thực tế, bạn nên giới hạn chỉ cho phép tên miền GitHub Pages của bạn
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Middleware để đọc JSON body từ request
app.use(express.json({ limit: '10mb' })); // tăng limit cho base64 ảnh feedback

// Serve frontend static files (HTML, CSS, JS, ảnh) từ thư mục public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Endpoint để nhận thông tin đón bạn và gửi SMTP Mail
app.post('/api/pickup', (req, res) => {
  const { name, address, latitude, longitude, pickup_time, formatted_time, notes, google_maps_link } = req.body;

  // In thông tin nhận được ra console của server
  console.log('\n==================================================');
  console.log('🚗 CÓ YÊU CẦU ĐÓN BẠN MỚI 🚗');
  console.log(`👤 Người cần đón: ${name}`);
  console.log(`📍 Địa chỉ: ${address}`);
  console.log(`🌐 Tọa độ: ${latitude}, ${longitude}`);
  console.log(`⏰ Thời gian đón: ${formatted_time || pickup_time}`);
  console.log(`💌 Lời nhắn: ${notes || 'Không có lời nhắn'}`);
  console.log(`🗺️ Bản đồ Google Maps: ${google_maps_link}`);
  console.log('==================================================\n');

  // Khởi tạo transporter SMTP với cấu hình timeouts để tránh treo kết nối
  const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: {
      user: SMTP_CONFIG.auth.user,
      pass: SMTP_CONFIG.auth.pass
    },
    connectionTimeout: 10000, // 10 giây timeout kết nối
    greetingTimeout: 10000,   // 10 giây timeout chào hỏi SMTP
    socketTimeout: 10000      // 10 giây timeout socket
  });

  const mailOptions = {
    from: `"App Đón Bạn" <${SMTP_CONFIG.auth.user}>`,
    to: SMTP_CONFIG.to,
    subject: `🚗 YÊU CẦU ĐÓN: ${name} 🚗`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #e67e22;">🚗 Yêu Cầu Đón Bạn</h2>
        <hr>
        <p><strong>👤 Người cần đón:</strong> ${name}</p>
        <p><strong>📍 Địa chỉ đón:</strong> ${address}</p>
        <p><strong>⏰ Thời gian đón:</strong> ${formatted_time || pickup_time}</p>
        <p><strong>💌 Lời nhắn:</strong> ${notes || 'Không có lời nhắn'}</p>
        <p><strong>🗺️ Vị trí bản đồ:</strong> ${google_maps_link ? `<a href="${google_maps_link}" target="_blank">${google_maps_link}</a>` : 'Địa chỉ nhập thủ công (Không có tọa độ GPS)'}</p>
      </div>
    `
  };

  // Gửi email SMTP
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Lỗi khi gửi email SMTP:', error);
      return res.status(500).json({
        success: false,
        message: 'Lỗi server khi gửi mail SMTP: ' + error.message
      });
    }
    console.log('Email SMTP đã được gửi thành công:', info.response);
    res.status(200).json({
      success: true,
      message: 'Server đã nhận vị trí và gửi mail SMTP thành công!'
    });
  });
});

// Endpoint nhận feedback sau khi đón xong (hỗ trợ cả /api/feedback và /api/pickup/feedback)
app.post(['/api/feedback', '/api/pickup/feedback'], (req, res) => {
  const { name, email, star, star_label, feedback_text, photo_base64, address, pickup_time } = req.body;

  console.log('\n==================================================');
  console.log('💬 FEEDBACK MỚI');
  console.log(`👤 Tên: ${name} | ⭐ ${star} sao | ${star_label}`);
  console.log(`📝 Nhận xét: ${feedback_text}`);
  console.log('==================================================\n');

  const transporter = nodemailer.createTransport({
    host: SMTP_CONFIG.host,
    port: SMTP_CONFIG.port,
    secure: SMTP_CONFIG.secure,
    auth: { user: SMTP_CONFIG.auth.user, pass: SMTP_CONFIG.auth.pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000
  });

  const stars = '⭐'.repeat(star || 0);
  let htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #e67e22;">💬 Feedback Chuyến Đón</h2><hr>
      <p><strong>👤 Họ tên:</strong> ${name}</p>
      ${email ? `<p><strong>📧 Email:</strong> ${email}</p>` : ''}
      <p><strong>📍 Điểm đón:</strong> ${address}</p>
      <p><strong>⏰ Thời gian:</strong> ${pickup_time}</p>
      <p><strong>${stars || '—'} Đánh giá:</strong> ${star_label || 'Không chọn sao'}</p>
      <p><strong>📝 Nhận xét:</strong> ${feedback_text || 'Không có nhận xét'}</p>
    </div>`;

  const mailOptions = {
    from: `"App Đón Bạn" <${SMTP_CONFIG.auth.user}>`,
    to: SMTP_CONFIG.to,
    subject: `💬 Feedback từ ${name} — ${stars || 'Không sao'}`,
    html: htmlBody,
    attachments: photo_base64 ? [{
      filename: 'feedback-photo.jpg',
      content: photo_base64.split(',')[1],
      encoding: 'base64'
    }] : []
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Lỗi gửi feedback email:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
    res.status(200).json({ success: true });
  });
});

// Serve index.html cho mọi route còn lại từ thư mục public
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Khởi chạy server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});

module.exports = app;

