import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Update an existing document
export async function PUT(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id: projectId, docId: documentId } = context.params;
  try {
    const data = await req.json();
    const { title, category, expiry, notes } = data;

    // Validate document exists for this project
    const docCheck = await pool.query('SELECT id FROM "Document" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);
    if (docCheck.rowCount === 0) {
      return NextResponse.json({ error: `Document with ID ${documentId} not found for project ${projectId}.` }, { status: 404 });
    }

    // Update document fields (expiry can be null or string)
    const updateQuery = `
      UPDATE "Document"
      SET title = $1, category = $2, expiry = $3, notes = $4
      WHERE id = $5 AND "projectId" = $6
      RETURNING id, title, category, expiry, notes
    `;
    const result = await pool.query(updateQuery, [title, category, expiry || null, notes || null, documentId, projectId]);

    return NextResponse.json({
      message: 'Document updated successfully',
      document: result.rows[0],
    });
  } catch (error) {
    let message = 'Unknown error occurred during document update.';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('Document update error for project API:', error);
    return NextResponse.json({ error: 'Failed to update document.', details: message }, { status: 500 });
  }
}
// Delete a document by ID for a project
export async function DELETE(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id: projectId, docId: documentId } = context.params;
  try {
    // Check if document exists for this project
    const docCheck = await pool.query('SELECT id FROM "Document" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);
    if (docCheck.rowCount === 0) {
      return NextResponse.json({ error: `Document with ID ${documentId} not found for project ${projectId}.` }, { status: 404 });
    }
    // Delete the document
    await pool.query('DELETE FROM "Document" WHERE id = $1 AND "projectId" = $2', [documentId, projectId]);
    return NextResponse.json({ message: 'Document deleted successfully', id: documentId });
  } catch (error) {
    let message = 'Unknown error occurred during document deletion.';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('Document delete error for project API:', error);
    return NextResponse.json({ error: 'Failed to delete document.', details: message }, { status: 500 });
  }
}