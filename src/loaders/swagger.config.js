import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env.js";

const commonErrorResponses = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" },
  500: { $ref: "#/components/responses/InternalServerError" },
};

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "IoT Fall Detection API",
    version: "1.0.0",
    description:
      "Backend API cho hệ thống phát hiện té ngã trong nhà cho người cao tuổi bằng IMU và Camera. Tài liệu Swagger mô tả các REST API chính của backend MVP, bao gồm Auth, Gateway, Device, Permission, Threshold, HealthLog, DeviceStatusLog, Event, Notification và Stream.",
  },
  servers: [
    {
      url: `http://localhost:${env.port}${env.apiPrefix}`,
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Auth", description: "Đăng ký, đăng nhập, OTP, JWT và tài khoản hiện tại" },
    { name: "Gateways", description: "Quản lý gateway trung gian giữa edge device và backend" },
    { name: "Devices", description: "Quản lý IMU, camera và trạng thái thiết bị" },
    { name: "Permissions", description: "Phân quyền truy cập thiết bị cho người dùng" },
    { name: "Thresholds", description: "Cấu hình ngưỡng cảnh báo té ngã, bất động và mất kết nối" },
    { name: "HealthLogs", description: "Dữ liệu telemetry/health log từ IMU" },
    { name: "DeviceStatusLogs", description: "Log tình trạng online/offline, camera, stream và heartbeat của thiết bị/gateway" },
    { name: "Events", description: "Sự kiện/cảnh báo té ngã và trạng thái bất thường" },
    { name: "Notifications", description: "Gửi cảnh báo và xem lịch sử gửi cảnh báo" },
    { name: "Streams", description: "Phiên xem camera thời gian thực" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      edgeSecret: {
        type: "apiKey",
        in: "header",
        name: "X-Edge-Secret",
        description: "Shared secret dùng cho gateway/edge service khi gửi dữ liệu nội bộ về backend",
      },
    },
    parameters: {
      Page: {
        name: "page",
        in: "query",
        schema: { type: "integer", minimum: 1, default: 1 },
        description: "Số trang cần lấy",
      },
      PageSize: {
        name: "pageSize",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 10 },
        description: "Số lượng bản ghi mỗi trang",
      },
      From: {
        name: "from",
        in: "query",
        schema: { type: "string", format: "date-time" },
        description: "Thời điểm bắt đầu lọc dữ liệu theo ISO 8601",
      },
      To: {
        name: "to",
        in: "query",
        schema: { type: "string", format: "date-time" },
        description: "Thời điểm kết thúc lọc dữ liệu theo ISO 8601",
      },
    },
    schemas: {
      SuccessResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { nullable: true, description: "Dữ liệu trả về" },
          message: { type: "string", example: "Request processed successfully" },
          meta: {
            type: "object",
            nullable: true,
            properties: {
              page: { type: "integer", example: 1 },
              pageSize: { type: "integer", example: 10 },
              total: { type: "integer", example: 25 },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string", example: "VALIDATION_ERROR" },
              message: { type: "string", example: "Dữ liệu đầu vào không hợp lệ" },
            },
          },
        },
      },
      User: {
        type: "object",
        properties: {
          userId: { type: "string", format: "uuid" },
          fullName: { type: "string", example: "Nguyen Van A" },
          phoneNumber: { type: "string", example: "0912345678" },
          email: { type: "string", format: "email", example: "caregiver@example.com" },
          role: { type: "string", enum: ["admin", "caregiver"], example: "caregiver" },
          deviceToken: { type: "string", nullable: true, example: "optional_fcm_token" },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      AuthRegisterOtpRequest: {
        type: "object",
        required: ["phoneNumber", "email"],
        properties: {
          phoneNumber: { type: "string", example: "0912345678", description: "Số điện thoại 10 chữ số" },
          email: { type: "string", format: "email", example: "caregiver@example.com" },
        },
      },
      AuthRegisterRequest: {
        type: "object",
        required: ["fullName", "phoneNumber", "email", "password", "otp"],
        properties: {
          fullName: { type: "string", example: "Nguyen Van A" },
          phoneNumber: { type: "string", example: "0912345678" },
          email: { type: "string", format: "email", example: "caregiver@example.com" },
          password: { type: "string", format: "password", example: "StrongPass@123" },
          otp: { type: "string", example: "123456" },
          deviceToken: { type: "string", nullable: true, example: "optional_fcm_token" },
        },
      },
      AuthLoginRequest: {
        type: "object",
        required: ["phoneNumber", "password"],
        properties: {
          phoneNumber: { type: "string", example: "0912345678" },
          password: { type: "string", format: "password", example: "StrongPass@123" },
        },
      },
      AuthLoginResponseData: {
        type: "object",
        properties: {
          accessToken: { type: "string", example: "jwt_access_token" },
          expiresIn: { type: "string", example: "1h" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      AuthForgotPasswordOtpRequest: {
        type: "object",
        required: ["phoneNumber"],
        properties: {
          phoneNumber: { type: "string", example: "0912345678" },
        },
      },
      AuthResetPasswordRequest: {
        type: "object",
        required: ["phoneNumber", "otp", "newPassword"],
        properties: {
          phoneNumber: { type: "string", example: "0912345678" },
          otp: { type: "string", example: "123456" },
          newPassword: { type: "string", format: "password", example: "NewStrongPass@123" },
        },
      },
      Gateway: {
        type: "object",
        properties: {
          gatewayId: { type: "string", example: "gw_001" },
          displayName: { type: "string", nullable: true, example: "Gateway phong khach" },
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN"], example: "ONLINE" },
          ipAddress: { type: "string", nullable: true, example: "192.168.1.20" },
          lastHeartbeat: { type: "string", nullable: true, format: "date-time" },
          ownerUserId: { type: "string", nullable: true, format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      GatewayCreateRequest: {
        type: "object",
        required: ["gatewayId"],
        properties: {
          gatewayId: { type: "string", example: "gw_001" },
          displayName: { type: "string", example: "Gateway phong khach" },
          ipAddress: { type: "string", example: "192.168.1.20" },
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN"], example: "UNKNOWN" },
          lastHeartbeat: { type: "string", format: "date-time" },
          ownerUserId: { type: "string", format: "uuid", description: "Admin có thể truyền ownerUserId; caregiver mặc định là chính user hiện tại" },
        },
      },
      GatewayUpdateRequest: {
        type: "object",
        properties: {
          displayName: { type: "string", example: "Gateway phong ngu" },
          ipAddress: { type: "string", example: "192.168.1.21" },
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN"], example: "ONLINE" },
          ownerUserId: { type: "string", format: "uuid", description: "Chỉ admin nên cập nhật ownerUserId" },
        },
      },
      GatewayHeartbeatRequest: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN"], example: "ONLINE" },
          ipAddress: { type: "string", example: "192.168.1.20" },
        },
      },
      Device: {
        type: "object",
        properties: {
          deviceId: { type: "string", example: "dev_imu_01" },
          deviceType: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"], example: "IMU" },
          gatewayId: { type: "string", example: "gw_001" },
          displayName: { type: "string", nullable: true, example: "IMU phong khach" },
          location: { type: "string", nullable: true, example: "Phòng khách" },
          status: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"], example: "ONLINE" },
          batteryLevel: { type: "integer", nullable: true, minimum: 0, maximum: 100, example: 78 },
          lastHeartbeat: { type: "string", nullable: true, format: "date-time" },
          disabledAt: { type: "string", nullable: true, format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      DeviceCreateRequest: {
        type: "object",
        required: ["deviceId", "deviceType", "gatewayId"],
        properties: {
          deviceId: { type: "string", example: "dev_imu_01" },
          deviceType: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"], example: "IMU" },
          gatewayId: { type: "string", example: "gw_001" },
          displayName: { type: "string", example: "IMU phong khach" },
          location: { type: "string", example: "Phòng khách" },
          status: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"], example: "REGISTERED" },
          batteryLevel: { type: "integer", minimum: 0, maximum: 100, example: 78 },
          lastHeartbeat: { type: "string", format: "date-time" },
        },
      },
      DeviceUpdateRequest: {
        type: "object",
        properties: {
          deviceType: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"], example: "CAMERA" },
          gatewayId: { type: "string", example: "gw_001" },
          displayName: { type: "string", example: "Camera phong ngu" },
          location: { type: "string", example: "Phòng ngủ" },
          status: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"], example: "ONLINE" },
          batteryLevel: { type: "integer", minimum: 0, maximum: 100, example: 80 },
          lastHeartbeat: { type: "string", format: "date-time" },
        },
      },
      DeviceHeartbeatRequest: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"], example: "ONLINE" },
          batteryLevel: { type: "integer", minimum: 0, maximum: 100, example: 78 },
        },
      },
      Permission: {
        type: "object",
        properties: {
          permissionId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          deviceId: { type: "string", example: "dev_cam_01" },
          canViewCamera: { type: "boolean", example: true },
          canViewHistory: { type: "boolean", example: true },
          canUpdateEvent: { type: "boolean", example: false },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      PermissionUpsertRequest: {
        type: "object",
        required: ["userId", "deviceId"],
        properties: {
          userId: { type: "string", format: "uuid" },
          deviceId: { type: "string", example: "dev_cam_01" },
          canViewCamera: { type: "boolean", example: true },
          canViewHistory: { type: "boolean", example: true },
          canUpdateEvent: { type: "boolean", example: false },
        },
      },
      PermissionUpdateRequest: {
        type: "object",
        properties: {
          canViewCamera: { type: "boolean", example: true },
          canViewHistory: { type: "boolean", example: true },
          canUpdateEvent: { type: "boolean", example: true },
        },
      },
      ThresholdConfig: {
        type: "object",
        properties: {
          thresholdConfigId: { type: "string", format: "uuid" },
          accelerationThreshold: { type: "number", example: 2.8 },
          inactivityThresholdSeconds: { type: "integer", example: 420 },
          disconnectThresholdSeconds: { type: "integer", example: 30 },
          updatedByUserId: { type: "string", nullable: true, format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ThresholdUpdateRequest: {
        type: "object",
        properties: {
          accelerationThreshold: { type: "number", minimum: 0, maximum: 50, example: 2.8 },
          inactivityThresholdSeconds: { type: "integer", minimum: 10, maximum: 86400, example: 420 },
          disconnectThresholdSeconds: { type: "integer", minimum: 5, maximum: 3600, example: 30 },
        },
      },
      HealthLog: {
        type: "object",
        properties: {
          logId: { type: "string", format: "uuid" },
          deviceId: { type: "string", example: "dev_imu_01" },
          recordedAt: { type: "string", format: "date-time" },
          movementLevel: { type: "number", nullable: true, example: 0.72 },
          accelX: { type: "number", nullable: true, example: 0.12 },
          accelY: { type: "number", nullable: true, example: 2.81 },
          accelZ: { type: "number", nullable: true, example: 8.91 },
          gyroX: { type: "number", nullable: true, example: 0.01 },
          gyroY: { type: "number", nullable: true, example: 0.12 },
          gyroZ: { type: "number", nullable: true, example: 0.03 },
          tiltAngle: { type: "number", nullable: true, example: 63.5 },
          batteryLevel: { type: "integer", nullable: true, example: 78 },
          rawPayload: { type: "object", nullable: true },
        },
      },
      HealthLogCreateRequest: {
        type: "object",
        required: ["deviceId"],
        properties: {
          deviceId: { type: "string", example: "dev_imu_01" },
          timestamp: { type: "string", format: "date-time", example: "2026-06-08T02:00:00.000Z" },
          recordedAt: { type: "string", format: "date-time", example: "2026-06-08T02:00:00.000Z" },
          movementLevel: { type: "number", example: 0.72 },
          accel: {
            type: "object",
            properties: {
              x: { type: "number", example: 0.12 },
              y: { type: "number", example: 2.81 },
              z: { type: "number", example: 8.91 },
            },
          },
          gyro: {
            type: "object",
            properties: {
              x: { type: "number", example: 0.01 },
              y: { type: "number", example: 0.12 },
              z: { type: "number", example: 0.03 },
            },
          },
          tiltAngle: { type: "number", example: 63.5 },
          batteryLevel: { type: "integer", example: 78 },
        },
      },
      DeviceStatusLog: {
        type: "object",
        properties: {
          statusLogId: { type: "string", format: "uuid" },
          deviceId: { type: "string", nullable: true, example: "dev_cam_01" },
          gatewayId: { type: "string", nullable: true, example: "gw_001" },
          source: { type: "string", nullable: true, example: "EDGE_STREAM" },
          status: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"], example: "ONLINE" },
          statusMessage: { type: "string", nullable: true, example: "Camera stream is healthy" },
          batteryLevel: { type: "integer", nullable: true, example: 78 },
          ipAddress: { type: "string", nullable: true, example: "192.168.2.14" },
          signalStrength: { type: "integer", nullable: true, example: -61 },
          cameraOpened: { type: "boolean", nullable: true, example: true },
          streamStatus: { type: "string", nullable: true, example: "ACTIVE" },
          frameRate: { type: "integer", nullable: true, example: 15 },
          resolution: { type: "string", nullable: true, example: "640x480" },
          recordedAt: { type: "string", format: "date-time" },
          rawPayload: { type: "object", nullable: true },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      DeviceStatusLogCreateRequest: {
        type: "object",
        required: ["status"],
        description: "Cần có ít nhất deviceId hoặc gatewayId.",
        properties: {
          deviceId: { type: "string", example: "dev_cam_01" },
          gatewayId: { type: "string", example: "gw_001" },
          source: { type: "string", example: "EDGE_STREAM" },
          status: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN", "DISABLED"], example: "ONLINE" },
          statusMessage: { type: "string", example: "Camera stream is healthy" },
          batteryLevel: { type: "integer", minimum: 0, maximum: 100, example: 78 },
          ipAddress: { type: "string", example: "192.168.2.14" },
          signalStrength: { type: "integer", example: -61 },
          cameraOpened: { type: "boolean", example: true },
          streamStatus: { type: "string", example: "ACTIVE" },
          frameRate: { type: "integer", example: 15 },
          fps: { type: "integer", example: 15 },
          resolution: { type: "string", example: "640x480" },
          width: { type: "integer", example: 640 },
          height: { type: "integer", example: 480 },
          timestamp: { type: "string", format: "date-time", example: "2026-06-13T03:00:00.000Z" },
          recordedAt: { type: "string", format: "date-time", example: "2026-06-13T03:00:00.000Z" },
          rawPayload: { type: "object" },
        },
      },
      Event: {
        type: "object",
        properties: {
          eventId: { type: "string", format: "uuid" },
          eventType: { $ref: "#/components/schemas/EventType" },
          timestamp: { type: "string", format: "date-time" },
          priority: { $ref: "#/components/schemas/EventPriority" },
          status: { $ref: "#/components/schemas/EventStatus" },
          confidence: { type: "number", nullable: true, example: 0.86 },
          message: { type: "string", nullable: true, example: "Phát hiện nghi ngờ té ngã" },
          rawRef: { type: "string", nullable: true, example: "imu_seq_987654" },
          snapshotUrl: { type: "string", nullable: true, example: "/media/snapshots/evt_1001.jpg" },
          relatedVideoUrl: { type: "string", nullable: true, example: "/media/videos/evt_1001.mp4" },
          deviceId: { type: "string", nullable: true, example: "dev_imu_01" },
          gatewayId: { type: "string", nullable: true, example: "gw_001" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      EventCreateRequest: {
        type: "object",
        required: ["eventType"],
        properties: {
          eventType: { $ref: "#/components/schemas/EventType" },
          timestamp: { type: "string", format: "date-time", example: "2026-06-08T02:00:00.000Z" },
          priority: { $ref: "#/components/schemas/EventPriority" },
          status: { $ref: "#/components/schemas/EventStatus" },
          confidence: { type: "number", example: 0.86 },
          message: { type: "string", example: "Phát hiện nghi ngờ té ngã" },
          rawRef: { type: "string", example: "imu_seq_987654" },
          snapshotUrl: { type: "string", example: "/media/snapshots/evt_1001.jpg" },
          relatedVideoUrl: { type: "string", example: "/media/videos/evt_1001.mp4" },
          deviceId: { type: "string", example: "dev_imu_01" },
          gatewayId: { type: "string", example: "gw_001" },
        },
      },
      EventStatusUpdateRequest: {
        type: "object",
        required: ["status"],
        properties: {
          status: { $ref: "#/components/schemas/EventStatus" },
        },
      },
      AlertDeliveryLog: {
        type: "object",
        properties: {
          deliveryLogId: { type: "string", format: "uuid" },
          eventId: { type: "string", format: "uuid" },
          recipientUserId: { type: "string", nullable: true, format: "uuid" },
          recipient: { type: "string", example: "caregiver@example.com" },
          channel: { $ref: "#/components/schemas/AlertChannel" },
          sentAt: { type: "string", nullable: true, format: "date-time" },
          deliveryStatus: { $ref: "#/components/schemas/DeliveryStatus" },
          providerMessageId: { type: "string", nullable: true },
          errorMessage: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      SendAlertRequest: {
        type: "object",
        properties: {
          channels: {
            type: "array",
            items: { $ref: "#/components/schemas/AlertChannel" },
            example: ["EMAIL"],
          },
          recipients: {
            type: "array",
            items: { type: "string" },
            example: ["caregiver@example.com"],
          },
        },
      },
      StreamSession: {
        type: "object",
        properties: {
          sessionId: { type: "string", example: "stream_550e8400-e29b-41d4-a716-446655440000" },
          deviceId: { type: "string", example: "dev_cam_01" },
          userId: { type: "string", format: "uuid" },
          signalingChannel: { type: "string", example: "stream:stream_550e8400-e29b-41d4-a716-446655440000" },
          iceServers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                urls: { type: "string", example: "stun:stun.l.google.com:19302" },
              },
            },
          },
          expiresIn: { type: "integer", example: 300 },
          expiresAt: { type: "string", format: "date-time" },
          state: { type: "string", example: "CREATED" },
        },
      },
      StreamCreateRequest: {
        type: "object",
        required: ["deviceId"],
        properties: {
          deviceId: { type: "string", example: "dev_cam_01" },
        },
      },
      EventType: {
        type: "string",
        enum: ["FALL", "INACTIVITY", "DISCONNECT", "OUT_OF_RANGE", "LOW_BATTERY"],
        example: "FALL",
      },
      EventPriority: {
        type: "string",
        enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
        example: "CRITICAL",
      },
      EventStatus: {
        type: "string",
        enum: ["UNREAD", "VIEWED", "CONFIRMED_FALL", "FALSE_ALARM", "RESOLVED"],
        example: "UNREAD",
      },
      AlertChannel: {
        type: "string",
        enum: ["SMS", "EMAIL", "PUSH"],
        example: "EMAIL",
      },
      DeliveryStatus: {
        type: "string",
        enum: ["PENDING", "SUCCESS", "FAILED"],
        example: "SUCCESS",
      },
    },
    responses: {
      BadRequest: {
        description: "Dữ liệu đầu vào không hợp lệ",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Unauthorized: {
        description: "Chưa xác thực hoặc JWT không hợp lệ",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Forbidden: {
        description: "Không có quyền truy cập tài nguyên",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFound: {
        description: "Không tìm thấy tài nguyên",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      Conflict: {
        description: "Dữ liệu bị trùng hoặc xung đột nghiệp vụ",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      InternalServerError: {
        description: "Lỗi nội bộ server",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
  paths: {
    "/auth/register/otp": {
      post: {
        tags: ["Auth"],
        summary: "Gửi OTP đăng ký qua email",
        description: "Kiểm tra số điện thoại/email chưa tồn tại, sinh OTP và gửi đến email của người dùng.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterOtpRequest" } } },
        },
        responses: {
          200: {
            description: "OTP đăng ký đã được gửi",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
          429: { description: "Gửi OTP quá thường xuyên" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Đăng ký tài khoản caregiver",
        description: "Xác thực OTP, hash mật khẩu bằng bcrypt và tạo tài khoản người chăm sóc.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthRegisterRequest" } } },
        },
        responses: {
          201: {
            description: "Đăng ký thành công",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/User" } } },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          409: { $ref: "#/components/responses/Conflict" },
          429: { description: "Gửi request đăng ký quá thường xuyên" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Đăng nhập và lấy JWT",
        description: "Xác thực số điện thoại/mật khẩu, trả về accessToken để gọi các API yêu cầu Authorization.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthLoginRequest" } } },
        },
        responses: {
          200: {
            description: "Đăng nhập thành công",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/AuthLoginResponseData" } } },
                  ],
                },
              },
            },
          },
          400: { $ref: "#/components/responses/BadRequest" },
          401: { $ref: "#/components/responses/Unauthorized" },
          429: { description: "Đăng nhập quá thường xuyên" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Lấy thông tin người dùng hiện tại",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Thông tin user hiện tại",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/User" } } },
                  ],
                },
              },
            },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/forgot-password/verify": {
      post: {
        tags: ["Auth"],
        summary: "Gửi OTP đặt lại mật khẩu",
        description: "Kiểm tra số điện thoại tồn tại và gửi OTP reset password đến email đã đăng ký.",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthForgotPasswordOtpRequest" } } },
        },
        responses: {
          200: { description: "OTP đặt lại mật khẩu đã được gửi", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { description: "Gửi OTP quá thường xuyên" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/auth/forgot-password/otp": {
      post: { $ref: "#/paths/~1auth~1forgot-password~1verify/post" },
    },
    "/auth/forgot-password/reset": {
      post: {
        tags: ["Auth"],
        summary: "Đặt lại mật khẩu bằng OTP",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResetPasswordRequest" } } },
        },
        responses: {
          200: { description: "Đổi mật khẩu thành công", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          400: { $ref: "#/components/responses/BadRequest" },
          429: { description: "Reset password quá thường xuyên" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/gateways": {
      get: {
        tags: ["Gateways"],
        summary: "Lấy danh sách gateway",
        description: "Admin xem toàn bộ gateway; caregiver chỉ xem gateway sở hữu hoặc gateway có thiết bị được cấp quyền.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["ONLINE", "OFFLINE", "UNKNOWN"] } },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách gateway",
            content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Gateway" } } } }] } } },
          },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Gateways"],
        summary: "Tạo gateway mới",
        description: "Yêu cầu role admin hoặc caregiver. caregiver tạo gateway mặc định thuộc chính mình.",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/GatewayCreateRequest" } } } },
        responses: {
          201: { description: "Tạo gateway thành công", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Gateway" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/gateways/{gatewayId}": {
      get: {
        tags: ["Gateways"],
        summary: "Lấy chi tiết gateway",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "gatewayId", in: "path", required: true, schema: { type: "string" }, example: "gw_001" }],
        responses: {
          200: { description: "Thông tin gateway", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Gateway" } } }] } } } },
          ...commonErrorResponses,
        },
      },
      put: {
        tags: ["Gateways"],
        summary: "Cập nhật gateway",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "gatewayId", in: "path", required: true, schema: { type: "string" }, example: "gw_001" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/GatewayUpdateRequest" } } } },
        responses: {
          200: { description: "Cập nhật gateway thành công", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Gateway" } } }] } } } },
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Gateways"],
        summary: "Xóa gateway",
        description: "Không cho xóa gateway đang có thiết bị.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "gatewayId", in: "path", required: true, schema: { type: "string" }, example: "gw_001" }],
        responses: {
          200: { description: "Xóa gateway thành công", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/gateways/{gatewayId}/heartbeat": {
      patch: {
        tags: ["Gateways"],
        summary: "Cập nhật heartbeat gateway",
        description: "Dùng để gateway báo online/offline và cập nhật IP hiện tại.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "gatewayId", in: "path", required: true, schema: { type: "string" }, example: "gw_001" }],
        requestBody: { required: false, content: { "application/json": { schema: { $ref: "#/components/schemas/GatewayHeartbeatRequest" } } } },
        responses: {
          200: { description: "Heartbeat gateway đã cập nhật", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Gateway" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices/status": {
      get: {
        tags: ["Devices"],
        summary: "Lấy trạng thái tất cả thiết bị có quyền",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "gatewayId", in: "query", schema: { type: "string" }, example: "gw_001" },
          { name: "type", in: "query", schema: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"] } },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: { description: "Danh sách trạng thái thiết bị", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Device" } } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices": {
      get: {
        tags: ["Devices"],
        summary: "Lấy danh sách thiết bị",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "gatewayId", in: "query", schema: { type: "string" }, example: "gw_001" },
          { name: "type", in: "query", schema: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"] } },
          { name: "deviceType", in: "query", schema: { type: "string", enum: ["IMU", "CAMERA", "GATEWAY"] } },
          { name: "status", in: "query", schema: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"] } },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: { description: "Danh sách thiết bị", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Device" } } } }] } } } },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Devices"],
        summary: "Thêm thiết bị mới",
        description: "Yêu cầu role admin hoặc caregiver có quyền quản lý gateway chứa thiết bị.",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceCreateRequest" } } } },
        responses: {
          201: { description: "Thêm thiết bị thành công", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices/{deviceId}": {
      get: {
        tags: ["Devices"],
        summary: "Lấy chi tiết thiết bị",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        responses: {
          200: { description: "Thông tin thiết bị", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
      put: {
        tags: ["Devices"],
        summary: "Cập nhật thiết bị",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceUpdateRequest" } } } },
        responses: {
          200: { description: "Cập nhật thiết bị thành công", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Devices"],
        summary: "Xóa thiết bị",
        description: "Không cho xóa thiết bị đang ONLINE.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        responses: {
          200: { description: "Xóa thiết bị thành công", content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices/{deviceId}/status": {
      get: {
        tags: ["Devices"],
        summary: "Lấy trạng thái một thiết bị",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        responses: {
          200: { description: "Trạng thái thiết bị", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices/{deviceId}/heartbeat": {
      patch: {
        tags: ["Devices"],
        summary: "Cập nhật heartbeat thiết bị",
        description: "Dùng khi gateway/edge báo thiết bị còn hoạt động và cập nhật pin.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        requestBody: { required: false, content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceHeartbeatRequest" } } } },
        responses: {
          200: { description: "Heartbeat thiết bị đã cập nhật", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/devices/{deviceId}/disable": {
      patch: {
        tags: ["Devices"],
        summary: "Vô hiệu hóa thiết bị",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "deviceId", in: "path", required: true, schema: { type: "string" }, example: "dev_imu_01" }],
        responses: {
          200: { description: "Thiết bị đã được vô hiệu hóa", content: { "application/json": { schema: { allOf: [{ $ref: "#/components/schemas/SuccessResponse" }, { type: "object", properties: { data: { $ref: "#/components/schemas/Device" } } }] } } } },
          ...commonErrorResponses,
        },
      },
    },
    "/permissions": {
      get: {
        tags: ["Permissions"],
        summary: "Lấy danh sách phân quyền",
        description:
          "Admin xem toàn bộ phân quyền. Caregiver chỉ xem được phân quyền của các thiết bị thuộc gateway do mình sở hữu.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "userId", in: "query", schema: { type: "string", format: "uuid" }, description: "Lọc theo người dùng" },
          { name: "deviceId", in: "query", schema: { type: "string" }, description: "Lọc theo thiết bị" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách phân quyền",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    {
                      type: "object",
                      properties: {
                        data: { type: "array", items: { $ref: "#/components/schemas/Permission" } },
                      },
                    },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Permissions"],
        summary: "Tạo hoặc cập nhật phân quyền user-device",
        description: "Dùng upsert theo cặp userId-deviceId để gán quyền xem camera, xem lịch sử và cập nhật sự kiện.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PermissionUpsertRequest" } } },
        },
        responses: {
          200: {
            description: "Phân quyền đã được cập nhật",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/permissions/{permissionId}": {
      put: {
        tags: ["Permissions"],
        summary: "Cập nhật quyền truy cập",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "permissionId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PermissionUpdateRequest" } } },
        },
        responses: {
          200: {
            description: "Cập nhật phân quyền thành công",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
      delete: {
        tags: ["Permissions"],
        summary: "Thu hồi quyền truy cập",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "permissionId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Thu hồi quyền thành công",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/thresholds": {
      get: {
        tags: ["Thresholds"],
        summary: "Lấy cấu hình ngưỡng cảnh báo hiện tại",
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: "Cấu hình ngưỡng hiện tại",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/ThresholdConfig" } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
      put: {
        tags: ["Thresholds"],
        summary: "Cập nhật cấu hình ngưỡng cảnh báo",
        description: "Chỉ admin được cập nhật ngưỡng phát hiện té ngã, bất động và mất kết nối.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ThresholdUpdateRequest" } } },
        },
        responses: {
          200: {
            description: "Cập nhật ngưỡng thành công",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/health-logs": {
      get: {
        tags: ["HealthLogs"],
        summary: "Truy vấn health log/telemetry IMU",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "deviceId", in: "query", schema: { type: "string" }, description: "Lọc theo thiết bị IMU" },
          { $ref: "#/components/parameters/From" },
          { $ref: "#/components/parameters/To" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách health log",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/HealthLog" } } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["HealthLogs"],
        summary: "Tạo health log từ telemetry IMU",
        description: "Gateway hoặc backend demo có thể gửi dữ liệu IMU qua endpoint này. Khi tích hợp MQTT thật, endpoint này có thể được gọi nội bộ bởi MQTT consumer.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/HealthLogCreateRequest" } } },
        },
        responses: {
          201: {
            description: "Health log đã được lưu",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/device-status-logs": {
      get: {
        tags: ["DeviceStatusLogs"],
        summary: "Truy vấn log tình trạng thiết bị/gateway",
        description: "Người dùng chỉ xem được log của thiết bị/gateway mình sở hữu hoặc được cấp quyền; admin xem toàn bộ.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "deviceId", in: "query", schema: { type: "string" }, description: "Lọc theo thiết bị" },
          { name: "gatewayId", in: "query", schema: { type: "string" }, description: "Lọc theo gateway" },
          { name: "status", in: "query", schema: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"] } },
          { name: "source", in: "query", schema: { type: "string" }, example: "EDGE_STREAM" },
          { $ref: "#/components/parameters/From" },
          { $ref: "#/components/parameters/To" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách log tình trạng",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/DeviceStatusLog" } } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["DeviceStatusLogs"],
        summary: "Tạo log tình trạng thiết bị thủ công",
        description: "Endpoint có JWT cho admin/caregiver dùng trong demo hoặc debug. Gateway thật nên dùng /internal/device-status-logs với X-Edge-Secret.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceStatusLogCreateRequest" } } },
        },
        responses: {
          201: {
            description: "Log tình trạng đã được lưu",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/device-status-logs/latest": {
      get: {
        tags: ["DeviceStatusLogs"],
        summary: "Lấy tình trạng mới nhất của thiết bị/gateway",
        description: "Nếu truyền deviceId hoặc gatewayId, API trả về log mới nhất tương ứng. Nếu không truyền, API trả về log mới nhất theo từng thiết bị/gateway trong phạm vi quyền truy cập.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "deviceId", in: "query", schema: { type: "string" } },
          { name: "gatewayId", in: "query", schema: { type: "string" } },
          { name: "source", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["REGISTERED", "ONLINE", "OFFLINE", "DISABLED", "UNKNOWN"] } },
        ],
        responses: {
          200: {
            description: "Tình trạng mới nhất",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/internal/device-status-logs": {
      post: {
        tags: ["DeviceStatusLogs"],
        summary: "Gateway/edge ghi log tình trạng thiết bị",
        description: "Dùng cho Raspberry Pi/gateway/edge service gửi heartbeat, cameraOpened, streamStatus, batteryLevel hoặc lỗi thiết bị về backend. Endpoint này không dùng JWT mà dùng header X-Edge-Secret.",
        security: [{ edgeSecret: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/DeviceStatusLogCreateRequest" } } },
        },
        responses: {
          201: {
            description: "Gateway/edge đã ghi log tình trạng",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          401: { $ref: "#/components/responses/Unauthorized" },
          404: { $ref: "#/components/responses/NotFound" },
          500: { $ref: "#/components/responses/InternalServerError" },
        },
      },
    },
    "/events": {
      get: {
        tags: ["Events"],
        summary: "Lấy danh sách sự kiện/cảnh báo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "deviceId", in: "query", schema: { type: "string" } },
          { name: "gatewayId", in: "query", schema: { type: "string" } },
          { name: "eventType", in: "query", schema: { $ref: "#/components/schemas/EventType" } },
          { name: "priority", in: "query", schema: { $ref: "#/components/schemas/EventPriority" } },
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/EventStatus" } },
          { $ref: "#/components/parameters/From" },
          { $ref: "#/components/parameters/To" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách sự kiện",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/Event" } } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
      post: {
        tags: ["Events"],
        summary: "Tạo sự kiện/cảnh báo",
        description: "Tạo event chính thức từ Event Detection Engine hoặc từ candidate event của gateway.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EventCreateRequest" } } },
        },
        responses: {
          201: {
            description: "Sự kiện đã được tạo",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/events/{eventId}": {
      get: {
        tags: ["Events"],
        summary: "Lấy chi tiết một sự kiện",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "eventId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        responses: {
          200: {
            description: "Chi tiết sự kiện",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/Event" } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/events/{eventId}/status": {
      patch: {
        tags: ["Events"],
        summary: "Cập nhật trạng thái xử lý sự kiện",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "eventId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/EventStatusUpdateRequest" } } },
        },
        responses: {
          200: {
            description: "Trạng thái sự kiện đã được cập nhật",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/alerts": {
      get: { $ref: "#/paths/~1events/get" },
      post: { $ref: "#/paths/~1events/post" },
    },
    "/alerts/{eventId}": {
      get: { $ref: "#/paths/~1events~1{eventId}/get" },
    },
    "/alerts/{eventId}/status": {
      patch: { $ref: "#/paths/~1events~1{eventId}~1status/patch" },
    },
    "/notifications/logs": {
      get: {
        tags: ["Notifications"],
        summary: "Lấy lịch sử gửi cảnh báo",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "eventId", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "channel", in: "query", schema: { $ref: "#/components/schemas/AlertChannel" } },
          { name: "deliveryStatus", in: "query", schema: { $ref: "#/components/schemas/DeliveryStatus" } },
          { $ref: "#/components/parameters/From" },
          { $ref: "#/components/parameters/To" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
        ],
        responses: {
          200: {
            description: "Danh sách log gửi cảnh báo",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { type: "array", items: { $ref: "#/components/schemas/AlertDeliveryLog" } } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/notifications/alerts/{eventId}/send": {
      post: {
        tags: ["Notifications"],
        summary: "Gửi cảnh báo thủ công theo event",
        description: "MVP hiện hỗ trợ gửi EMAIL. SMS/PUSH được ghi log FAILED nếu provider chưa cấu hình.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "eventId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        ],
        requestBody: {
          required: false,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SendAlertRequest" } } },
        },
        responses: {
          200: {
            description: "Đã xử lý yêu cầu gửi cảnh báo",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/alert-delivery-logs": {
      get: { $ref: "#/paths/~1notifications~1logs/get" },
    },
    "/streams/sessions": {
      post: {
        tags: ["Streams"],
        summary: "Tạo phiên xem camera realtime",
        description: "Backend kiểm tra quyền canViewCamera với deviceId, sau đó tạo session metadata cho WebRTC signaling.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/StreamCreateRequest" } } },
        },
        responses: {
          201: {
            description: "Phiên stream đã được tạo",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/SuccessResponse" },
                    { type: "object", properties: { data: { $ref: "#/components/schemas/StreamSession" } } },
                  ],
                },
              },
            },
          },
          ...commonErrorResponses,
        },
      },
    },
    "/streams/sessions/{sessionId}": {
      delete: {
        tags: ["Streams"],
        summary: "Kết thúc phiên xem camera realtime",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "sessionId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          200: {
            description: "Phiên stream đã được kết thúc",
            content: { "application/json": { schema: { $ref: "#/components/schemas/SuccessResponse" } } },
          },
          ...commonErrorResponses,
        },
      },
    },
  },
};

const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: [],
});

export function setupSwagger(app) {
  app.use("/swagger/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
