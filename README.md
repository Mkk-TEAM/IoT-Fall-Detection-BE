# IoT Fall Detection Backend

Backend cho đồ án **Hệ thống phát hiện té ngã trong nhà cho người cao tuổi**. Hệ thống hỗ trợ MVP dùng **IMU + Camera + Gateway**, cho phép đăng ký/đăng nhập, phân quyền, quản lý gateway/thiết bị, lưu telemetry IMU, tạo cảnh báo té ngã/bất thường, gửi cảnh báo qua email, xem lịch sử và tạo phiên stream camera.

## 1. Công nghệ sử dụng

- Node.js + Express 5
- PostgreSQL
- Prisma ORM 7
- JWT authentication
- bcrypt password hashing
- Nodemailer email OTP / alert email
- Swagger UI

## 2. Cấu trúc thư mục

```text
.
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── scripts/
│   └── createAdmin.js
├── src/
│   ├── app.js
│   ├── common/
│   ├── config/
│   ├── controllers/
│   ├── helpers/
│   ├── jobs/
│   ├── loaders/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── utils/
├── server.js
├── package.json
├── prisma.config.ts
├── .env.example
└── .gitignore
```

## 3. Yêu cầu môi trường

- Node.js 20 trở lên
- npm 10 trở lên
- PostgreSQL 14 trở lên

Kiểm tra:

```bash
node -v
npm -v
psql --version
```

## 4. Cài đặt

```bash
npm install
cp .env.example .env
```

Chỉnh file `.env` theo máy của bạn. Với PostgreSQL local không password trên macOS, ví dụ:

```env
DATABASE_URL="postgresql://nguyennhathuy@127.0.0.1:5432/dadn_db?schema=public"
```

Tạo database:

```bash
createdb -h 127.0.0.1 -p 5432 dadn_db
```

Chạy migration và generate Prisma client:

```bash
npm run db:deploy
npm run db:generate
```

Tạo tài khoản admin ban đầu:

```bash
npm run seed:admin
```

Chạy server:

```bash
npm run dev
```

Hoặc:

```bash
npm start
```

## 5. URL quan trọng

- Health check: `GET http://localhost:3000/health`
- API base URL: `http://localhost:3000/api/v1`
- Swagger UI: `http://localhost:3000/swagger/api`

## 6. Biến môi trường chính

```env
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173
DATABASE_URL="postgresql://user:password@127.0.0.1:5432/dadn_db?schema=public"
SALT_ROUNDS=10
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
EMAIL_ENABLED=false
EMAIL_USER=
EMAIL_APP_PASSWORD=
OTP_EXPIRES_IN_MINUTES=5
OTP_RESEND_INTERVAL_SECONDS=60
STREAM_SESSION_TTL_SECONDS=300
STUN_URL=stun:stun.l.google.com:19302
```

Khi `EMAIL_ENABLED=false`, hệ thống không gửi email thật mà log OTP ra terminal để test nhanh.

## 7. API đã hoàn thiện trong MVP backend

### Auth

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/auth/register/otp` | Gửi OTP đăng ký qua email |
| POST | `/api/v1/auth/register` | Đăng ký tài khoản caregiver |
| POST | `/api/v1/auth/login` | Đăng nhập và nhận JWT |
| GET | `/api/v1/auth/me` | Lấy thông tin người dùng hiện tại |
| POST | `/api/v1/auth/forgot-password/verify` | Gửi OTP đặt lại mật khẩu |
| POST | `/api/v1/auth/forgot-password/reset` | Đặt lại mật khẩu |

### Gateway

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/gateways` | Lấy danh sách gateway |
| GET | `/api/v1/gateways/:gatewayId` | Lấy chi tiết gateway |
| POST | `/api/v1/gateways` | Tạo gateway |
| PUT | `/api/v1/gateways/:gatewayId` | Cập nhật gateway |
| PATCH | `/api/v1/gateways/:gatewayId/heartbeat` | Cập nhật heartbeat gateway |
| DELETE | `/api/v1/gateways/:gatewayId` | Xóa gateway |

### Device

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/devices` | Lấy danh sách IMU/Camera |
| GET | `/api/v1/devices/status` | Lấy trạng thái thiết bị |
| GET | `/api/v1/devices/:deviceId` | Lấy chi tiết thiết bị |
| POST | `/api/v1/devices` | Thêm thiết bị |
| PUT | `/api/v1/devices/:deviceId` | Cập nhật thiết bị |
| PATCH | `/api/v1/devices/:deviceId/heartbeat` | Cập nhật heartbeat thiết bị |
| PATCH | `/api/v1/devices/:deviceId/disable` | Vô hiệu hóa thiết bị |
| DELETE | `/api/v1/devices/:deviceId` | Xóa thiết bị |

### Permission

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/permissions` | Lấy danh sách phân quyền |
| POST | `/api/v1/permissions` | Gán/cập nhật quyền user-device |
| PUT | `/api/v1/permissions/:permissionId` | Cập nhật quyền |
| DELETE | `/api/v1/permissions/:permissionId` | Thu hồi quyền |

### Threshold

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/thresholds` | Lấy ngưỡng hiện tại |
| PUT | `/api/v1/thresholds` | Admin cập nhật ngưỡng |

### Telemetry / Health log

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/health-logs` | Lưu telemetry IMU |
| GET | `/api/v1/health-logs` | Truy vấn dữ liệu IMU |

### Event / Alert

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/events` | Tạo sự kiện cảnh báo |
| GET | `/api/v1/events` | Lấy danh sách sự kiện |
| GET | `/api/v1/events/:eventId` | Lấy chi tiết sự kiện |
| PATCH | `/api/v1/events/:eventId/status` | Cập nhật trạng thái sự kiện |

Alias `/api/v1/alerts` cũng trỏ về cùng module với `/events`.

### Notification

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/v1/notifications/logs` | Xem lịch sử gửi cảnh báo |
| POST | `/api/v1/notifications/alerts/:eventId/send` | Gửi cảnh báo qua email |
| GET | `/api/v1/alert-delivery-logs` | Alias xem log gửi cảnh báo |

### Stream

| Method | Endpoint | Mô tả |
|---|---|---|
| POST | `/api/v1/streams/sessions` | Tạo phiên stream camera WebRTC signaling |
| DELETE | `/api/v1/streams/sessions/:sessionId` | Kết thúc phiên stream |

## 8. Response format

Thành công:

```json
{
  "success": true,
  "data": {},
  "message": "Request processed successfully"
}
```

Có phân trang:

```json
{
  "success": true,
  "data": [],
  "message": "Lấy danh sách thành công.",
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 100
  }
}
```

Lỗi:

```json
{
  "success": false,
  "error": {
    "code": "DEVICE_NOT_FOUND",
    "message": "Thiết bị không tồn tại."
  }
}
```

## 9. Luồng test nhanh bằng Postman/cURL

### 9.1. Tạo admin

```bash
npm run seed:admin
```

### 9.2. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"0900000000","password":"StrongPass@123"}'
```

Lưu `accessToken` vào biến `TOKEN`.

### 9.3. Tạo gateway

```bash
curl -X POST http://localhost:3000/api/v1/gateways \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"gatewayId":"gw_001","displayName":"Gateway phòng khách","ipAddress":"192.168.1.20"}'
```

### 9.4. Tạo IMU và camera

```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_imu_01","deviceType":"IMU","gatewayId":"gw_001","displayName":"IMU đeo tay","location":"Phòng khách"}'

curl -X POST http://localhost:3000/api/v1/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_cam_01","deviceType":"CAMERA","gatewayId":"gw_001","displayName":"Camera phòng khách","location":"Phòng khách","status":"ONLINE"}'
```

### 9.5. Gửi telemetry IMU

```bash
curl -X POST http://localhost:3000/api/v1/health-logs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"dev_imu_01","timestamp":"2026-06-08T03:00:00.000Z","accel":{"x":0.12,"y":2.81,"z":8.91},"gyro":{"x":0.01,"y":0.12,"z":0.03},"tiltAngle":63.5,"batteryLevel":78}'
```

### 9.6. Tạo cảnh báo té ngã

```bash
curl -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"FALL","deviceId":"dev_imu_01","confidence":0.86,"message":"Phát hiện nghi ngờ té ngã"}'
```

## 10. Ghi chú phạm vi

Backend này hoàn thiện phần REST API, database, authentication, authorization, email OTP và mô phỏng stream session cho MVP. MQTT consumer, Socket.io realtime và WebRTC media relay thật chưa được bật vì package hiện tại chưa có dependency `mqtt`/`socket.io` và gateway/camera thật chưa tích hợp. Các API và schema đã chuẩn bị sẵn để bổ sung các adapter này ở bước sau.
