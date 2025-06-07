import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const id = formData.get('id') as string;
    const file = formData.get('file') as File;

    if (!id || !file) {
      return NextResponse.json({ error: 'Missing id or file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optionally, you could check file.type for allowed types
    await pool.query('UPDATE gondola SET photo = $1, photo_url = $2 WHERE id = $3', [
      buffer,
      `/api/gondola/photo/${id}`,
      id,
    ]);

    return NextResponse.json({ message: 'Photo uploaded successfully', url: `/api/gondola/photo/${id}` });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
