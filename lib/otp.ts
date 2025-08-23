import clientPromise from '@/lib/mongodb';
import crypto from 'crypto';
import { sendOtpEmail } from '@/lib/email';
import { ObjectId } from 'mongodb';

// This function can be called from anywhere on the server
export async function generateAndSendOtp(
  userId: ObjectId,
  email: string,
  username: string
) {
  try {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    // Store OTP in the user's document
    await db.collection('users').updateOne(
      { _id: userId },
      {
        $set: {
          loginOtp: otp,
          loginOtpExpires: otpExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send the email
    await sendOtpEmail({ to: email, otp, name: username });

    return { success: true };
  } catch (error) {
    console.error('Error in generateAndSendOtp:', error);
    return { success: false, error: 'Failed to send OTP' };
  }
}