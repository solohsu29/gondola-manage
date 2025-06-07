import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola - fetch all gondolas
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM "Gondola"');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gondolas' }, { status: 500 });
  }
}

// POST /api/gondola - create a new gondola
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const serialNumber = formData.get('serialNumber') as string;
    const location = formData.get('location') as string;
    const locationDetail = formData.get('locationDetail') as string;
    const status = formData.get('status') as string;
    const lastInspection = formData.get('lastInspection') as string;
    const nextInspection = formData.get('nextInspection') as string;
    const imageFile = formData.get('image') as File | null;

    // Basic validation
    if (!serialNumber || !location || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare image data if present
    let photoName = null;
    let photoData = null;
    if (imageFile && typeof imageFile === 'object') {
      photoName = imageFile.name;
      // Read as ArrayBuffer
      const arrayBuffer = await imageFile.arrayBuffer();
      photoData = Buffer.from(arrayBuffer);
    }

    const id = crypto.randomUUID();
    const insertQuery = `
      INSERT INTO "Gondola" (
        "id", "serialNumber", "location", "locationDetail", "status", "lastInspection", "nextInspection", "photoName", "photoData"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [
      id,
      serialNumber,
      location,
      locationDetail || '',
      status,
      lastInspection ? new Date(lastInspection) : null,
      nextInspection ? new Date(nextInspection) : null,
      photoName,
      photoData
    ];
    const result = await pool.query(insertQuery, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Failed to create gondola', error);
    return NextResponse.json({ error: 'Failed to create gondola' }, { status: 500 });
  }
}
