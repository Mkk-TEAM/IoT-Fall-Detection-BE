import nodemailer from "nodemailer";
import { InternalServerError } from "../helpers/handleError.js";

let transporter = null;

function getEmailTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new InternalServerError(
      "Chưa cấu hình EMAIL_USER hoặc EMAIL_APP_PASSWORD trong file .env",
    );
  }

  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user, pass },
  });

  return transporter;
}

function buildSender() {
  return process.env.EMAIL_FROM || `"IoT Fall Detection" <${process.env.EMAIL_USER}>`;
}

async function sendOtpEmail({ to, otp, subject, purpose }) {
  if (!to || !otp) {
    throw new InternalServerError("Thiếu email người nhận hoặc OTP khi gửi email");
  }

  const mailOptions = {
    from: buildSender(),
    to,
    subject,
    text: `Mã xác thực ${purpose} của bạn là: ${otp}. Mã có hiệu lực trong 5 phút. Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>IoT Fall Detection</h2>
        <p>Mã xác thực ${purpose} của bạn là:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
        <p>Mã có hiệu lực trong <strong>5 phút</strong>.</p>
        <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email.</p>
      </div>
    `,
  };

  const info = await getEmailTransporter().sendMail(mailOptions);
  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  };
}

export const sendRegisterOTPEmail = async (email, otp) => sendOtpEmail({
  to: email,
  otp,
  subject: "Mã xác thực đăng ký tài khoản",
  purpose: "đăng ký tài khoản",
});

export const sendResetPasswordOTPEmail = async (email, otp) => sendOtpEmail({
  to: email,
  otp,
  subject: "Mã xác thực đặt lại mật khẩu",
  purpose: "đặt lại mật khẩu",
});
