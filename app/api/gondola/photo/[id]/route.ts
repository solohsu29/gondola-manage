import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const result = await pool.query('SELECT "photoData", "photoName" FROM "Gondola" WHERE id = $1', [id]);
    if (result.rows.length === 0 || !result.rows[0].photoData) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    const photoBuffer: Buffer = result.rows[0].photoData;
    const photoName: string = result.rows[0].photoName;
    // Dynamically set content type
    let contentType = 'application/octet-stream';
    if (photoName) {
      const ext = photoName.split('.').pop()?.toLowerCase();
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
      else if (ext === 'png') contentType = 'image/png';
      else if (ext === 'gif') contentType = 'image/gif';
    }
    return new NextResponse(photoBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${photoName || 'photo'}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch photo' }, { status: 500 });
  }
}
