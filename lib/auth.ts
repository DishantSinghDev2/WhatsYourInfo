import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import clientPromise from './mongodb';
import { ObjectId } from 'mongodb';

const JWT_SECRET = process.env.JWT_SECRET;

export interface User {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  isProUser: boolean;
  customDomain?: string;
  emailVerified: boolean;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  verifiedAccounts: {
    service: string; // e.g., 'twitter', 'github'
    username: string;
    url: string;
  }[];
  interests: string[];
  wallet: {
    paymentType: string; // e.g., 'paypal', 'btc'
    address: string;
  }[];
  gallery: {
    imageUrl: string;
    caption: string;
  }[];
  design: {
    theme: string; // e.g., 'classic', 'sunset'
    customColors: {
      background: string;
      surface: string;
      accent: string;
    };
    headerImage: string;
    backgroundImage: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload | string {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch  {
    return null;
  }
}

export async function getUserFromToken(request: NextRequest): Promise<User | null> {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const decoded = verifyToken(token) as JwtPayload;
    if (!decoded) return null;

    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } }
    );


    return user as unknown as User;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function createUser(userData: {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
}): Promise<User> {
  const client = await clientPromise;
  const db = client.db('whatsyourinfo');

  const hashedPassword = await hashPassword(userData.password);

  const user = {
    ...userData,
    password: hashedPassword,
    bio: '',
    avatar: '',
    isProUser: false,
    emailVerified: false,
    socialLinks: {},
    verifiedAccounts: [],
    interests: [],
    wallet: [],
    gallery: [],
    design: {
      theme: 'classic',
      customColors: { background: '#ffffff', surface: '#f8f9fa', accent: '#007bff' },
      headerImage: '',
      backgroundImage: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.collection('users').insertOne(user);

  const response = await fetch(`${process.env.FRONTEND_URL || `localhost:3000`}/api/auth/send-otp`, {
    method: "POST",
    body: JSON.stringify({
      email: user.email
    })
  })

  if (!response.ok){
    throw new Error("Failed to send OTP")
  }

  return {
    ...user,
    _id: result.insertedId.toString(),
  } as User;
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    const user = await db.collection('users').findOne({ email });
    if (!user) return null;

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) return null;

    // Remove password from returned user
    const { ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      password: undefined,
      _id: user._id.toString(),
    } as unknown as User;
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}