import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { env } from "../config/env.js";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "IoT Fall Detection API",
    version: "1.0.0",
    description: "Backend API cho hệ thống phát hiện té ngã trong nhà cho người cao tuổi bằng IMU và Camera.",
  },
  servers: [{ url: `http://localhost:${env.port}${env.apiPrefix}` }],
  tags: [
    { name: "Auth", description: "Xác thực, OTP, tài khoản" },
    { name: "Gateways", description: "Quản lý gateway" },
    { name: "Devices", description: "Quản lý thiết bị IMU/Camera" },
    { name: "Permissions", description: "Phân quyền truy cập thiết bị" },
    { name: "Events", description: "Sự kiện/cảnh báo té ngã và bất thường" },
    { name: "HealthLogs", description: "Dữ liệu vận động IMU" },
    { name: "Thresholds", description: "Cấu hình ngưỡng cảnh báo" },
    { name: "Notifications", description: "Gửi và xem lịch sử cảnh báo" },
    { name: "Streams", description: "Phiên xem camera realtime" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    "/auth/register/otp": { post: { tags: ["Auth"], summary: "Gửi OTP đăng ký" } },
    "/auth/register": { post: { tags: ["Auth"], summary: "Đăng ký tài khoản" } },
    "/auth/login": { post: { tags: ["Auth"], summary: "Đăng nhập" } },
    "/auth/me": { get: { tags: ["Auth"], summary: "Thông tin người dùng hiện tại", security: [{ bearerAuth: [] }] } },
    "/auth/forgot-password/verify": { post: { tags: ["Auth"], summary: "Gửi OTP đặt lại mật khẩu" } },
    "/auth/forgot-password/reset": { post: { tags: ["Auth"], summary: "Đặt lại mật khẩu" } },
    "/gateways": { get: { tags: ["Gateways"], security: [{ bearerAuth: [] }] }, post: { tags: ["Gateways"], security: [{ bearerAuth: [] }] } },
    "/gateways/{gatewayId}": { get: { tags: ["Gateways"], security: [{ bearerAuth: [] }] }, put: { tags: ["Gateways"], security: [{ bearerAuth: [] }] }, delete: { tags: ["Gateways"], security: [{ bearerAuth: [] }] } },
    "/gateways/{gatewayId}/heartbeat": { patch: { tags: ["Gateways"], security: [{ bearerAuth: [] }] } },
    "/devices": { get: { tags: ["Devices"], security: [{ bearerAuth: [] }] }, post: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/devices/status": { get: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/devices/{deviceId}": { get: { tags: ["Devices"], security: [{ bearerAuth: [] }] }, put: { tags: ["Devices"], security: [{ bearerAuth: [] }] }, delete: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/devices/{deviceId}/status": { get: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/devices/{deviceId}/disable": { patch: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/devices/{deviceId}/heartbeat": { patch: { tags: ["Devices"], security: [{ bearerAuth: [] }] } },
    "/permissions": { get: { tags: ["Permissions"], security: [{ bearerAuth: [] }] }, post: { tags: ["Permissions"], security: [{ bearerAuth: [] }] } },
    "/permissions/{permissionId}": { put: { tags: ["Permissions"], security: [{ bearerAuth: [] }] }, delete: { tags: ["Permissions"], security: [{ bearerAuth: [] }] } },
    "/thresholds": { get: { tags: ["Thresholds"], security: [{ bearerAuth: [] }] }, put: { tags: ["Thresholds"], security: [{ bearerAuth: [] }] } },
    "/health-logs": { get: { tags: ["HealthLogs"], security: [{ bearerAuth: [] }] }, post: { tags: ["HealthLogs"], security: [{ bearerAuth: [] }] } },
    "/events": { get: { tags: ["Events"], security: [{ bearerAuth: [] }] }, post: { tags: ["Events"], security: [{ bearerAuth: [] }] } },
    "/events/{eventId}": { get: { tags: ["Events"], security: [{ bearerAuth: [] }] } },
    "/events/{eventId}/status": { patch: { tags: ["Events"], security: [{ bearerAuth: [] }] } },
    "/notifications/logs": { get: { tags: ["Notifications"], security: [{ bearerAuth: [] }] } },
    "/notifications/alerts/{eventId}/send": { post: { tags: ["Notifications"], security: [{ bearerAuth: [] }] } },
    "/streams/{gatewayId}": { get: { tags: ["Streams"], security: [{ bearerAuth: [] }] } },
    "/streams/sessions": { post: { tags: ["Streams"], security: [{ bearerAuth: [] }] } },
    "/streams/sessions/{sessionId}": { delete: { tags: ["Streams"], security: [{ bearerAuth: [] }] } },
  },
};

const swaggerSpec = swaggerJSDoc({
  definition: swaggerDefinition,
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
});

export function setupSwagger(app) {
  app.use("/swagger/api", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}
