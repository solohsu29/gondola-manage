import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const { id: projectId } = context.params; // Rename 'id' from context.params to 'projectId' for clarity

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const docName = formData.get('docName') as string | null;
    const docType = formData.get('docType') as string | null;
    const expiryDateString = formData.get('expiryDate') as string | null;
    const status = formData.get('status') as string | null;

    if (!file || !docName || !docType) {
      return NextResponse.json({ error: 'Missing file, document name, or document type.' }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const expiryDate = expiryDateString ? new Date(expiryDateString) : null;
    const documentId = uuidv4();
    const uploadedDate = new Date();

    // Check if the project exists first (using pool.query)
    const projectCheckResult = await pool.query('SELECT id FROM "Project" WHERE id = $1', [projectId]);
    if (projectCheckResult.rowCount === 0) {
      return NextResponse.json({ error: `Project with ID ${projectId} not found. Cannot upload document.` }, { status: 404 });
    }

    console.log('Received document upload for project:', projectId);
    console.log('Document Name:', docName);
    console.log('Document Type:', docType);
    console.log('File Name:', file.name);
    console.log('File Size:', file.size);
    console.log('Expiry Date:', expiryDate);
    console.log('Status:', status);

    // Insert document record
    // Note: Ensure column names match your schema. Case sensitivity matters for quoted identifiers.
    // 'name' and 'type' store the actual file's name and MIME type for download purposes.
    // 'title' and 'category' store user-provided metadata from the form.
    const insertQuery = `
      INSERT INTO "Document" (id, "projectId", name, type, title, category, uploaded, expiry, status, "fileData")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;
    await pool.query(insertQuery, [
      documentId,
      projectId,
      file.name,    // Actual filename
      file.type,    // Actual MIME type
      docName,      // User-provided title
      docType,      // User-provided category
      uploadedDate,
      expiryDate,   // Can be null
      status,       // Can be null
      fileBuffer
    ]);

    // After successful insert, construct fileUrl and update the record
    const fileUrl = `/api/document/${documentId}/serve`;
    const updateQuery = `UPDATE "Document" SET "fileUrl" = $1 WHERE id = $2`;
    await pool.query(updateQuery, [fileUrl, documentId]);

    return NextResponse.json({
      message: 'Document uploaded successfully',
      documentId: documentId,
      fileUrl: fileUrl,
      name: file.name,     // Original filename (for download)
      type: file.type,     // Original MIME type (for download)
      title: docName,      // User-provided title (for display)
      category: docType,   // User-provided category (for display)
      uploaded: uploadedDate,
      expiry: expiryDate,
      status: status
    });
  } catch (error) {
    let message = 'Unknown error occurred during file upload.';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('File upload error for project API:', error);
    return NextResponse.json({ error: 'Failed to process file upload.', details: message }, { status: 500 });
  }
}
