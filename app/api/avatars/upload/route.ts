import { NextRequest, NextResponse } from 'next/server';
import { getUserFromToken } from '@/lib/auth';
import clientPromise from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Upload to Cloudflare R2
    const avatarUrl = await uploadToCloudflareR2(file, user.username);

    // Update user's avatar in database
    const client = await clientPromise;
    const db = client.db('whatsyourinfo');

    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          avatar: avatarUrl,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: `https://whatsyour.info/api/avatars/${user.username}`
    });

  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}

async function uploadToCloudflareR2(file: File, username: string): Promise<string> {
  // This would integrate with Cloudflare R2 API
  // For now, we'll simulate the upload and return a path
  
  const fileExtension = file.name.split('.').pop() || 'jpg';
  const fileName = `avatars/${username}-${Date.now()}.${fileExtension}`;
  
  // TODO: Implement actual Cloudflare R2 upload
  // const uploadResponse = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${fileName}`, {
  //   method: 'PUT',
  //   headers: {
  //     'Authorization': `Bearer ${process.env.CLOUDFLARE_R2_TOKEN}`,
  //     'Content-Type': file.type,
  //   },
  //   body: file,
  // });

  // For development, return a simulated path
  return fileName;
}