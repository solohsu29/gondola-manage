import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE /api/gondola/[id]/inspections/[inspectionId] - delete an inspection for a gondola
export async function DELETE(req: NextRequest, { params }: { params: { id: string, inspectionId: string } }) {
  try {
    const { id: gondolaId, inspectionId } = params;
    // Check if inspection exists
    const check = await pool.query('SELECT id FROM "Inspection" WHERE id = $1 AND "gondolaId" = $2', [inspectionId, gondolaId]);
    if (check.rowCount === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    // Delete inspection
    await pool.query('DELETE FROM "Inspection" WHERE id = $1 AND "gondolaId" = $2', [inspectionId, gondolaId]);
    return NextResponse.json({ success: true, id: inspectionId });
  } catch (error) {
    console.error('Failed to delete inspection:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete inspection' }, { status: 500 });
  }
}

// PUT /api/gondola/[id]/inspections/[inspectionId] - update an inspection for a gondola
export async function PUT(req: NextRequest, { params }: { params: { id: string, inspectionId: string } }) {
  try {
    const { id: gondolaId, inspectionId } = params;
    const body = await req.json();
    // Only allow updating these fields
    const allowedFields = ['type', 'date', 'time', 'inspector', 'priority', 'notes', 'notifyClient'];
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
    values.push(inspectionId, gondolaId);
    const updateQuery = `UPDATE "Inspection" SET ${updates.join(', ')} WHERE id = $${idx} AND "gondolaId" = $${idx + 1} RETURNING *`;
    const result = await pool.query(updateQuery, values);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }
    const updated = result.rows[0];
    // Convert date fields to ISO strings for frontend
    updated.date = updated.date ? new Date(updated.date).toISOString() : null;
    updated.createdAt = updated.createdAt ? new Date(updated.createdAt).toISOString() : null;
    // Return the time field as well
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update inspection:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update inspection' }, { status: 500 });
  }
}
