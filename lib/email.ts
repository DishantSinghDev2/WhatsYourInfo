import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // Use 'true' or 'false' in .env
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface SendOtpEmailOptions {
  to: string;
  otp: string;
  name: string;
}

export async function sendOtpEmail({ to, otp, name }: SendOtpEmailOptions) {
  try {
    await transporter.sendMail({
      from: `"WhatsYour.Info" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Your One-Time Password (OTP) for WhatsYour.Info',
      html: `
        <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your One-Time Password</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 20px;
        }
        .header img {
            max-width: 150px;
        }
        .content {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
        }
        .greeting {
            font-size: 20px;
            font-weight: 500;
            color: #000000;
            margin-bottom: 20px;
        }
        .otp-container {
            text-align: center;
            margin: 30px 0;
        }
        .otp {
            font-size: 36px;
            font-weight: bold;
            color: #1faaff;
            letter-spacing: 4px;
            padding: 15px 25px;
            border-radius: 5px;
            display: inline-block;
            background-color: #f0f8ff;
        }
        .instructions {
            font-size: 16px;
            line-height: 1.6;
            color: #000000;
        }
        .footer {
            text-align: center;
            padding-top: 20px;
            font-size: 12px;
            color: #888888;
        }
        @media (max-width: 600px) {
            .content {
                padding: 20px;
            }
            .otp {
                font-size: 28px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co/KpbW193X/Chat-GPT-Image-Jul-22-2025-10-27-46-PM.png" alt="WhatsYour.Info Logo">
        </div>
        <div class="content">
            <p class="greeting">Hello ${name},</p>
            <p class="instructions">Here is your One-Time Password to complete your action:</p>
            <div class="otp-container">
                <span class="otp">${otp}</span>
            </div>
            <p class="instructions">This OTP is valid for a short period. Please do not share it with anyone.</p>
            <p class="instructions">If you did not request this, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© 2025 WhatsYour.Info. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
      `,
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email.');
  }
}