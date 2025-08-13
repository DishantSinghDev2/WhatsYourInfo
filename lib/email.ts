import nodemailer from 'nodemailer';
import clientPromise from './mongodb';
import crypto from "crypto";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * CRITICAL SECURITY FUNCTION
 * Escapes HTML to prevent XSS attacks when inserting dynamic data into email templates.
 * @param unsafe - The raw string from user input or database.
 * @returns A safe string with HTML special characters converted to entities.
 */
const escapeHTML = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * The Master Email Template
 * All other email functions will use this to ensure a consistent design.
 */
const createEmailTemplate = (subject: string, content: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${escapeHTML(subject)}</title>
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #f8f9fa;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            .container {
                max-width: 580px;
                margin: 20px auto;
                padding: 20px;
            }
            .content-wrapper {
                background-color: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                padding: 40px;
                text-align: center;
                border-bottom: 1px solid #e0e0e0;
            }
            .header img {
                max-width: 140px;
            }
            .main-content {
                padding: 40px;
                color: #0a0a0a;
                font-size: 16px;
                line-height: 1.6;
            }
            .main-content h1 {
                font-size: 22px;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 20px;
            }
            .main-content p {
                margin-top: 0;
                margin-bottom: 20px;
            }
            .button-container {
                text-align: center;
                margin: 30px 0;
            }
            .button {
                display: inline-block;
                padding: 14px 28px;
                font-size: 16px;
                font-weight: 500;
                color: #ffffff;
                background-color: #171717; /* A strong, black button */
                text-decoration: none;
                border-radius: 6px;
            }
            .code-block {
                display: inline-block;
                background-color: #f1f3f5;
                border: 1px solid #e0e0e0;
                padding: 14px 20px;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 5px;
                border-radius: 6px;
                margin: 20px 0;
            }
            .detail-item {
              margin-bottom: 12px;
              padding: 12px;
              border: 1px solid #e9ecef;
              border-radius: 6px;
            }
            .detail-item strong {
              display: block;
              margin-bottom: 4px;
              font-size: 14px;
              color: #525252;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                font-size: 12px;
                color: #888888;
            }
            .footer a {
                color: #525252;
                text-decoration: underline;
            }
            @media (max-width: 600px) {
                .main-content, .header {
                    padding: 25px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="content-wrapper">
                <div class="header">
                    <img src="https://whatsyour.info/logotext.svg" alt="WhatsYour.Info Logo">
                </div>
                <div class="main-content">
                    ${content}
                </div>
            </div>
            <div class="footer">
                <p>© ${new Date().getFullYear()} WhatsYour.Info. All rights reserved.<br>
                   If you have questions, please contact our support team.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// --- OTP Email ---
interface SendOtpEmailOptions { to: string; otp: string; name: string; }
export async function sendOtpEmail({ to, otp, name }: SendOtpEmailOptions) {
  const subject = 'Your One-Time Password (OTP)';
  const content = `
    <h1>Hello, ${escapeHTML(name)}</h1>
    <p>Here is your One-Time Password. Use it to complete your action. It will expire shortly.</p>
    <div style="text-align: center;">
      <span class="code-block">${escapeHTML(otp)}</span>
    </div>
    <p>If you did not request this OTP, you can safely ignore this email. Do not share this code with anyone.</p>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: createEmailTemplate(subject, content),
  });
}

// --- Verification Email ---
export async function sendVerificationEmail(to: string, name: string) {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  await clientPromise.then(client => client.db('whatsyourinfo').collection('users').updateOne(
      { email: to },
      { $set: { emailVerificationToken: verificationToken, emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) } }
  ));
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`;
  const subject = 'Verify Your Email Address';
  const content = `
    <h1>Almost there, ${escapeHTML(name)}!</h1>
    <p>Welcome to WhatsYour.Info! To secure your account, please verify your email address by clicking the button below.</p>
    <div class="button-container">
      <a href="${verificationUrl}" class="button" target="_blank">Verify Email Address</a>
    </div>
    <p>This link is valid for 24 hours. If you did not create an account, please ignore this email.</p>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: createEmailTemplate(subject, content),
  });
}

// --- Account Deletion Email ---
export async function sendAccountDeletionEmail(to: string, name: string) {
  const DELETION_GRACE_PERIOD_DAYS = 30;
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL}/login`;
  const subject = 'Account Deletion Initiated';
  const content = `
    <h1>Hello, ${escapeHTML(name)}</h1>
    <p>This is a confirmation that your WhatsYour.Info account is scheduled for permanent deletion in <strong>${DELETION_GRACE_PERIOD_DAYS} days</strong>.</p>
    <p><strong>Changed your mind?</strong> You can easily recover your account by logging in anytime within the grace period.</p>
    <div class="button-container">
      <a href="${loginUrl}" class="button" target="_blank">Recover My Account</a>
    </div>
    <p>If you did not request this, please log in immediately to secure your account and change your password.</p>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info Security" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: createEmailTemplate(subject, content),
  });
}

// --- Recovery Email Verification ---
interface SendRecoveryEmailOptions { to: string; name: string; token: string; }
export async function sendRecoveryEmailVerification({ to, name, token }: SendRecoveryEmailOptions) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-recovery-email?token=${token}`;
  const subject = 'Confirm Your Recovery Email';
  const content = `
    <h1>Hi, ${escapeHTML(name)}</h1>
    <p>A request was made to set this address as the recovery email for your account. To confirm this change, please click the button below.</p>
    <div class="button-container">
      <a href="${verificationUrl}" class="button" target="_blank">Confirm Recovery Email</a>
    </div>
    <p>This confirmation link is valid for 24 hours. If you didn't request this, you can safely ignore this message.</p>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info Security" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: createEmailTemplate(subject, content),
  });
}

// --- Contact Us Submission Notification ---
interface SendContactUsEmailOptions { to: string; name: string; email: string; subject: string; message: string; }
export async function sendContactUsEmail({ to, name, email, subject, message }: SendContactUsEmailOptions) {
  const emailSubject = `New Contact Form Submission: ${escapeHTML(subject)}`;
  const content = `
    <h1>New Contact Form Submission</h1>
    <p>You have received a new message from the contact form on your website.</p>
    <div class="detail-item">
      <strong>From:</strong> ${escapeHTML(name)}
    </div>
    <div class="detail-item">
      <strong>Email:</strong> ${escapeHTML(email)}
    </div>
    <div class="detail-item">
      <strong>Subject:</strong> ${escapeHTML(subject)}
    </div>
    <div class="detail-item">
      <strong>Message:</strong>
      <p style="margin: 4px 0 0 0;">${escapeHTML(message).replace(/\n/g, '<br>')}</p>
    </div>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info Notifier" <${process.env.EMAIL_FROM}>`,
    to,
    subject: emailSubject,
    html: createEmailTemplate(emailSubject, content),
  });
}

// --- [NEW] Lead Capture Notification ---
interface SendLeadNotificationEmailOptions {
  to: string;             // The profile owner's email
  profileOwnerName: string; // The profile owner's name
  leadName: string;         // The lead's submitted name
  leadEmail: string;        // The lead's submitted email
  leadMessage: string;      // The lead's submitted message
}
export async function sendLeadNotificationEmail({ to, profileOwnerName, leadName, leadEmail, leadMessage }: SendLeadNotificationEmailOptions) {
  const subject = `You have a new lead on WhatsYour.Info!`;
  const content = `
    <h1>Hi, ${escapeHTML(profileOwnerName)}</h1>
    <p>Great news! Someone submitted their information through the lead capture form on your WhatsYour.Info profile.</p>
    <div class="detail-item">
      <strong>Name:</strong> ${escapeHTML(leadName)}
    </div>
    <div class="detail-item">
      <strong>Email:</strong> ${escapeHTML(leadEmail)}
    </div>
    ${leadMessage ? `
    <div class="detail-item">
      <strong>Message:</strong>
      <p style="margin: 4px 0 0 0;">${escapeHTML(leadMessage).replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}
    <p>You can view and manage all your leads from your dashboard.</p>
  `;
  await transporter.sendMail({
    from: `"WhatsYour.Info Leads" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html: createEmailTemplate(subject, content),
  });
}