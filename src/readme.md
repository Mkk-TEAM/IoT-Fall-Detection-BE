# DADN Backend API & Source Guide

Tài liệu này đặt trong thư mục `src/`, dùng để mô tả cấu trúc source backend, convention triển khai và đặc tả API cho hệ thống phát hiện té ngã người cao tuổi.

---

## 1. Mục tiêu backend

Backend chịu trách nhiệm:

- Xác thực và phân quyền người dùng.
- Quản lý người chăm sóc, gateway, IMU, camera.
- Nhận dữ liệu từ gateway/thiết bị.
- Lưu health log và cảnh báo.
- Xử lý hoặc tiếp nhận kết quả phát hiện té ngã/bất thường.
- Gửi cảnh báo qua email/SMS.
- Cung cấp API cho Web Dashboard.
- Chuẩn bị cho realtime qua Socket.io, MQTT và WebRTC signaling.

---

## 2. Kiến trúc thư mục

```text
src/
├── app.js              # Khởi tạo Express app, middleware chung, health check
├── common/             # Constant, enum, response helper, error code
├── config/             # Cấu hình env, database, mail, jwt, swagger, mqtt
├── controllers/        # Nhận req/res, validate sơ bộ, gọi service
├── helpers/            # Hàm tiện ích dùng chung
├── jobs/               # Cron jobs: xóa OTP hết hạn, dọn log/video cũ
├── loaders/            # Nạp database, route, swagger, mqtt, socket
├── middleware/         # Auth, role guard, permission guard, error handler
├── models/             # Prisma client hoặc model mapping
├── routes/             # Định nghĩa endpoint REST
└── services/           # Business logic chính
```

### Quy tắc phân lớp

```text
Route -> Middleware -> Controller -> Service -> Repository/Prisma -> Database
```

- `routes`: chỉ khai báo URL và middleware.
- `controllers`: không viết logic nghiệp vụ phức tạp.
- `services`: xử lý nghiệp vụ chính.
- `middleware`: xác thực, phân quyền, validate, bắt lỗi.
- `config`: không hard-code secret trong source.

---

## 3. API convention

Base URL:

```text
http://localhost:3000/api/v1
```

Header chung:

```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

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
    "code": "DEVICE_NOT_FOUND",
    "message": "Thiết bị không tồn tại"
  }
}
```

HTTP status:

| Status | Ý nghĩa |
|---|---|
| `200` | Request thành công |
| `201` | Tạo mới thành công |
| `400` | Dữ liệu đầu vào sai |
| `401` | Chưa xác thực |
| `403` | Không có quyền |
| `404` | Không tìm thấy |
| `409` | Trùng dữ liệu |
| `422` | Sai nghiệp vụ |
| `500` | Lỗi server |

---

## 4. Health check

### `GET /health`

Kiểm tra server còn hoạt động.

Response:

```json
{
  "message": "System OK"
}
```

---

## 5. Authentication API

### 5.1. Đăng ký tài khoản

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "fullName": "Nguyen Van A",
  "phoneNumber": "0912345678",
  "email": "caregiver@example.com",
  "password": "StrongPass@123"
}
```

Validate:

- `phoneNumber` không được trùng.
- `email` không được trùng.
- `password` phải được hash bằng bcrypt trước khi lưu.
- Mật khẩu nên có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.

Response `201`:

```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0912345678",
    "email": "caregiver@example.com"
  },
  "message": "Đăng ký thành công"
}
```

### 5.2. Đăng nhập

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "phoneNumber": "0912345678",
  "password": "StrongPass@123"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt_access_token",
    "expiresIn": "1h",
    "user": {
      "userID": "uuid",
      "fullName": "Nguyen Van A",
      "phoneNumber": "0912345678",
      "email": "caregiver@example.com"
    }
  },
  "message": "Đăng nhập thành công"
}
```

### 5.3. Lấy thông tin người dùng hiện tại

```http
GET /api/v1/auth/me
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "data": {
    "userID": "uuid",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0912345678",
    "email": "caregiver@example.com"
  }
}
```

### 5.4. Gửi OTP qua email

```http
POST /api/v1/auth/otp/send
```

Request:

```json
{
  "email": "caregiver@example.com",
  "phoneNumber": "0912345678"
}
```

Xử lý đề xuất:

1. Sinh OTP 6 chữ số.
2. Lưu OTP vào bảng `OtpLogs` với thời gian hết hạn.
3. Gửi OTP bằng `nodemailer`.
4. Không trả OTP trong response.

Response:

```json
{
  "success": true,
  "message": "OTP đã được gửi"
}
```

### 5.5. Xác thực OTP

```http
POST /api/v1/auth/otp/verify
```

Request:

```json
{
  "phoneNumber": "0912345678",
  "otp": "123456"
}
```

Response:

```json
{
  "success": true,
  "message": "Xác thực OTP thành công"
}
```

---

## 6. User/Gateway Permission API

Trong schema hiện tại, bảng `UserGateway` quản lý quan hệ người dùng với gateway và role.

Role đề xuất:

| Role | Quyền |
|---|---|
| `admin` | Quản lý gateway, device, phân quyền, cấu hình ngưỡng |
| `caregiver` | Xem trạng thái, camera, lịch sử, xác nhận cảnh báo |
| `viewer` | Chỉ xem dữ liệu được cấp quyền |

### 6.1. Gán gateway cho user

```http
POST /api/v1/permissions/gateways
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "userID": "user_uuid",
  "gatewayID": "gw_001",
  "role": "caregiver"
}
```

Response:

```json
{
  "success": true,
  "message": "Cập nhật quyền truy cập thành công"
}
```

### 6.2. Lấy danh sách quyền

```http
GET /api/v1/permissions?userID=user_uuid&gatewayID=gw_001
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "userID": "user_uuid",
      "gatewayID": "gw_001",
      "role": "caregiver"
    }
  ]
}
```

### 6.3. Thu hồi quyền gateway

```http
DELETE /api/v1/permissions/gateways/:userID/:gatewayID
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "message": "Đã thu hồi quyền truy cập"
}
```

---

## 7. Gateway API

### 7.1. Tạo gateway

```http
POST /api/v1/gateways
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "gatewayID": "gw_001",
  "ipAddress": "192.168.1.20",
  "status": "ONLINE"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "gatewayID": "gw_001",
    "ipAddress": "192.168.1.20",
    "status": "ONLINE",
    "lastHeartbeat": "2026-06-08T02:00:00.000Z"
  },
  "message": "Tạo gateway thành công"
}
```

### 7.2. Lấy danh sách gateway

```http
GET /api/v1/gateways
Authorization: Bearer <JWT_TOKEN>
```

Query params:

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `status` | `ONLINE` | Lọc theo trạng thái |
| `page` | `1` | Trang hiện tại |
| `pageSize` | `10` | Số item/trang |

### 7.3. Cập nhật heartbeat gateway

```http
PATCH /api/v1/gateways/:gatewayID/heartbeat
```

Request:

```json
{
  "ipAddress": "192.168.1.20",
  "status": "ONLINE"
}
```

Response:

```json
{
  "success": true,
  "message": "Heartbeat gateway đã được cập nhật"
}
```

---

## 8. Device API

`Device` đại diện cho IMU hoặc Camera thuộc một gateway.

Device type đề xuất:

- `IMU`
- `CAMERA`
- `GATEWAY`

Device status đề xuất:

- `REGISTERED`
- `ONLINE`
- `OFFLINE`
- `DISABLED`
- `UNKNOWN`

### 8.1. Lấy danh sách thiết bị

```http
GET /api/v1/devices
Authorization: Bearer <JWT_TOKEN>
```

Query params:

| Param | Ví dụ |
|---|---|
| `type` | `IMU` |
| `status` | `ONLINE` |
| `gatewayID` | `gw_001` |
| `page` | `1` |
| `pageSize` | `10` |

Response:

```json
{
  "success": true,
  "data": [
    {
      "deviceID": "dev_imu_01",
      "deviceType": "IMU",
      "gatewayID": "gw_001",
      "status": "ONLINE",
      "location": "Phòng khách",
      "sensitivity": 3,
      "stagnationTime": 300,
      "lastHeartbeat": "2026-06-08T02:00:00.000Z"
    }
  ]
}
```

### 8.2. Tạo thiết bị

```http
POST /api/v1/devices
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "deviceID": "dev_imu_01",
  "deviceType": "IMU",
  "gatewayID": "gw_001",
  "location": "Phòng khách",
  "sensitivity": 3,
  "stagnationTime": 300
}
```

Response:

```json
{
  "success": true,
  "data": {
    "deviceID": "dev_imu_01",
    "deviceType": "IMU",
    "gatewayID": "gw_001",
    "status": "REGISTERED"
  },
  "message": "Thêm thiết bị thành công"
}
```

### 8.3. Cập nhật thiết bị

```http
PUT /api/v1/devices/:deviceID
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "location": "Phòng ngủ",
  "sensitivity": 4,
  "stagnationTime": 420
}
```

### 8.4. Vô hiệu hóa thiết bị

```http
PATCH /api/v1/devices/:deviceID/disable
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "message": "Thiết bị đã được vô hiệu hóa"
}
```

### 8.5. Xóa thiết bị

```http
DELETE /api/v1/devices/:deviceID
Authorization: Bearer <JWT_TOKEN>
```

Điều kiện nên kiểm tra:

- Không xóa thiết bị đang hoạt động.
- Không xóa thiết bị đang có alert/log quan trọng nếu chưa xử lý retention.

---

## 9. Device Status API

### 9.1. Xem trạng thái tất cả thiết bị có quyền

```http
GET /api/v1/devices/status
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "data": [
    {
      "deviceID": "dev_imu_01",
      "deviceType": "IMU",
      "status": "ONLINE",
      "lastHeartbeat": "2026-06-08T02:00:00.000Z"
    },
    {
      "deviceID": "dev_cam_01",
      "deviceType": "CAMERA",
      "status": "OFFLINE",
      "lastHeartbeat": "2026-06-08T01:58:00.000Z"
    }
  ]
}
```

### 9.2. Xem trạng thái một thiết bị

```http
GET /api/v1/devices/:deviceID/status
Authorization: Bearer <JWT_TOKEN>
```

---

## 10. HealthLog / Telemetry API

Dùng để lưu dữ liệu vận động từ IMU hoặc metadata camera. Khi triển khai MQTT, API này có thể được thay bằng MQTT consumer nội bộ.

### 10.1. Gửi log vận động từ gateway

```http
POST /api/v1/health-logs
Authorization: Bearer <GATEWAY_TOKEN hoặc JWT>
```

Request:

```json
{
  "deviceID": "dev_imu_01",
  "logType": "IMU_MOVEMENT",
  "movement": 12,
  "snapshotURL": null,
  "recordedAt": "2026-06-08T02:00:00.000Z"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "logID": 1,
    "deviceID": "dev_imu_01",
    "logType": "IMU_MOVEMENT"
  },
  "message": "Đã lưu health log"
}
```

### 10.2. Truy vấn health log

```http
GET /api/v1/health-logs?deviceID=dev_imu_01&from=2026-06-01&to=2026-06-08
Authorization: Bearer <JWT_TOKEN>
```

---

## 11. Alert/Event API

Alert type đề xuất:

- `FALL`
- `INACTIVITY`
- `DISCONNECT`
- `OUT_OF_RANGE`
- `LOW_BATTERY`

Severity đề xuất:

- `LOW`
- `MEDIUM`
- `HIGH`
- `CRITICAL`

Status đề xuất:

- `UNREAD`
- `VIEWED`
- `CONFIRMED_FALL`
- `FALSE_ALARM`
- `RESOLVED`

### 11.1. Tạo cảnh báo

```http
POST /api/v1/alerts
Authorization: Bearer <GATEWAY_TOKEN hoặc JWT>
```

Request:

```json
{
  "alertType": "FALL",
  "severity": "CRITICAL",
  "status": "UNREAD",
  "deviceID": "dev_imu_01",
  "gatewayID": "gw_001",
  "snapshotURL": "/media/snapshots/alert_001.jpg"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "alertID": 1,
    "alertType": "FALL",
    "severity": "CRITICAL",
    "status": "UNREAD",
    "timestamp": "2026-06-08T02:00:00.000Z"
  },
  "message": "Đã tạo cảnh báo"
}
```

### 11.2. Lấy danh sách cảnh báo

```http
GET /api/v1/alerts
Authorization: Bearer <JWT_TOKEN>
```

Query params:

| Param | Ví dụ |
|---|---|
| `deviceID` | `dev_imu_01` |
| `gatewayID` | `gw_001` |
| `alertType` | `FALL` |
| `severity` | `CRITICAL` |
| `status` | `UNREAD` |
| `from` | `2026-06-01T00:00:00.000Z` |
| `to` | `2026-06-08T23:59:59.000Z` |
| `page` | `1` |
| `pageSize` | `10` |

Response:

```json
{
  "success": true,
  "data": [
    {
      "alertID": 1,
      "alertType": "FALL",
      "severity": "CRITICAL",
      "status": "UNREAD",
      "deviceID": "dev_imu_01",
      "gatewayID": "gw_001",
      "timestamp": "2026-06-08T02:00:00.000Z"
    }
  ]
}
```

### 11.3. Lấy chi tiết cảnh báo

```http
GET /api/v1/alerts/:alertID
Authorization: Bearer <JWT_TOKEN>
```

### 11.4. Cập nhật trạng thái cảnh báo

```http
PATCH /api/v1/alerts/:alertID/status
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "status": "CONFIRMED_FALL"
}
```

Response:

```json
{
  "success": true,
  "message": "Đã cập nhật trạng thái cảnh báo"
}
```

---

## 12. Threshold Configuration API

Hiện tại schema `Device` có `sensitivity` và `stagnationTime`. Khi mở rộng, nên tách thành bảng `ThresholdConfig` riêng.

### 12.1. Lấy cấu hình ngưỡng

```http
GET /api/v1/thresholds?deviceID=dev_imu_01
Authorization: Bearer <JWT_TOKEN>
```

Response:

```json
{
  "success": true,
  "data": {
    "deviceID": "dev_imu_01",
    "sensitivity": 3,
    "stagnationTime": 300,
    "accelerationThreshold": 2.8,
    "disconnectThresholdSeconds": 30
  }
}
```

### 12.2. Cập nhật cấu hình ngưỡng

```http
PUT /api/v1/thresholds/:deviceID
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "sensitivity": 4,
  "stagnationTime": 420,
  "accelerationThreshold": 2.8,
  "disconnectThresholdSeconds": 30
}
```

Response:

```json
{
  "success": true,
  "message": "Cập nhật ngưỡng cảnh báo thành công"
}
```

---

## 13. Notification API

### 13.1. Gửi cảnh báo email/SMS thủ công

```http
POST /api/v1/notifications/alerts/:alertID/send
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "channels": ["EMAIL"],
  "recipients": ["caregiver@example.com"]
}
```

Response:

```json
{
  "success": true,
  "message": "Đã gửi cảnh báo"
}
```

### 13.2. Xem lịch sử gửi cảnh báo

```http
GET /api/v1/notifications/logs?alertID=1&channel=EMAIL
Authorization: Bearer <JWT_TOKEN>
```

Gợi ý mở rộng database: thêm bảng `AlertDeliveryLog` gồm `deliveryLogID`, `alertID`, `channel`, `recipient`, `sentAt`, `deliveryStatus`, `providerMessageID`.

---

## 14. Stream Camera API

Phần này phục vụ xem camera thời gian thực qua WebRTC. Có thể triển khai sau khi hoàn thiện auth/device/permission.

### 14.1. Tạo phiên xem camera

```http
POST /api/v1/streams/sessions
Authorization: Bearer <JWT_TOKEN>
```

Request:

```json
{
  "deviceID": "dev_cam_01"
}
```

Response:

```json
{
  "success": true,
  "data": {
    "sessionID": "stream_001",
    "deviceID": "dev_cam_01",
    "signalingChannel": "stream:stream_001",
    "iceServers": [
      {
        "urls": "stun:stun.l.google.com:19302"
      }
    ],
    "expiresIn": 300
  }
}
```

### 14.2. Kết thúc phiên xem camera

```http
DELETE /api/v1/streams/sessions/:sessionID
Authorization: Bearer <JWT_TOKEN>
```

---

## 15. MQTT topic thiết kế

Khi tích hợp gateway thật, nên dùng MQTT cho telemetry thay vì REST liên tục.

Gateway publish lên server:

```text
gateway/{gatewayID}/telemetry/imu
gateway/{gatewayID}/telemetry/camera-meta
gateway/{gatewayID}/status
gateway/{gatewayID}/event-candidate
```

Server publish xuống gateway:

```text
gateway/{gatewayID}/commands/alert
gateway/{gatewayID}/commands/stream
gateway/{gatewayID}/commands/config-sync
```

Payload IMU đề xuất:

```json
{
  "gatewayID": "gw_001",
  "deviceID": "dev_imu_01",
  "timestamp": "2026-06-08T02:00:00.000Z",
  "accel": {
    "x": 0.12,
    "y": 2.81,
    "z": 8.91
  },
  "gyro": {
    "x": 0.01,
    "y": 0.12,
    "z": 0.03
  },
  "tiltAngle": 63.5,
  "batteryLevel": 78
}
```

Payload candidate event:

```json
{
  "gatewayID": "gw_001",
  "deviceID": "dev_imu_01",
  "timestamp": "2026-06-08T02:00:00.000Z",
  "candidateType": "FALL_SUSPECTED",
  "confidence": 0.86,
  "rawRef": "imu_seq_987654"
}
```

---

## 16. Socket.io realtime event thiết kế

Namespace:

```text
/ws
```

Client -> Server:

| Event | Payload |
|---|---|
| `subscribe.devices` | `{ "deviceIDs": ["dev_imu_01"] }` |
| `subscribe.alerts` | `{ "userID": "uuid" }` |
| `stream.join` | `{ "sessionID": "stream_001" }` |

Server -> Client:

| Event | Mục đích |
|---|---|
| `alert.created` | Đẩy cảnh báo mới |
| `device.status.updated` | Cập nhật trạng thái thiết bị |
| `alert.updated` | Cập nhật trạng thái alert |
| `stream.state.changed` | Cập nhật trạng thái stream |

Payload `alert.created`:

```json
{
  "alertID": 1,
  "alertType": "FALL",
  "timestamp": "2026-06-08T02:00:00.000Z",
  "severity": "CRITICAL",
  "deviceID": "dev_imu_01",
  "message": "Phát hiện nghi ngờ té ngã"
}
```

---

## 17. Middleware cần có

### `authMiddleware`

Nhiệm vụ:

- Đọc `Authorization: Bearer <token>`.
- Verify JWT bằng `JWT_SECRET`.
- Gắn `req.user`.
- Trả `401` nếu token sai/hết hạn.

### `requireRole(...roles)`

Nhiệm vụ:

- Kiểm tra role của user.
- Trả `403` nếu không đủ quyền.

### `requireGatewayAccess(gatewayID)`

Nhiệm vụ:

- Kiểm tra user có quyền với gateway không.
- Dựa vào bảng `UserGateway`.

### `errorHandler`

Nhiệm vụ:

- Gom lỗi về một format response thống nhất.
- Không trả stack trace ở production.

---

## 18. Error code đề xuất

| Code | Khi dùng |
|---|---|
| `VALIDATION_ERROR` | Body/query không hợp lệ |
| `UNAUTHORIZED` | Chưa đăng nhập/token sai |
| `FORBIDDEN` | Không có quyền |
| `USER_NOT_FOUND` | Không tìm thấy user |
| `USER_ALREADY_EXISTS` | Trùng email/số điện thoại |
| `INVALID_CREDENTIALS` | Sai tài khoản/mật khẩu |
| `OTP_INVALID` | OTP sai |
| `OTP_EXPIRED` | OTP hết hạn |
| `GATEWAY_NOT_FOUND` | Không tìm thấy gateway |
| `DEVICE_NOT_FOUND` | Không tìm thấy device |
| `ALERT_NOT_FOUND` | Không tìm thấy alert |
| `DATABASE_ERROR` | Lỗi database |
| `EMAIL_PROVIDER_ERROR` | Lỗi gửi email |

---

## 19. Thứ tự ưu tiên hoàn thiện code

1. Chuẩn hóa response helper và error handler.
2. Hoàn thiện Prisma client loader.
3. Hoàn thiện Auth: register, login, me, JWT middleware.
4. Hoàn thiện Email/OTP service.
5. Hoàn thiện Gateway/Device CRUD.
6. Hoàn thiện UserGateway permission guard.
7. Hoàn thiện Alert và HealthLog API.
8. Thêm Swagger annotation cho từng route.
9. Tích hợp Socket.io cho realtime alert/status.
10. Tích hợp MQTT consumer cho telemetry thật từ gateway.
11. Tích hợp stream session/WebRTC signaling.

---

## 20. Mapping nhanh với use case

| Use case | API/module liên quan |
|---|---|
| UC-03 Gateway gửi dữ liệu lên server | `POST /health-logs`, MQTT telemetry |
| UC-04 Đăng nhập/đăng ký | `/auth/register`, `/auth/login`, `/auth/me` |
| UC-05 Phát hiện té ngã | Event Detection Service, `/alerts` |
| UC-06 Phát hiện bất động | Event Detection Service, `/alerts` |
| UC-07 Mất kết nối | Gateway heartbeat, device status, `/alerts` |
| UC-08 Tạo/lưu cảnh báo | `/alerts` |
| UC-09 Gửi cảnh báo | `/notifications/*` |
| UC-10 Xem camera realtime | `/streams/sessions`, Socket.io/WebRTC |
| UC-11 Xem lịch sử | `GET /alerts`, `GET /alerts/:id` |
| UC-12 Quản lý thiết bị | `/devices` |
| UC-13 Phân quyền | `/permissions` |
| UC-14 Xem trạng thái thiết bị | `/devices/status` |
| UC-15 Cấu hình ngưỡng | `/thresholds` |
