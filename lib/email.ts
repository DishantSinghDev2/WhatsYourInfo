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
}

export async function sendOtpEmail({ to, otp }: SendOtpEmailOptions) {
  try {
    await transporter.sendMail({
      from: `"WhatsYour.Info" <${process.env.EMAIL_FROM}>`,
      to,
      subject: 'Your One-Time Password (OTP) for WhatsYour.Info',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #4A90E2; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">WhatsYour.Info</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="font-size: 16px; line-height: 1.6;">Thank you for using WhatsYour.Info! To complete your action, please use the following One-Time Password (OTP):</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #4A90E2; background-color: #f0f8ff; padding: 15px 25px; border-radius: 5px; letter-spacing: 3px
">${otp}</span>
            </div>
            <p style="font-size: 16px; line-height: 1.6;">This OTP is valid for a short period. Please do not share it with anyone.</p>
            <p style="font-size: 16px; line-height: 1.6;">If you did not request this, please ignore this email.</p>
            <p style="font-size: 16px; line-height: 1.6; margin-top: 30px;">Best regards,<br/>The WhatsYour.Info Team</p>
          </div>
          <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
            <p>&copy; ${new Date().getFullYear()} WhatsYour.Info. All rights reserved.</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email.');
  }
}