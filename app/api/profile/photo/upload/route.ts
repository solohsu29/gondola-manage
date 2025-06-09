import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJwt } from '@/app/utils/jwt';

// POST /api/profile/photo/upload
export async function POST(req: NextRequest) {
  // Authenticate user
  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File exceeds 10MB size limit' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name;
    const mimeType = file.type;
    // Update profile with photo data and photoUrl
    const photoUrl = `/api/profile/photo/serve/${user.id}`;
    await pool.query(
      'UPDATE "Profile" SET "photoData" = $1, "photoName" = $2, "photoMimeType" = $3, "photoUrl" = $4, "updatedAt" = NOW() WHERE "userId" = $5',
      [buffer, fileName, mimeType, photoUrl, user.id]
    );
    return NextResponse.json({ message: 'Profile photo uploaded successfully', url: photoUrl });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload profile photo' }, { status: 500 });
  }
}
