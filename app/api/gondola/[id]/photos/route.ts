import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/photos - list all photos for a gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: gondolaId } = params;
    const query = `SELECT id, "fileName", "mimeType", uploaded, description, category, "fileData" FROM "Photo" WHERE "gondolaId" = $1 ORDER BY uploaded DESC`;
    const result = await pool.query(query, [gondolaId]);

    // Attach base64 file data for each photo
    const photosWithBase64 = result.rows.map((photo: any) => ({
      ...photo,
      fileDataBase64: photo.fileData ? Buffer.from(photo.fileData).toString('base64') : null,
    }));
    return NextResponse.json(photosWithBase64);
  } catch (error) {
    console.error('Failed to fetch photos for gondolaId:', params?.id, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch photos' }, { status: 500 });
  }
}

// POST /api/gondola/[id]/photos - upload a photo for a gondola
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: gondolaId } = params;
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string | null;
    const category = formData.get('category') as string | null;
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const insertQuery = `INSERT INTO "Photo" (id, "gondolaId", "fileName", "mimeType", uploaded, "fileData", description, category) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4, $5, $6) RETURNING id, "fileName", "mimeType", uploaded, description, category`;
    const values = [gondolaId, file.name, file.type, buffer, description, category];
    const result = await pool.query(insertQuery, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
  }
}
