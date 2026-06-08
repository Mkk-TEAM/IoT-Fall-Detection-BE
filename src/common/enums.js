export const USER_ROLES = Object.freeze({
  ADMIN: "admin",
  CAREGIVER: "caregiver",
});

export const GATEWAY_STATUSES = Object.freeze({
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  UNKNOWN: "UNKNOWN",
});

export const DEVICE_TYPES = Object.freeze({
  IMU: "IMU",
  CAMERA: "CAMERA",
  GATEWAY: "GATEWAY",
});

export const DEVICE_STATUSES = Object.freeze({
  REGISTERED: "REGISTERED",
  ONLINE: "ONLINE",
  OFFLINE: "OFFLINE",
  DISABLED: "DISABLED",
  UNKNOWN: "UNKNOWN",
});

export const EVENT_TYPES = Object.freeze({
  FALL: "FALL",
  INACTIVITY: "INACTIVITY",
  DISCONNECT: "DISCONNECT",
  OUT_OF_RANGE: "OUT_OF_RANGE",
  LOW_BATTERY: "LOW_BATTERY",
});

export const EVENT_PRIORITIES = Object.freeze({
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL",
});

export const EVENT_STATUSES = Object.freeze({
  UNREAD: "UNREAD",
  VIEWED: "VIEWED",
  CONFIRMED_FALL: "CONFIRMED_FALL",
  FALSE_ALARM: "FALSE_ALARM",
  RESOLVED: "RESOLVED",
});

export const ALERT_CHANNELS = Object.freeze({
  SMS: "SMS",
  EMAIL: "EMAIL",
  PUSH: "PUSH",
});

export const DELIVERY_STATUSES = Object.freeze({
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
});
