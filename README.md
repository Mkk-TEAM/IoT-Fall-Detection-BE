# DADN Backend

Tài liệu này hướng dẫn cài đặt và khởi chạy backend DADN (Node.js + Express + Prisma) trên môi trường phát triển, với tình huống cơ sở dữ liệu PostgreSQL ban đầu chưa có bảng.

## 1. Mục tiêu triển khai

Sau khi hoàn thành các bước trong tài liệu, hệ thống sẽ:

- Kết nối được PostgreSQL qua biến môi trường.
- Áp dụng migration Prisma để tạo đầy đủ bảng cần thiết.
- Khởi chạy API thành công trên máy cục bộ.

## 2. Điều kiện tiên quyết

- Node.js phiên bản 20 trở lên (khuyến nghị bản LTS).
- npm phiên bản 10 trở lên.
- PostgreSQL phiên bản 14 trở lên.

Kiểm tra nhanh phiên bản đã cài:

```bash
node -v
npm -v
psql --version
```

## 3. Cài đặt mã nguồn

Tại thư mục gốc dự án, cài đặt dependencies:

```bash
npm install
```

## 4. Chuẩn bị cơ sở dữ liệu PostgreSQL

Tạo mới một database trống (ví dụ: dadn_db) trước khi chạy migration.

Ví dụ bằng psql:

```sql
CREATE DATABASE dadn_db;
```

## 5. Cấu hình biến môi trường

Tạo file .env tại thư mục gốc dự án với nội dung tham khảo:

```env
PORT=3000

# PostgreSQL
DATABASE_URL="postgresql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>?schema=<DB_SCHEMA>"

# Authentication
SALT_ROUNDS=10
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1h

# OTP Email (Gmail App Password)
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
```

Lưu ý khi cấu hình DATABASE_URL:

- Thay đầy đủ các placeholder bằng thông tin kết nối thực tế.
- DB_NAME cần đúng với database đã tạo ở Bước 4.
- Nếu mật khẩu có ký tự đặc biệt như @, #, %, cần URL encode trước khi đưa vào chuỗi kết nối.

## 6. Khởi tạo schema bằng Prisma migration

Dự án đã có sẵn migration trong thư mục prisma/migrations. Với database trống, thực hiện theo thứ tự:

1. Áp dụng migration:

```bash
npm run db:deploy
```

2. Sinh Prisma Client:

```bash
npm run db:generate
```

3. Kiểm tra trạng thái migration:

```bash
npm run db:status
```

## 7. Khởi chạy hệ thống

Môi trường phát triển (tự động reload):

```bash
npm run dev
```

Môi trường chạy thông thường:

```bash
npm start
```

Khi khởi chạy thành công, có thể truy cập:

- API base URL: http://localhost:3000
- Swagger UI: http://localhost:3000/swagger/api

## 8. Các lệnh vận hành thường dùng

Kéo schema từ database hiện tại:

```bash
npm run db:pull
```

Sinh lại Prisma Client:

```bash
npm run db:generate
```

## 9. Sự cố thường gặp

- Không kết nối được database:
    - Kiểm tra lại DATABASE_URL, tài khoản PostgreSQL, host, port và tên database.

- Migration không chạy đúng:
    - Chạy npm run db:status để kiểm tra trạng thái migration hiện tại.
    - Đảm bảo database mục tiêu là môi trường phù hợp (development).

- Không gửi được OTP qua email:
    - Kiểm tra EMAIL_USER và EMAIL_APP_PASSWORD.
    - Với Gmail, cần dùng App Password thay cho mật khẩu đăng nhập thông thường.
