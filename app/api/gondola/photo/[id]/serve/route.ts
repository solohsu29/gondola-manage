import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/photo/[id]/serve - serve a photo by id
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const query = `SELECT "fileData", "fileName", "mimeType" FROM "Photo" WHERE id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }
    const photo = result.rows[0];
    const headers = new Headers();
    headers.set('Content-Type', photo.mimeType || 'application/octet-stream');
    headers.set('Content-Disposition', `inline; filename="${photo.fileName || 'photo'}"`);
    return new NextResponse(photo.fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to serve photo' }, { status: 500 });
  }
}
