import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest, context: { params: { id: string } }) {
  const documentId = context.params.id;

  if (!documentId) {
    return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
  }

  try {
    const query = `
      SELECT 
        name, 
        type, 
        title,
        "fileData"
      FROM "Document"
      WHERE id = $1;
    `;
    const result = await pool.query(query, [documentId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const document = result.rows[0];

    if (!document.fileData || !Buffer.isBuffer(document.fileData)) {
      return NextResponse.json({ error: 'File data is missing or invalid' }, { status: 500 });
    }

    const headers = new Headers();
    let mimeType = document.type || 'application/octet-stream';

    const fileName =document.name || document.title  || 'download';
    if (fileName.endsWith('.xlsx')) {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (fileName.endsWith('.xls')) {
      mimeType = 'application/vnd.ms-excel';
    } else if (fileName.endsWith('.csv')) {
      mimeType = 'text/csv';
    }
    headers.set('Content-Type', mimeType);
    // Inline for PDF and images, attachment for others (including Excel/CSV)
    let dispositionMode = 'attachment';
    if (mimeType.startsWith('image/') || mimeType === 'application/pdf') {
      dispositionMode = 'inline';
    }
    headers.set('Content-Disposition', `${dispositionMode}; filename="${fileName}"`);

    return new NextResponse(document.fileData, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error(`Error serving document ${documentId}:`, error);
    return NextResponse.json({ error: 'Failed to serve document' }, { status: 500 });
  }
}
