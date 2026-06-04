import nodemailer from 'nodemailer';
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Email của bạn
        pass: process.env.EMAIL_APP_PASSWORD // App Password (không phải mật khẩu đăng nhập)
    }
});

export const sendRegisterOTPEmail = async (email, otp) => {
    await transporter.sendMail({
        from: '"Hệ thống xác thực" <no-reply@yourdomain.com>',
        to: email,
        subject: "Mã xác thực đăng ký",
        text: `Mã xác thực của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
    });
};

export const sendResetPasswordOTPEmail = async (email, otp) => {
    await transporter.sendMail({
        from: '"Hệ thống xác thực" <no-reply@yourdomain.com>',
        to: email,
        subject: "Mã xác thực đổi mật khẩu",
        text: `Mã xác thực của bạn là: ${otp}. Mã có hiệu lực trong 5 phút.`
    });
};