import nodemailer from "nodemailer";

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const transporter = createTransporter();

    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"NewZLearn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Xác thực tài khoản của bạn tại NewZLearn",
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="color-scheme" content="light dark" />
          <title>Xác thực tài khoản NewZLearn</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #f3f6fa;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              overflow: hidden;
            }
            .header {
              background: #00BFFF;
              padding: 32px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              letter-spacing: 0.4px;
            }
            .content {
              padding: 36px 40px;
              text-align: left;
            }
            h2 {
              color: #00BFFF;
              font-size: 20px;
              margin-bottom: 10px;
            }
            p {
              line-height: 1.6;
              font-size: 15px;
              color: #555;
              margin: 8px 0;
            }
            .button {
              display: inline-block;
              margin: 24px 0;
              padding: 14px 36px;
              background: #00BFFF;
              color: white !important;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 15px;
              letter-spacing: 0.3px;
              transition: opacity 0.25s ease;
            }
            .button:hover {
              opacity: 0.9;
            }
            .link {
              color: #0078FF;
              word-break: break-all;
              text-decoration: none;
            }
            .footer {
              background-color: #f3f6fa;
              padding: 16px;
              text-align: center;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #e0e6ee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>NewZLearn</h1>
               Chào mừng bạn đến với NewZLearn! 
            </div>
            <div class="content">
              <h2>Xin chào!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>NewZLearn</strong> – nền tảng học tập và chia sẻ kiến thức hiện đại.</p>
              <p>Để hoàn tất đăng ký, vui lòng xác nhận địa chỉ email của bạn bằng cách nhấn vào nút bên dưới:</p>
              
              <div style="text-align:center;">
                <a href="${verificationUrl}" class="button">Xác nhận Email</a>
              </div>

              <p>Nếu nút không hoạt động, hãy sao chép liên kết sau và dán vào trình duyệt của bạn:</p>
              <p><a href="${verificationUrl}" class="link">${verificationUrl}</a></p>

              <p><em>Liên kết này có hiệu lực trong 24 giờ.</em></p>
              <p>Nếu bạn không yêu cầu tạo tài khoản, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>© 2025 NewZLearn. All rights reserved.</p>
              <p>Đây là email tự động, vui lòng không trả lời lại.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
};

export const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const transporter = createTransporter();

    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:5173"
    }/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"NewZLearn" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Đặt lại mật khẩu tài khoản NewZLearn",
      html: `
        <!DOCTYPE html>
        <html lang="vi">
        <head>
          <meta charset="UTF-8" />
          <meta name="color-scheme" content="light dark" />
          <title>Đặt lại mật khẩu NewZLearn</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, Arial, sans-serif;
              background-color: #f3f6fa;
              margin: 0;
              padding: 0;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 40px auto;
              background: #fff;
              border-radius: 12px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #0C8DE9 0%, #0C8DE9 100%);
              padding: 32px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 26px;
              letter-spacing: 0.4px;
            }
            .content {
              padding: 36px 40px;
              text-align: left;
            }
            h2 {
              color: #0C8DE9;
              font-size: 20px;
              margin-bottom: 10px;
            }
            p {
              line-height: 1.6;
              font-size: 15px;
              color: #555;
              margin: 8px 0;
            }
            .button {
              display: inline-block;
              margin: 24px 0;
              padding: 14px 36px;
              background: linear-gradient(135deg, #0C8DE9 0%, #0C8DE9 100%);
              color: white !important;
              text-decoration: none;
              border-radius: 50px;
              font-weight: 600;
              font-size: 15px;
              letter-spacing: 0.3px;
              transition: opacity 0.25s ease;
            }
            .button:hover {
              opacity: 0.9;
            }
            .link {
              color: #0078FF;
              word-break: break-all;
              text-decoration: none;
            }
            .warning {
              background: #FFF3CD;
              border: 1px solid #FFE69C;
              border-radius: 8px;
              padding: 12px 16px;
              margin: 16px 0;
              font-size: 14px;
              color: #856404;
            }
            .footer {
              background-color: #f3f6fa;
              padding: 16px;
              text-align: center;
              font-size: 12px;
              color: #777;
              border-top: 1px solid #e0e6ee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 NewZLearn</h1>
              Đặt lại mật khẩu của bạn
            </div>
            <div class="content">
              <h2>Xin chào!</h2>
              <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>NewZLearn</strong> của bạn.</p>
              <p>Nhấn vào nút bên dưới để tạo mật khẩu mới:</p>
              
              <div style="text-align:center;">
                <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
              </div>

              <p>Nếu nút không hoạt động, hãy sao chép liên kết sau và dán vào trình duyệt:</p>
              <p><a href="${resetUrl}" class="link">${resetUrl}</a></p>

              <div class="warning">
                ⏰ <strong>Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong <strong>1 giờ</strong>.
              </div>

              <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này. Tài khoản của bạn sẽ vẫn an toàn.</p>
            </div>
            <div class="footer">
              <p>© 2025 NewZLearn. All rights reserved.</p>
              <p>Đây là email tự động, vui lòng không trả lời lại.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reset password email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending reset password email:", error);
    return false;
  }
};
