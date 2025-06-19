import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola - fetch all gondolas with linked projects
export async function GET() {
  try {
    // Fetch all gondolas
    const gondolaResult = await pool.query('SELECT * FROM "Gondola"');
    const gondolas = gondolaResult.rows;

    // Fetch all project-gondola links
    const projectGondolaResult = await pool.query('SELECT * FROM "ProjectGondola"');
    const projectGondolaLinks = projectGondolaResult.rows;

    // Fetch all projects
    const projectResult = await pool.query('SELECT * FROM "Project"');
    const projects = projectResult.rows;
console.log('gondolas',gondolas)
    // Attach projects array and base64 photo (from Photo table) to each gondola
    const gondolasWithProjects = await Promise.all(gondolas.map(async gondola => {
      // Fetch first photo for this gondola
      const photoResult = await pool.query(
        'SELECT "fileData" FROM "Photo" WHERE "gondolaId" = $1 ORDER BY uploaded DESC LIMIT 1',
        [gondola.id]
      );
      const firstPhoto = photoResult.rows[0];
      return {
        ...gondola,
        createdAt: gondola.createdAt ? new Date(gondola.createdAt).toISOString() : null,
        projects: projectGondolaLinks
          .filter((link: any) => link.gondolaId === gondola.id)
          .map((link: any) => projects.find((p: any) => p.id === link.projectId))
          .filter(Boolean),
        photoDataBase64: gondola.photoData
          ? Buffer.from(gondola.photoData).toString('base64')
          : (firstPhoto && firstPhoto.fileData ? Buffer.from(firstPhoto.fileData).toString('base64') : null),
      };
    }));
    return NextResponse.json(gondolasWithProjects);
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

    // Uniqueness check for serialNumber
    const serialCheck = await pool.query('SELECT 1 FROM "Gondola" WHERE "serialNumber" = $1', [serialNumber]);
    if ((serialCheck.rowCount ?? 0) > 0) {
      return NextResponse.json({ error: 'A gondola with this serial number already exists.' }, { status: 409 });
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
      RETURNING *, "createdAt";
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
    let gondola = result.rows[0];
    if (gondola && gondola.createdat) {
      gondola = { ...gondola, createdAt: new Date(gondola.createdAt).toISOString() };
    }

    // Insert into Photo table if image was uploaded
    if (imageFile && typeof imageFile === 'object' && photoData) {
      const photoInsertQuery = `
        INSERT INTO "Photo" (id, "gondolaId", "fileName", "mimeType", uploaded, "fileData")
        VALUES (gen_random_uuid(), $1, $2, $3, NOW(), $4)
      `;
      await pool.query(photoInsertQuery, [gondola.id, imageFile.name, imageFile.type, photoData]);
    }

    return NextResponse.json(gondola, { status: 201 });
  } catch (error) {
    console.error('Failed to create gondola', error);
    const err = error as any;
    // Handle unique constraint violation (duplicate serial number)
    if (err.code === '23505' && err.detail && err.detail.includes('Gondola_serialNumber_key')) {
      return NextResponse.json({ error: 'A gondola with this serial number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create gondola', details: err instanceof Error ? err.message : err }, { status: 500 });
  }
}
