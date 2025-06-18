import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT /api/gondola/[id]/repair-logs/[repairLogId] - update a repair log for a gondola
export async function PUT(req: NextRequest, context: { params: { id: string, repairLogId: string } }) {
  try {
    const { id: gondolaId, repairLogId } = context.params;
    const body = await req.json();
    const { date, type, description, partName, cost, isChargeable, technician, status } = body;
    // Check if repair log exists
    const check = await pool.query('SELECT id FROM "RepairLog" WHERE id = $1 AND "gondolaId" = $2', [repairLogId, gondolaId]);
    if (check.rowCount === 0) {
      return NextResponse.json({ error: 'Repair log not found' }, { status: 404 });
    }
    const updateQuery = `UPDATE "RepairLog" SET date = $1, type = $2, description = $3, "partName" = $4, cost = $5, "isChargeable" = $6, technician = $7, status = $8 WHERE id = $9 AND "gondolaId" = $10 RETURNING *`;
    const values = [date, type, description, partName, cost, isChargeable, technician, status, repairLogId, gondolaId];
    const result = await pool.query(updateQuery, values);
    // Return date as plain string (no timezone conversion)
    const row = result.rows[0];
    if (row && row.date) {
      if (typeof row.date === 'string') {
        row.date = row.date.slice(0, 10);
      } else if (row.date instanceof Date) {
        row.date = row.date.toISOString().slice(0, 10);
      }
    }
    return NextResponse.json(row);
  } catch (error) {
    console.error('Failed to update repair log:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to update repair log' }, { status: 500 });
  }
}

// DELETE /api/gondola/[id]/repair-logs/[repairLogId] - delete a repair log for a gondola
export async function DELETE(req: NextRequest, context: { params: { id: string, repairLogId: string } }) {
  try {
    const { id: gondolaId, repairLogId } = context.params;
    // Check if repair log exists
    const check = await pool.query('SELECT id FROM "RepairLog" WHERE id = $1 AND "gondolaId" = $2', [repairLogId, gondolaId]);
    if (check.rowCount === 0) {
      return NextResponse.json({ error: 'Repair log not found' }, { status: 404 });
    }
    await pool.query('DELETE FROM "RepairLog" WHERE id = $1 AND "gondolaId" = $2', [repairLogId, gondolaId]);
    return NextResponse.json({ success: true, id: repairLogId });
  } catch (error) {
    console.error('Failed to delete repair log:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to delete repair log' }, { status: 500 });
  }
}
