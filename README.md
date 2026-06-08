# DADN Backend - Hệ thống phát hiện té ngã cho người cao tuổi

Backend cho đồ án **IoT Fall Detection**: hệ thống giám sát người cao tuổi trong phòng khoảng 25m², sử dụng dữ liệu **IMU + Camera** qua **Gateway** để phát hiện té ngã, bất động, mất kết nối, tạo cảnh báo và hỗ trợ người chăm sóc theo dõi từ xa.

Tài liệu này dùng cho thư mục gốc dự án, tập trung vào cài đặt, cấu hình, chạy server, Prisma/PostgreSQL và quy trình phát triển backend.

---

## 1. Tổng quan hệ thống

Luồng dữ liệu chính của MVP:

```text
IMU --Bluetooth--> Gateway --WiFi/Internet--> Backend API/Event Service --> PostgreSQL
Camera ----------> Gateway ------------------> Streaming/WebRTC Service ----> Web Dashboard
Backend ---------> SMS/Email Provider --------> Người chăm sóc
Backend ---------> Socket.io -----------------> Web Dashboard realtime
```

Các nhóm chức năng backend cần hỗ trợ:

- Xác thực người dùng bằng JWT.
- Đăng ký/đăng nhập tài khoản người chăm sóc hoặc quản trị viên.
- Quản lý gateway, IMU, camera và trạng thái thiết bị.
- Lưu dữ liệu vận động/health log từ IMU.
- Tạo và lưu cảnh báo té ngã, bất động, mất kết nối.
- Gửi cảnh báo qua email/SMS tùy cấu hình.
- Phân quyền người dùng theo gateway/thiết bị.
- Cung cấp API cho Web Dashboard.
- Chuẩn bị mở rộng MQTT, Socket.io và WebRTC signaling.

---

## 2. Công nghệ sử dụng

| Nhóm | Công nghệ |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT, bcrypt |
| Email/OTP | Nodemailer |
| API document | Swagger UI / swagger-jsdoc |
| Dev tool | Nodemon, dotenv-cli |

Dự án hiện dùng **ES Module**, vì vậy cú pháp import/export được bật bằng:

```json
"type": "module"
```

---

## 3. Yêu cầu môi trường

Khuyến nghị:

- Node.js `>= 20.19` hoặc Node.js `>= 22.12` để tương thích tốt với Prisma 7.
- npm `>= 10`.
- PostgreSQL `>= 14`.
- Git.

Kiểm tra nhanh:

```bash
node -v
npm -v
psql --version
```

---

## 4. Cấu trúc thư mục đề xuất

```text
DADN-BE/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app.js
│   ├── common/
│   ├── config/
│   ├── controllers/
│   ├── helpers/
│   ├── jobs/
│   ├── loaders/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── readme.md
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
├── README.md
└── server.js
```

Vai trò các file chính:

| File | Vai trò |
|---|---|
| `server.js` | Entry point, nạp biến môi trường, gọi loaders, mở port server |
| `src/app.js` | Khởi tạo Express app, middleware chung, health check |
| `src/loaders/index.js` | Nơi gom các loader như route, swagger, database, mqtt, socket |
| `prisma/schema.prisma` | Định nghĩa model Prisma |
| `prisma.config.ts` | Cấu hình đường dẫn Prisma schema/migration và datasource |
| `src/readme.md` | Tài liệu API, source convention và module backend |

---

## 5. Cài đặt dependencies

Tại thư mục gốc dự án:

```bash
npm install
```

---

## 6. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc dự án:

```env
# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# PostgreSQL
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/dadn_db?schema=public"

# Authentication
SALT_ROUNDS=10
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1h

# Email / OTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM="DADN Fall Detection <your_email@gmail.com>"
OTP_EXPIRES_MINUTES=5

# Optional - Swagger
SWAGGER_ENABLED=true
SWAGGER_PATH=/swagger/api

# Optional - Realtime / IoT future extension
MQTT_URL=mqtt://localhost:1883
SOCKET_CORS_ORIGIN=http://localhost:5173
```

Lưu ý:

- Không commit file `.env` lên Git.
- Nếu mật khẩu database có ký tự đặc biệt như `@`, `#`, `%`, hãy URL encode trước khi đưa vào `DATABASE_URL`.
- Với Gmail, nên dùng **App Password**, không dùng mật khẩu đăng nhập Gmail thông thường.

---

## 7. Chuẩn bị PostgreSQL

Đăng nhập PostgreSQL và tạo database:

```sql
CREATE DATABASE dadn_db;
```

Kiểm tra kết nối:

```bash
psql "postgresql://postgres:your_password@localhost:5432/dadn_db"
```

---

## 8. Khởi tạo database bằng Prisma

Dự án dùng Prisma migration. Với database trống, chạy theo thứ tự:

```bash
npm run db:deploy
npm run db:generate
npm run db:status
```

Nếu đang trong giai đoạn phát triển và cần đồng bộ lại schema từ database hiện có:

```bash
npm run db:pull
npm run db:generate
```

Mở Prisma Studio để xem dữ liệu trực quan:

```bash
npx prisma studio
```

---

## 9. Chạy server

Chạy môi trường phát triển:

```bash
npm run dev
```

Chạy bình thường:

```bash
npm start
```

Khi server chạy thành công:

```text
Server đang chạy tại port: 3000
```

Các URL thường dùng:

| Mục | URL |
|---|---|
| Health check | `GET http://localhost:3000/health` |
| API base | `http://localhost:3000/api/v1` |
| Swagger UI | `http://localhost:3000/swagger/api` |

Health check kỳ vọng:

```json
{
  "message": "System OK"
}
```

---

## 10. Scripts trong package.json

| Lệnh | Chức năng |
|---|---|
| `npm start` | Chạy server bằng Node.js |
| `npm run dev` | Chạy server bằng Nodemon, tự reload khi sửa code |
| `npm run db:pull` | Kéo schema từ database về Prisma schema |
| `npm run db:generate` | Sinh Prisma Client |
| `npm run db:deploy` | Áp dụng migration lên database |
| `npm run db:status` | Kiểm tra trạng thái migration |

---

## 11. Model database hiện tại

Các model chính trong Prisma schema:

| Model | Mục đích |
|---|---|
| `User` | Người dùng hệ thống, gồm người chăm sóc/admin |
| `OtpLogs` | Lưu OTP phục vụ xác thực email/đăng ký/quên mật khẩu |
| `Gateway` | Thiết bị trung gian nhận dữ liệu từ IMU/camera |
| `UserGateway` | Bảng phân quyền người dùng theo gateway |
| `Device` | IMU hoặc camera thuộc một gateway |
| `HealthLog` | Log vận động, snapshot hoặc dữ liệu sức khỏe cơ bản |
| `Alert` | Cảnh báo té ngã, bất động, mất kết nối |

Ghi chú kỹ thuật: trong schema hiện tại có field `lastHearbeat`. Khi trả API cho frontend nên chuẩn hóa thành `lastHeartbeat` để đúng thuật ngữ và dễ đọc hơn. Nếu sửa schema sau này, cần tạo migration đổi tên field cẩn thận để không mất dữ liệu.

---

## 12. Quy ước response API

Response thành công:

```json
{
  "success": true,
  "data": {},
  "message": "Request processed successfully"
}
```

Response lỗi:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu đầu vào không hợp lệ"
  }
}
```

HTTP status nên dùng:

| Status | Ý nghĩa |
|---|---|
| `200` | Thành công |
| `201` | Tạo mới thành công |
| `400` | Request sai định dạng |
| `401` | Chưa đăng nhập hoặc token sai |
| `403` | Không có quyền |
| `404` | Không tìm thấy tài nguyên |
| `409` | Trùng dữ liệu |
| `422` | Sai nghiệp vụ |
| `500` | Lỗi server |

---

## 13. Quy trình phát triển backend

1. Tạo branch riêng cho chức năng.
2. Nếu thay đổi database, sửa `prisma/schema.prisma`.
3. Tạo migration mới:

```bash
npx prisma migrate dev --name <ten_migration>
```

4. Sinh lại Prisma Client:

```bash
npm run db:generate
```

5. Viết controller/service/route tương ứng.
6. Kiểm tra API bằng Postman/Swagger.
7. Không commit `.env`, `node_modules`, log, file upload, cache.

---

## 14. Các module cần hoàn thiện theo MVP

| Module | Trạng thái nên hoàn thiện |
|---|---|
| Auth | Register, login, JWT middleware, role check |
| Email/OTP | Gửi OTP, verify OTP, lưu OtpLogs, xóa OTP hết hạn |
| User/Gateway permission | Gán quyền user theo gateway/device |
| Device | CRUD thiết bị, cập nhật trạng thái online/offline |
| HealthLog | Nhận/lưu dữ liệu IMU từ gateway |
| Alert | Tạo cảnh báo, xem lịch sử, cập nhật trạng thái |
| Threshold | Cấu hình ngưỡng gia tốc, bất động, mất kết nối |
| Realtime | Socket.io đẩy cảnh báo và trạng thái thiết bị |
| IoT | MQTT consumer nhận telemetry/candidate event |
| Stream | WebRTC signaling session cho camera realtime |

---

## 15. Sự cố thường gặp

### Không kết nối được PostgreSQL

Kiểm tra:

- PostgreSQL đã chạy chưa.
- Database đã được tạo chưa.
- `DATABASE_URL` đúng user/password/host/port/database chưa.
- Mật khẩu có ký tự đặc biệt đã URL encode chưa.

### Prisma generate/migrate lỗi

Chạy:

```bash
npm run db:status
npm run db:generate
```

Nếu lỗi do phiên bản Node.js, kiểm tra lại Node có tương thích với Prisma 7 không.

### Không gửi được email OTP

Kiểm tra:

- `EMAIL_USER` đúng chưa.
- `EMAIL_APP_PASSWORD` đúng chưa.
- Tài khoản Gmail đã bật 2FA và tạo App Password chưa.
- Môi trường mạng có chặn SMTP không.

### API trả 404

Trong `server.js`, middleware 404 được đăng ký sau khi loaders chạy. Nếu route không được tìm thấy, kiểm tra:

- Route đã được import trong `src/loaders/index.js` chưa.
- Prefix `/api/v1` có đúng không.
- Method và path trên Postman có khớp không.

---

## 16. Checklist trước khi nộp/demo

- [ ] Server chạy được bằng `npm run dev`.
- [ ] `/health` trả về `System OK`.
- [ ] Prisma migration chạy thành công trên database trống.
- [ ] Register/login hoạt động.
- [ ] JWT middleware bảo vệ được API riêng tư.
- [ ] Gửi OTP/email hoạt động hoặc có mock provider rõ ràng.
- [ ] CRUD device/gateway hoạt động.
- [ ] Tạo và xem alert hoạt động.
- [ ] Có Swagger hoặc tài liệu API trong `src/readme.md`.

---

## 17. Tài liệu liên quan

- `src/readme.md`: tài liệu API, module backend và convention triển khai.
- `prisma/schema.prisma`: thiết kế database hiện tại.
- `prisma/migrations`: lịch sử thay đổi database.
