import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT /api/gondola/[id]/documents/[docId] - update a document for a gondola
export async function PUT(req: NextRequest, context: { params: { id: string, docId: string } }) {
  try {
    const { id: gondolaId, docId } = context.params;
    const body = await req.json();
    // Only allow updating these fields
    const allowedFields = ['title', 'category', 'expiry', 'notes', 'status'];
    const updates = [];
    const values = [];
    let idx = 1;
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates.push(`"${field}" = $${idx}`);
        values.push(body[field]);
        idx++;
      }
    }
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    const result = await pool.query(
      `UPDATE "Document" SET ${updates.join(', ')} WHERE id = $${idx} AND "gondolaId" = $${idx + 1} RETURNING *`,
      [...values, docId, gondolaId]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update document', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
// DELETE /api/gondola/[id]/documents/[docId] - delete a document for a gondola
export async function DELETE(req: NextRequest, context: { params: { id: string; docId: string } }) {
  const { id: gondolaId, docId: documentId } = context.params;
  try {
    // Check if document exists for this gondola
    const docCheck = await pool.query('SELECT id FROM "Document" WHERE id = $1 AND "gondolaId" = $2', [documentId, gondolaId]);
    if (docCheck.rowCount === 0) {
      return NextResponse.json({ error: `Document with ID ${documentId} not found for gondola ${gondolaId}.` }, { status: 404 });
    }
    // Delete the document
    await pool.query('DELETE FROM "Document" WHERE id = $1 AND "gondolaId" = $2', [documentId, gondolaId]);
    return NextResponse.json({ message: 'Document deleted successfully', id: documentId });
  } catch (error) {
    let message = 'Unknown error occurred during document deletion.';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('Document delete error for gondola API:', error);
    return NextResponse.json({ error: 'Failed to delete document.', details: message }, { status: 500 });
  }
}