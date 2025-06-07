import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/documents - fetch all documents for a gondola
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id } = context.params;
    const query = `SELECT * FROM "Document" WHERE "gondolaId" = $1 ORDER BY "uploaded" DESC`;
    const result = await pool.query(query, [id]);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}
// POST /api/gondola/[id]/documents - upload a document for a gondola
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id: gondolaId } = context.params;
    const formData = await req.formData();
    const docType = formData.get('type') as string; // user-provided category
    const file = formData.get('file') as File;
    const docName = formData.get('name') as string; // user-provided title
    const expiryDate = formData.get('expiry') as string;
    const notes = formData.get('notes') as string;

    if (!docType || !file) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);
    const uploadedDate = new Date().toISOString();
    const status = expiryDate ? (new Date(expiryDate) > new Date() ? 'Valid' : 'Expired') : 'Valid';
    const documentId = randomUUID();

    // Insert document record
    const insertQuery = `
      INSERT INTO "Document" (id, "gondolaId", name, type, title, category, uploaded, expiry, status, "fileData", notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *;
    `;
    const values = [
      documentId,
      gondolaId,
      file.name,    // Actual filename
      file.type,    // Actual MIME type
      docName,      // User-provided title
      docType,      // User-provided category
      uploadedDate,
      expiryDate,   // Can be null
      status,       // Can be null
      fileBuffer,
      notes
    ];

    const result = await pool.query(insertQuery, values);
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Failed to upload document:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to upload document', details: error?.message || error }, { status: 500 });
  }
}