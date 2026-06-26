# 🐱 Ứng dụng Điểm Đón Bạn ("Cat Pickup App")

Ứng dụng web dễ thương dành cho bạn bè của bạn để gửi thông tin định vị, thời gian đón và lời nhắn trực tiếp về server hoặc Telegram của bạn. Giao diện được thiết kế hiện đại, ngộ nghĩnh (Glassmorphism, hiệu ứng mèo & dấu chân bay, album ảnh mèo cưng tự thêm) và tối ưu hoàn hảo cho điện thoại di động.

---

## 📸 Cách thêm ảnh mèo của bạn
Hãy lưu các tệp ảnh mèo của bạn với tên là `cat1.jpg`, `cat2.jpg`, và `cat3.jpg` trực tiếp vào thư mục dự án này. 
Trang web sẽ tự động nhận diện và hiển thị chúng trên album ảnh ở đầu trang! Nếu chưa có tệp ảnh local, khung album ảnh sẽ tự động ẩn đi để giao diện gọn gàng nhất.

---

## 📂 Cấu trúc dự án

- `index.html`: Giao diện chính chứa album ảnh mèo (khi được tự thêm), form điền thông tin và bản đồ Leaflet.
- `style.css`: Thiết kế CSS giao diện tông màu ấm áp (mèo cam/kem), các hiệu ứng bay nhảy dễ thương.
- `app.js`: Xử lý logic bản đồ, tự động gợi ý địa điểm, Geolocation và gửi dữ liệu đi.
- `config.js`: File cấu hình phương thức gửi (API server hoặc Telegram) và các link liên quan.
- `server.js`: Server Express (Node.js) nhận request khi bạn bè bấm gửi thông tin (nếu bạn dùng server riêng).
- `package.json`: Chứa các thư viện phụ thuộc của server.

---

## 🛠️ Hướng dẫn cài đặt & Chạy dưới local

### 1. Chạy Frontend (Giao diện web)
Bạn chỉ cần mở trực tiếp file `index.html` bằng trình duyệt (Chrome, Safari, Edge) hoặc sử dụng extension như **Live Server** trong VS Code để chạy.

### 2. Chạy Backend (Server nhận dữ liệu)
Nếu bạn chọn gửi dữ liệu về server của bạn (mặc định cấu hình trong `config.js` là `custom_api`):
1. Đảm bảo máy tính của bạn đã cài đặt [Node.js](https://nodejs.org/).
2. Mở terminal tại thư mục này và chạy lệnh cài đặt thư viện:
   ```bash
   npm install
   ```
3. Chạy server bằng lệnh:
   ```bash
   npm start
   ```
   *Mặc định server sẽ chạy tại địa chỉ: `http://localhost:5000`*

---

## 🚀 Hướng dẫn deploy cả Frontend & Backend lên internet

Để ứng dụng hoạt động đầy đủ trên internet (bạn gửi link web cho bạn bè, họ điền thông tin và mail tự động gửi về Gmail của bạn qua SMTP), chúng ta sẽ deploy:
1. **Frontend (Giao diện web):** Deploy miễn phí lên **GitHub Pages**.
2. **Backend (Server Express gửi mail):** Deploy miễn phí lên **Render.com** (hoặc Vercel/Fly.io).

Cả hai dịch vụ này sẽ sử dụng chung **một repository trên GitHub** của bạn.

---

### Bước 1: Đẩy toàn bộ dự án lên GitHub
*Lưu ý quan trọng:* Vì bạn có điền thông tin đăng nhập SMTP của Gmail vào `server.js`, hãy đặt repository của bạn ở chế độ **Private (Riêng tư)** trên GitHub để tránh lộ thông tin này ra công cộng.

1. **Khởi tạo và đẩy code lên GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Deploy Pickup App and SMTP Server"
   git branch -M main
   git remote add origin https://github.com/TÊN_GITHUB_CỦA_BẠN/TÊN_REPO.git
   git push -u origin main
   ```

---

### Bước 2: Deploy Backend lên Render.com (Miễn phí)
1. Truy cập vào trang [Render.com](https://render.com/) và đăng nhập (bạn có thể đăng nhập nhanh bằng tài khoản GitHub).
2. Tại dashboard của Render, bấm nút **New +** -> Chọn **Web Service**.
3. Kết nối với tài khoản GitHub và chọn repository dự án của bạn vừa tạo ở Bước 1.
4. Cấu hình dịch vụ:
   - **Name:** Đặt tên bất kỳ (Ví dụ: `dia-diem-don-server`).
   - **Language:** Chọn `Node`.
   - **Region:** Chọn khu vực gần Việt Nam nhất (ví dụ: `Singapore` hoặc `Oregon`).
   - **Branch:** Chọn `main`.
   - **Build Command:** Nhập `npm install`.
   - **Start Command:** Nhập `npm start`.
   - **Instance Type:** Chọn gói **Free** (Miễn phí).
5. **(Tùy chọn bảo mật cao):** Nếu không muốn để lộ mật khẩu trong code, bạn có thể click vào mục **Advanced** -> Bấm **Add Environment Variable** để thiết lập các biến môi trường che giấu thông tin:
   - `SMTP_USER` = `Gmail_của_bạn@gmail.com`
   - `SMTP_PASS` = `Mật_khẩu_ứng_dụng_16_ký_tự`
6. Bấm **Create Web Service** ở cuối trang. Đợi khoảng 2-3 phút để Render cài đặt và chạy server của bạn.
7. Khi deploy xong, Render sẽ cấp cho bạn một đường link HTTPS ở góc trên bên trái, dạng:
   `https://dia-diem-don-server.onrender.com`
   *(Hãy copy đường link này để dùng ở Bước 3)*.

---

### Bước 3: Cập nhật link Server trong Frontend
1. Mở file `config.js` trong dự án của bạn dưới local.
2. Cập nhật biến `SERVER_URL` trỏ đến link server Render của bạn (nhớ giữ nguyên đuôi `/api/pickup`):
   ```javascript
   SERVER_URL: 'https://dia-diem-don-server.onrender.com/api/pickup',
   ```
3. Lưu file `config.js` lại và đẩy bản cập nhật này lên GitHub:
   ```bash
   git add config.js
   git commit -m "Update SERVER_URL to Render deployment"
   git push origin main
   ```

---

### Bước 4: Kích hoạt GitHub Pages (Frontend)
1. Truy cập vào repository dự án của bạn trên GitHub.
2. Chọn mục **Settings (Cài đặt)** -> Chọn mục **Pages** ở danh sách menu bên trái.
3. Tại phần **Build and deployment** -> **Branch**, chọn nhánh `main` (hoặc `master`) và thư mục `/ (root)`.
4. Bấm **Save**.
5. Đợi khoảng 1 phút, F5 tải lại trang bạn sẽ thấy GitHub cung cấp đường link web của bạn, dạng:
   `https://TÊN_GITHUB_CỦA_BẠN.github.io/TÊN_REPO/`

Bây giờ, bạn chỉ cần copy link này gửi cho bạn bè! Khi họ nhập địa chỉ đón, dữ liệu sẽ được gửi tới server Render, và server Render sẽ gửi SMTP email thông báo về Gmail của bạn ngay lập tức! 🎉 🐱🚗
