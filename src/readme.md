# DADN Backend API & Source Guide

Tài liệu này mô tả cấu trúc source trong `src/` và các API đã triển khai cho backend hệ thống phát hiện té ngã người cao tuổi.

## 1. Luồng kiến trúc source

```text
Route -> Middleware -> Controller -> Service -> Prisma -> PostgreSQL
```

- `routes/`: khai báo endpoint và middleware.
- `middleware/`: JWT, role guard, device permission guard, rate limit.
- `controllers/`: nhận request, gọi service, trả response.
- `services/`: xử lý nghiệp vụ chính.
- `loaders/`: khởi tạo database, route, Swagger, error handler.
- `helpers/`: chuẩn hóa response/error/security helper.
- `config/`: đọc env và cấu hình email.
- `jobs/`: tác vụ dọn dữ liệu hết hạn.

## 2. Cấu trúc thư mục

```text
src/
├── app.js
├── common/
│   └── enums.js
├── config/
│   ├── emailService.js
│   └── env.js
├── controllers/
├── helpers/
├── jobs/
├── loaders/
├── middleware/
├── routes/
├── services/
└── utils/
```

## 3. API prefix

Tất cả API nghiệp vụ dùng prefix:

```text
/api/v1
```

Swagger UI:

```text
/swagger/api
```

Health check không dùng prefix:

```text
GET /health
```

## 4. Authentication

JWT được gửi qua header:

```http
Authorization: Bearer <accessToken>
```

Middleware chính:

- `verifyToken`: kiểm tra JWT và gắn `req.user`.
- `requireRole(...roles)`: kiểm tra role `admin` hoặc `caregiver`.
- `requireDeviceAccess({ permission })`: kiểm tra quyền theo `Permission`.

## 5. Model chính

- `User`: người chăm sóc/admin.
- `Gateway`: thiết bị trung tâm tại nhà người cao tuổi.
- `Device`: IMU, Camera.
- `Permission`: quyền user-device.
- `HealthLog`: dữ liệu IMU/telemetry.
- `Event`: cảnh báo té ngã/bất động/mất kết nối.
- `ThresholdConfig`: ngưỡng cảnh báo.
- `AlertDeliveryLog`: lịch sử gửi cảnh báo.
- `OtpLog`: OTP đăng ký/đặt lại mật khẩu.

## 6. Mapping API với use case

| Use case | Module/API |
|---|---|
| UC-03 Gateway gửi dữ liệu lên server | `health-logs`, `gateways/:id/heartbeat`, `devices/:id/heartbeat` |
| UC-04 Đăng ký/đăng nhập | `auth` |
| UC-05 Phát hiện té ngã | `events` |
| UC-06 Không di chuyển | `events`, `thresholds` |
| UC-07 Mất kết nối | heartbeat + `events` |
| UC-08 Tạo/lưu cảnh báo | `events` |
| UC-09 Gửi cảnh báo | `notifications`, `alert-delivery-logs` |
| UC-10 Xem camera realtime | `streams/sessions` |
| UC-11 Lịch sử sự kiện | `events` |
| UC-12 Quản lý thiết bị | `devices`, `gateways` |
| UC-13 Phân quyền | `permissions` |
| UC-14 Trạng thái thiết bị | `devices/status` |
| UC-15 Cấu hình ngưỡng | `thresholds` |

## 7. Quy ước response

Thành công:

```json
{
  "success": true,
  "data": {},
  "message": "..."
}
```

Lỗi:

```json
{
  "success": false,
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

## 8. Lưu ý phát triển tiếp

- MQTT consumer nên tạo mới trong `src/services/mqtt.service.js` hoặc `src/loaders/mqtt.js` khi thêm dependency `mqtt`.
- Socket.io realtime nên tạo trong `src/loaders/socket.js` khi server chuyển từ `app.listen` sang `http.createServer(app)`.
- WebRTC hiện mới có session/signaling metadata; media relay thật cần tích hợp gateway/camera.
