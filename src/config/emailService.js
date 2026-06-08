import nodemailer from "nodemailer";
import { env } from "./env.js";
import { InternalServerError } from "../helpers/handleError.js";

let transporter;

function getTransporter() {
  if (!env.emailEnabled) return null;

  if (!env.emailUser || !env.emailAppPassword) {
    throw new InternalServerError("EMAIL_USER hoặc EMAIL_APP_PASSWORD chưa được cấu hình.", "EMAIL_CONFIG_ERROR");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.emailUser,
        pass: env.emailAppPassword,
      },
    });
  }

  return transporter;
}

function fromAddress() {
  return `"${env.emailFromName}" <${env.emailFromAddress || env.emailUser}>`;
}

async function sendEmail({ to, subject, text, html }) {
  const mailTransporter = getTransporter();

  if (!mailTransporter) {
    console.log("[EMAIL_DISABLED]", { to, subject, text });
    return {
      messageId: `dev-${Date.now()}`,
      status: "SKIPPED_DEV_EMAIL_DISABLED",
    };
  }

  return mailTransporter.sendMail({
    from: fromAddress(),
    to,
    subject,
    text,
    html,
  });
}

export async function sendRegisterOTPEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: "Mã xác thực đăng ký tài khoản",
    text: `Mã xác thực đăng ký của bạn là: ${otp}. Mã có hiệu lực trong ${env.otpExpiresInMinutes} phút.`,
    html: `<p>Mã xác thực đăng ký của bạn là: <b>${otp}</b>.</p><p>Mã có hiệu lực trong ${env.otpExpiresInMinutes} phút.</p>`,
  });
}

export async function sendResetPasswordOTPEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: "Mã xác thực đặt lại mật khẩu",
    text: `Mã xác thực đặt lại mật khẩu của bạn là: ${otp}. Mã có hiệu lực trong ${env.otpExpiresInMinutes} phút.`,
    html: `<p>Mã xác thực đặt lại mật khẩu của bạn là: <b>${otp}</b>.</p><p>Mã có hiệu lực trong ${env.otpExpiresInMinutes} phút.</p>`,
  });
}

export async function sendAlertEmail({ to, event }) {
  const eventTime = event.timestamp ? new Date(event.timestamp).toLocaleString("vi-VN") : new Date().toLocaleString("vi-VN");
  return sendEmail({
    to,
    subject: `[${event.priority || "CRITICAL"}] Cảnh báo ${event.eventType || "bất thường"}`,
    text: `Cảnh báo: ${event.message || event.eventType}. Thời gian: ${eventTime}. Thiết bị: ${event.deviceId || "không xác định"}.`,
    html: `<p><b>Cảnh báo:</b> ${event.message || event.eventType}</p><p><b>Thời gian:</b> ${eventTime}</p><p><b>Thiết bị:</b> ${event.deviceId || "không xác định"}</p>`,
  });
}
