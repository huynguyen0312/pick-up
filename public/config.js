// Cấu hình cho ứng dụng đón người yêu / bạn bè
const CONFIG = {
  // Phương thức gửi dữ liệu: 'custom_api', 'email' hoặc 'telegram'
  // - 'custom_api': Gửi POST về server riêng của bạn (server sẽ gửi SMTP Gmail bằng Nodemailer)
  // - 'email': Gửi email trực tiếp bằng Web3Forms (không cần chạy server backend)
  // - 'telegram': Gửi tin nhắn trực tiếp về Telegram của bạn
  DELIVERY_METHOD: 'custom_api',

  // 1. Cấu hình gửi Email về Gmail (chỉ dùng nếu chọn DELIVERY_METHOD: 'email')
  // Lấy Access Key miễn phí tại: https://web3forms.com
  WEB3FORMS_ACCESS_KEY: 'YOUR_WEB3FORMS_ACCESS_KEY_HERE',

  // 2. Cấu hình cho Custom API Server
  // Tự động dùng cùng origin khi deploy (Render), fallback về localhost khi chạy local
  SERVER_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000/api/pickup'
    : window.location.origin + '/api/pickup',

  // 3. Cấu hình Telegram (chỉ dùng nếu chọn DELIVERY_METHOD: 'telegram')
  TELEGRAM_BOT_TOKEN: 'YOUR_TELEGRAM_BOT_TOKEN_HERE',
  TELEGRAM_CHAT_ID: 'YOUR_TELEGRAM_CHAT_ID_HERE',

  // Lời chúc/Thông báo sau khi gửi thành công
  SUCCESS_MESSAGE: 'Đã gửi tọa độ thành công! Chờ mình một chút nhé, mình đang qua đón bạn đây... 🐱'
};

// Đăng ký toàn cục để app.js có thể đọc được
window.APP_CONFIG = CONFIG;
