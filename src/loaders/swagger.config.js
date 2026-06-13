import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env.js";

const commonErrorResponses = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  500: { $ref: "#/components/responses/InternalServerError" },
};

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "IoT Fall Detection API",
    version: "1.0.0",
    description:
      "Backend API cho hệ thống phát hiện té ngã trong nhà cho người cao tuổi bằng IMU và Camera. Tài liệu Swagger này hiện mô tả các nhóm API ngoài Auth, Gateway và Device vì các nhóm đó đang được thành viên khác trong nhóm viết lại.",
  },
  servers: [
    {
      url: `http://localhost:${env.port}${env.apiPrefix}`,
      description: "Local development server",
    },
  ],
  tags: [
    { name: "Permissions", description: "Phân quyền truy cập thiết bị cho người dùng" },
    { name: "Thresholds", description: "Cấu hình ngưỡng cảnh báo té ngã, bất động và mất kết nối" },
    { name: "HealthLogs", description: "Dữ liệu telemetry/health log từ IMU" },
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
      InternalServerError: {
        description: "Lỗi nội bộ server",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
  },
  paths: {
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
