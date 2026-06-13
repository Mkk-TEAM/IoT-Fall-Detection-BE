# DADN Backend API & Source Guide

Tài liệu này đặt trong thư mục `src/`, dùng để mô tả cấu trúc source backend, quy ước triển khai và danh sách API đã có trong backend hệ thống phát hiện té ngã người cao tuổi.

> Lưu ý: Swagger trong bản hiện tại **không viết cho Auth, Gateway và Device** vì các nhóm API này đang được thành viên khác trong nhóm viết lại. Tuy nhiên, README vẫn liệt kê rõ các route hiện có để cả nhóm dễ đối chiếu.

---

## 1. Vai trò của backend

Backend chịu trách nhiệm:

- Xác thực người dùng bằng JWT.
- Gửi và xác thực OTP qua email.
- Phân quyền theo vai trò `admin/caregiver` và theo thiết bị.
- Quản lý gateway, IMU, camera.
- Nhận dữ liệu telemetry/health log từ IMU hoặc gateway.
- Tạo, lưu và truy vấn sự kiện/cảnh báo té ngã, bất động, mất kết nối.
- Lưu lịch sử gửi cảnh báo.
- Tạo phiên xem camera realtime ở mức session metadata.
- Cung cấp REST API cho Web Dashboard.
- Chuẩn bị nền tảng cho MQTT, Socket.io và WebRTC signaling.

---

## 2. Luồng kiến trúc source

```text
Route -> Middleware -> Controller -> Service -> Prisma -> PostgreSQL
```

Quy ước phân lớp:

- `routes/`: khai báo endpoint và middleware.
- `middleware/`: JWT, role guard, device permission guard, rate limit.
- `controllers/`: nhận `req`, gọi service, trả response.
- `services/`: xử lý nghiệp vụ chính.
- `loaders/`: khởi tạo database, route, Swagger, error handler.
- `helpers/`: chuẩn hóa response, error và security helper.
- `config/`: đọc env, cấu hình email và cấu hình hệ thống.
- `jobs/`: tác vụ dọn OTP/log/media hết hạn.
- `utils/`: validate, parse query, parse date, parse pagination.

---

## 3. Cấu trúc thư mục

```text
src/
├── app.js                         # Khởi tạo Express app, middleware chung, health check
├── common/
│   └── enums.js                   # Enum dùng chung cho device, event, role, channel
├── config/
│   ├── emailService.js            # Gửi OTP/cảnh báo email
│   └── env.js                     # Đọc và validate biến môi trường
├── controllers/                   # Controller cho từng module API
├── helpers/                       # Response, error, security helper
├── jobs/                          # Cleanup jobs
├── loaders/
│   ├── dbLoader.js                # Prisma Client + kết nối PostgreSQL
│   ├── express.js                 # Mount API prefix, Swagger, error handler
│   ├── index.js                   # Nạp toàn bộ loader
│   └── swagger.config.js          # Swagger UI/OpenAPI spec
├── middleware/
│   ├── auth.middleware.js         # JWT, role, device permission guard
│   └── rateLimit.middleware.js    # Rate limit đơn giản theo IP/path
├── routes/                        # REST routes
├── services/                      # Business logic
└── utils/
    └── validators.js              # Validate và parse helper
```

---

## 4. API prefix và Swagger

Base URL nghiệp vụ:

```text
/api/v1
```

Health check không dùng prefix:

```http
GET /health
```

Swagger UI:

```text
/swagger/api
```

Swagger hiện có cho các nhóm:

- `Permissions`
- `Thresholds`
- `HealthLogs`
- `Events` / `Alerts`
- `Notifications` / `AlertDeliveryLogs`
- `Streams`

Swagger tạm thời chưa viết cho:

- `Auth`
- `Gateways`
- `Devices`

---

## 5. Authentication và Authorization

JWT gửi qua header:

```http
Authorization: Bearer <accessToken>
```

Middleware chính:

| Middleware | Vai trò |
|---|---|
| `verifyToken` | Kiểm tra JWT, gắn `req.user` |
| `requireRole(...roles)` | Chỉ cho role phù hợp truy cập |
| `canAccessDevice(user, deviceId, permission)` | Kiểm tra quyền user với một thiết bị |
| `requireDeviceAccess({ permission })` | Middleware kiểm tra quyền thiết bị theo `Permission` |

Quyền theo thiết bị:

| Field | Ý nghĩa |
|---|---|
| `canViewCamera` | Được xem camera/stream |
| `canViewHistory` | Được xem lịch sử event/health log |
| `canUpdateEvent` | Được cập nhật trạng thái event |

---

## 6. Quy ước response

Response thành công:

```json
{
  "success": true,
  "data": {},
  "message": "Request processed successfully",
  "meta": {
    "page": 1,
    "pageSize": 10,
    "total": 25
  }
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

HTTP status thường dùng:

| Status | Ý nghĩa |
|---|---|
| `200` | Truy vấn/cập nhật thành công |
| `201` | Tạo mới thành công |
| `400` | Dữ liệu đầu vào sai |
| `401` | Chưa xác thực/JWT sai |
| `403` | Không có quyền |
| `404` | Không tìm thấy tài nguyên |
| `409` | Trùng dữ liệu |
| `429` | Rate limit |
| `500` | Lỗi server |

---

## 7. Danh sách API hiện có

### 7.1. Health check

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/health` | Không | Kiểm tra server còn hoạt động |

---

### 7.2. Auth API

> Nhóm này đang được thành viên khác viết lại Swagger, nên README chỉ liệt kê route hiện có.

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/auth/register/otp` | Không | Gửi OTP đăng ký qua email |
| `POST` | `/api/v1/auth/register` | Không | Đăng ký tài khoản bằng OTP |
| `POST` | `/api/v1/auth/login` | Không | Đăng nhập, nhận access token |
| `GET` | `/api/v1/auth/me` | Bearer token | Lấy thông tin người dùng hiện tại |
| `POST` | `/api/v1/auth/forgot-password/verify` | Không | Kiểm tra số điện thoại và gửi OTP reset password |
| `POST` | `/api/v1/auth/forgot-password/otp` | Không | Alias gửi OTP reset password |
| `POST` | `/api/v1/auth/forgot-password/reset` | Không | Đặt lại mật khẩu bằng OTP |

Body mẫu:

```json
{
  "phoneNumber": "0912345678",
  "email": "caregiver@example.com",
  "password": "StrongPass@123"
}
```

---

### 7.3. Gateway API

> Nhóm này đang được thành viên khác viết lại Swagger, nên README chỉ liệt kê route hiện có.

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/gateways` | Bearer token | Lấy danh sách gateway |
| `GET` | `/api/v1/gateways/:gatewayId` | Bearer token | Lấy chi tiết gateway |
| `POST` | `/api/v1/gateways` | `admin/caregiver` | Tạo gateway |
| `PUT` | `/api/v1/gateways/:gatewayId` | `admin/caregiver` | Cập nhật gateway |
| `PATCH` | `/api/v1/gateways/:gatewayId/heartbeat` | Bearer token | Cập nhật heartbeat/trạng thái gateway |
| `DELETE` | `/api/v1/gateways/:gatewayId` | `admin/caregiver` | Xóa gateway |

---

### 7.4. Device API

> Nhóm này đang được thành viên khác viết lại Swagger, nên README chỉ liệt kê route hiện có.

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/devices/status` | Bearer token | Xem trạng thái các thiết bị có quyền |
| `GET` | `/api/v1/devices` | Bearer token | Lấy danh sách thiết bị |
| `GET` | `/api/v1/devices/:deviceId/status` | Bearer token | Xem trạng thái một thiết bị |
| `GET` | `/api/v1/devices/:deviceId` | Bearer token | Lấy chi tiết thiết bị |
| `POST` | `/api/v1/devices` | `admin/caregiver` | Tạo thiết bị IMU/Camera |
| `PUT` | `/api/v1/devices/:deviceId` | `admin/caregiver` | Cập nhật thiết bị |
| `PATCH` | `/api/v1/devices/:deviceId/heartbeat` | Bearer token | Cập nhật heartbeat/trạng thái thiết bị |
| `PATCH` | `/api/v1/devices/:deviceId/disable` | `admin/caregiver` | Vô hiệu hóa thiết bị |
| `DELETE` | `/api/v1/devices/:deviceId` | `admin/caregiver` | Xóa thiết bị |

---

### 7.5. Permission API

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/permissions` | `admin/caregiver` | Lấy danh sách phân quyền |
| `POST` | `/api/v1/permissions` | `admin/caregiver` | Tạo hoặc cập nhật phân quyền user-device |
| `PUT` | `/api/v1/permissions/:permissionId` | `admin/caregiver` | Cập nhật quyền |
| `DELETE` | `/api/v1/permissions/:permissionId` | `admin/caregiver` | Thu hồi quyền |

Query params `GET /permissions`:

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `userId` | `uuid` | Lọc theo người dùng |
| `deviceId` | `dev_cam_01` | Lọc theo thiết bị |
| `page` | `1` | Trang |
| `pageSize` | `10` | Số bản ghi/trang |

Body `POST /permissions`:

```json
{
  "userId": "user_uuid",
  "deviceId": "dev_cam_01",
  "canViewCamera": true,
  "canViewHistory": true,
  "canUpdateEvent": false
}
```

---

### 7.6. Threshold API

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/thresholds` | Bearer token | Lấy cấu hình ngưỡng hiện tại |
| `PUT` | `/api/v1/thresholds` | `admin` | Cập nhật cấu hình ngưỡng |

Body `PUT /thresholds`:

```json
{
  "accelerationThreshold": 2.8,
  "inactivityThresholdSeconds": 420,
  "disconnectThresholdSeconds": 30
}
```

Ý nghĩa:

| Field | Ý nghĩa |
|---|---|
| `accelerationThreshold` | Ngưỡng gia tốc dùng phát hiện va chạm/té ngã |
| `inactivityThresholdSeconds` | Thời gian bất động tối đa |
| `disconnectThresholdSeconds` | Thời gian mất heartbeat trước khi xem là mất kết nối |

---

### 7.7. HealthLog API

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/health-logs` | Bearer token | Truy vấn dữ liệu vận động/IMU log |
| `POST` | `/api/v1/health-logs` | `admin/caregiver` | Tạo health log từ telemetry IMU |

Query params `GET /health-logs`:

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `deviceId` | `dev_imu_01` | Lọc theo thiết bị IMU |
| `from` | `2026-06-08T00:00:00.000Z` | Từ thời điểm |
| `to` | `2026-06-08T23:59:59.000Z` | Đến thời điểm |
| `page` | `1` | Trang |
| `pageSize` | `10` | Số bản ghi/trang |

Body `POST /health-logs`:

```json
{
  "deviceId": "dev_imu_01",
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

Ghi chú: Khi tích hợp MQTT thật, endpoint này có thể được thay bằng MQTT consumer nội bộ nhận topic `gateway/{gatewayId}/telemetry/imu`.

---

### 7.8. Event/Alert API

`/alerts` đang là alias của `/events` để tương thích cách gọi “cảnh báo”.

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/events` | Bearer token | Lấy danh sách sự kiện/cảnh báo |
| `POST` | `/api/v1/events` | `admin/caregiver` | Tạo sự kiện/cảnh báo |
| `GET` | `/api/v1/events/:eventId` | Bearer token | Lấy chi tiết sự kiện |
| `PATCH` | `/api/v1/events/:eventId/status` | Bearer token + quyền update | Cập nhật trạng thái sự kiện |
| `GET` | `/api/v1/alerts` | Bearer token | Alias lấy danh sách cảnh báo |
| `POST` | `/api/v1/alerts` | `admin/caregiver` | Alias tạo cảnh báo |
| `GET` | `/api/v1/alerts/:eventId` | Bearer token | Alias lấy chi tiết cảnh báo |
| `PATCH` | `/api/v1/alerts/:eventId/status` | Bearer token + quyền update | Alias cập nhật trạng thái cảnh báo |

Query params `GET /events`:

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `deviceId` | `dev_imu_01` | Lọc theo thiết bị |
| `gatewayId` | `gw_001` | Lọc theo gateway |
| `eventType` | `FALL` | Loại sự kiện |
| `priority` | `CRITICAL` | Mức độ ưu tiên |
| `status` | `UNREAD` | Trạng thái xử lý |
| `from` | `2026-06-08T00:00:00.000Z` | Từ thời điểm |
| `to` | `2026-06-08T23:59:59.000Z` | Đến thời điểm |
| `page` | `1` | Trang |
| `pageSize` | `10` | Số bản ghi/trang |

Body `POST /events`:

```json
{
  "eventType": "FALL",
  "timestamp": "2026-06-08T02:00:00.000Z",
  "priority": "CRITICAL",
  "status": "UNREAD",
  "confidence": 0.86,
  "message": "Phát hiện nghi ngờ té ngã",
  "rawRef": "imu_seq_987654",
  "snapshotUrl": "/media/snapshots/evt_1001.jpg",
  "relatedVideoUrl": "/media/videos/evt_1001.mp4",
  "deviceId": "dev_imu_01",
  "gatewayId": "gw_001"
}
```

Body `PATCH /events/:eventId/status`:

```json
{
  "status": "CONFIRMED_FALL"
}
```

Giá trị enum:

| Enum | Giá trị |
|---|---|
| `eventType` | `FALL`, `INACTIVITY`, `DISCONNECT`, `OUT_OF_RANGE`, `LOW_BATTERY` |
| `priority` | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `status` | `UNREAD`, `VIEWED`, `CONFIRMED_FALL`, `FALSE_ALARM`, `RESOLVED` |

---

### 7.9. Notification / Alert Delivery Log API

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Bearer token | Lấy lịch sử gửi cảnh báo |
| `GET` | `/api/v1/notifications/logs` | Bearer token | Lấy lịch sử gửi cảnh báo |
| `POST` | `/api/v1/notifications/alerts/:eventId/send` | `admin/caregiver` | Gửi cảnh báo thủ công theo event |
| `GET` | `/api/v1/alert-delivery-logs` | Bearer token | Alias lấy lịch sử gửi cảnh báo |

Query params:

| Param | Ví dụ | Ý nghĩa |
|---|---|---|
| `eventId` | `uuid` | Lọc theo event |
| `channel` | `EMAIL` | Kênh gửi |
| `deliveryStatus` | `SUCCESS` | Trạng thái gửi |
| `from` | `2026-06-08T00:00:00.000Z` | Từ thời điểm |
| `to` | `2026-06-08T23:59:59.000Z` | Đến thời điểm |
| `page` | `1` | Trang |
| `pageSize` | `10` | Số bản ghi/trang |

Body `POST /notifications/alerts/:eventId/send`:

```json
{
  "channels": ["EMAIL"],
  "recipients": ["caregiver@example.com"]
}
```

Ghi chú: MVP hiện hỗ trợ gửi `EMAIL`. `SMS` và `PUSH` có enum trong database để mở rộng nhưng provider thật chưa được cấu hình.

---

### 7.10. Stream API

| Method | Endpoint | Auth | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/streams/sessions` | Bearer token + `canViewCamera` | Tạo phiên xem camera realtime |
| `DELETE` | `/api/v1/streams/sessions/:sessionId` | Bearer token | Kết thúc phiên xem camera |

Body `POST /streams/sessions`:

```json
{
  "deviceId": "dev_cam_01"
}
```

Response chính:

```json
{
  "success": true,
  "data": {
    "sessionId": "stream_uuid",
    "deviceId": "dev_cam_01",
    "signalingChannel": "stream:stream_uuid",
    "iceServers": [
      {
        "urls": "stun:stun.l.google.com:19302"
      }
    ],
    "expiresIn": 300,
    "state": "CREATED"
  },
  "message": "Tạo phiên stream thành công"
}
```

Ghi chú: Stream API hiện mới tạo session metadata phục vụ WebRTC signaling. Media relay thật cần tích hợp thêm gateway/camera.

---

## 8. Mapping API với use case

| Use case | Module/API liên quan |
|---|---|
| UC-03 Gateway gửi dữ liệu lên server | `POST /health-logs`, heartbeat gateway/device, MQTT telemetry sau này |
| UC-04 Đăng ký/đăng nhập | `/auth/register`, `/auth/login`, `/auth/me` |
| UC-05 Phát hiện té ngã | Event Detection Service, `POST /events` |
| UC-06 Phát hiện bất động | Threshold Service, Event Service |
| UC-07 Mất kết nối | Heartbeat + Event Service |
| UC-08 Tạo/lưu cảnh báo | `POST /events`, `GET /events` |
| UC-09 Gửi cảnh báo | `/notifications/alerts/:eventId/send`, `/alert-delivery-logs` |
| UC-10 Xem camera realtime | `/streams/sessions` |
| UC-11 Xem lịch sử sự kiện | `GET /events`, `GET /events/:eventId` |
| UC-12 Quản lý thiết bị | `/devices`, `/gateways` |
| UC-13 Phân quyền | `/permissions` |
| UC-14 Xem trạng thái thiết bị | `/devices/status`, heartbeat |
| UC-15 Cấu hình ngưỡng | `/thresholds` |

---

## 9. Thứ tự ưu tiên phát triển tiếp

1. Đồng bộ Swagger của Auth/Gateway/Device với phần thành viên khác đang viết.
2. Tích hợp MQTT consumer cho telemetry thật từ gateway.
3. Tích hợp Socket.io để đẩy `event.created`, `device.status.updated`, `event.updated`.
4. Tích hợp WebRTC signaling thật cho camera.
5. Bổ sung test case cho từng use case trong SRS.
6. Tách SMS provider adapter nếu nhóm quyết định demo SMS thật.

---

## 10. Ghi chú khi cập nhật Swagger

Swagger chính nằm tại:

```text
src/loaders/swagger.config.js
```

Hiện tại Swagger cố ý bỏ qua:

- Auth API
- Gateway API
- Device API

Khi các thành viên khác hoàn thiện 3 nhóm này, chỉ cần bổ sung lại `tags`, `components.schemas` và `paths` tương ứng trong `swagger.config.js`, hoặc chuyển dần sang Swagger comment trực tiếp trong từng route/controller.
