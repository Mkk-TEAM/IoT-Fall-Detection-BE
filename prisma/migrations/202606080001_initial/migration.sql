-- Initial migration for DADN Backend on an empty PostgreSQL database.
-- This migration intentionally creates tables only; it does not alter or drop legacy tables.

CREATE TYPE "UserRole" AS ENUM ('caregiver', 'admin');
CREATE TYPE "GatewayStatus" AS ENUM ('ONLINE', 'OFFLINE', 'UNKNOWN');
CREATE TYPE "DeviceType" AS ENUM ('IMU', 'CAMERA', 'GATEWAY');
CREATE TYPE "DeviceStatus" AS ENUM ('REGISTERED', 'ONLINE', 'OFFLINE', 'DISABLED', 'UNKNOWN');
CREATE TYPE "EventType" AS ENUM ('FALL', 'INACTIVITY', 'DISCONNECT', 'OUT_OF_RANGE');
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "EventStatus" AS ENUM ('UNREAD', 'VIEWED', 'CONFIRMED_FALL', 'FALSE_ALARM', 'RESOLVED');
CREATE TYPE "AlertChannel" AS ENUM ('SMS', 'EMAIL', 'PUSH');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

CREATE TABLE "users" (
  "user_id" TEXT NOT NULL,
  "full_name" TEXT NOT NULL,
  "phone_number" TEXT NOT NULL,
  "email" TEXT,
  "password_hash" TEXT NOT NULL,
  "role" "UserRole" NOT NULL DEFAULT 'caregiver',
  "device_token" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "gateways" (
  "gateway_id" TEXT NOT NULL,
  "display_name" TEXT,
  "status" "GatewayStatus" NOT NULL DEFAULT 'UNKNOWN',
  "ip_address" TEXT,
  "last_heartbeat" TIMESTAMP(3),
  "owner_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "gateways_pkey" PRIMARY KEY ("gateway_id")
);

CREATE TABLE "devices" (
  "device_id" TEXT NOT NULL,
  "device_type" "DeviceType" NOT NULL,
  "gateway_id" TEXT NOT NULL,
  "display_name" TEXT,
  "location" TEXT,
  "status" "DeviceStatus" NOT NULL DEFAULT 'REGISTERED',
  "battery_level" INTEGER,
  "last_heartbeat" TIMESTAMP(3),
  "disabled_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "devices_pkey" PRIMARY KEY ("device_id")
);

CREATE TABLE "permissions" (
  "permission_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "device_id" TEXT NOT NULL,
  "can_view_camera" BOOLEAN NOT NULL DEFAULT false,
  "can_view_history" BOOLEAN NOT NULL DEFAULT false,
  "can_update_event" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("permission_id")
);

CREATE TABLE "events" (
  "event_id" TEXT NOT NULL,
  "event_type" "EventType" NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "priority" "EventPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "EventStatus" NOT NULL DEFAULT 'UNREAD',
  "confidence" DOUBLE PRECISION,
  "message" TEXT,
  "raw_ref" TEXT,
  "snapshot_url" TEXT,
  "related_video_url" TEXT,
  "device_id" TEXT,
  "gateway_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "events_pkey" PRIMARY KEY ("event_id")
);

CREATE TABLE "health_logs" (
  "log_id" TEXT NOT NULL,
  "device_id" TEXT NOT NULL,
  "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "movement_level" DOUBLE PRECISION,
  "accel_x" DOUBLE PRECISION,
  "accel_y" DOUBLE PRECISION,
  "accel_z" DOUBLE PRECISION,
  "gyro_x" DOUBLE PRECISION,
  "gyro_y" DOUBLE PRECISION,
  "gyro_z" DOUBLE PRECISION,
  "tilt_angle" DOUBLE PRECISION,
  "raw_payload" JSONB,
  CONSTRAINT "health_logs_pkey" PRIMARY KEY ("log_id")
);

CREATE TABLE "threshold_configs" (
  "threshold_config_id" TEXT NOT NULL,
  "acceleration_threshold" DOUBLE PRECISION NOT NULL DEFAULT 2.8,
  "inactivity_threshold_seconds" INTEGER NOT NULL DEFAULT 420,
  "disconnect_threshold_seconds" INTEGER NOT NULL DEFAULT 30,
  "updated_by_user_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "threshold_configs_pkey" PRIMARY KEY ("threshold_config_id")
);

CREATE TABLE "alert_delivery_logs" (
  "delivery_log_id" TEXT NOT NULL,
  "event_id" TEXT NOT NULL,
  "recipient_user_id" TEXT,
  "recipient" TEXT NOT NULL,
  "channel" "AlertChannel" NOT NULL DEFAULT 'SMS',
  "sent_at" TIMESTAMP(3),
  "delivery_status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "provider_message_id" TEXT,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "alert_delivery_logs_pkey" PRIMARY KEY ("delivery_log_id")
);

CREATE TABLE "otp_logs" (
  "otp_log_id" TEXT NOT NULL,
  "user_id" TEXT,
  "destination" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'EMAIL',
  "otp_hash" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "consumed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "otp_logs_pkey" PRIMARY KEY ("otp_log_id")
);

CREATE UNIQUE INDEX "users_phone_number_key" ON "users"("phone_number");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "devices_gateway_id_idx" ON "devices"("gateway_id");
CREATE INDEX "devices_device_type_status_idx" ON "devices"("device_type", "status");
CREATE UNIQUE INDEX "permissions_user_id_device_id_key" ON "permissions"("user_id", "device_id");
CREATE INDEX "permissions_device_id_idx" ON "permissions"("device_id");
CREATE INDEX "events_device_id_timestamp_idx" ON "events"("device_id", "timestamp");
CREATE INDEX "events_event_type_priority_status_idx" ON "events"("event_type", "priority", "status");
CREATE INDEX "health_logs_device_id_recorded_at_idx" ON "health_logs"("device_id", "recorded_at");
CREATE INDEX "alert_delivery_logs_event_id_idx" ON "alert_delivery_logs"("event_id");
CREATE INDEX "alert_delivery_logs_channel_delivery_status_idx" ON "alert_delivery_logs"("channel", "delivery_status");
CREATE INDEX "otp_logs_destination_idx" ON "otp_logs"("destination");
CREATE INDEX "otp_logs_expires_at_idx" ON "otp_logs"("expires_at");

ALTER TABLE "gateways" ADD CONSTRAINT "gateways_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "devices" ADD CONSTRAINT "devices_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("gateway_id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "events" ADD CONSTRAINT "events_gateway_id_fkey" FOREIGN KEY ("gateway_id") REFERENCES "gateways"("gateway_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "health_logs" ADD CONSTRAINT "health_logs_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "devices"("device_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "threshold_configs" ADD CONSTRAINT "threshold_configs_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "alert_delivery_logs" ADD CONSTRAINT "alert_delivery_logs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "alert_delivery_logs" ADD CONSTRAINT "alert_delivery_logs_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "otp_logs" ADD CONSTRAINT "otp_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
