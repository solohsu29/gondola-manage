import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/gondola/[id]/shift
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const gondolaId = context.params.id;
  try {
    const body = await req.json();
    const {
      newLocation,
      newLocationDetail,
      shiftDate,
      shiftReason,
      notes,
      currentLocation,
      currentLocationDetail
    } = body;

    // Update gondola's location and locationDetail
    await pool.query(
      'UPDATE "Gondola" SET location = $1, "locationDetail" = $2 WHERE id = $3',
      [newLocation, newLocationDetail, gondolaId]
    );

    // Insert shift history record (generate id, parse date, add shiftedBy)
    const { v4: uuidv4 } = require('uuid');
    const shiftHistoryId = uuidv4();
    const parsedShiftDate = shiftDate ? new Date(shiftDate) : new Date();
    const createdAt = new Date();
    const shiftedBy = 'system'; // TODO: Replace with real user if available

    await pool.query(
      'INSERT INTO "ShiftHistory" (id, "gondolaId", "fromLocation", "toLocation", "fromLocationDetail", "toLocationDetail", "shiftDate", reason, notes, "shiftedBy", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [
        shiftHistoryId,
        gondolaId,
        currentLocation,
        newLocation,
        currentLocationDetail,
        newLocationDetail,
        parsedShiftDate,
        shiftReason,
        notes,
        shiftedBy,
        createdAt
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ error: 'Failed to shift gondola', details: message }, { status: 500 });
  }
}

// GET /api/gondola/[id]/shift
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const gondolaId = context.params.id;
  try {
    const query = `SELECT * FROM "ShiftHistory" WHERE "gondolaId" = $1 ORDER BY "shiftDate" DESC`;
    let result;
    try {
      result = await pool.query(query, [gondolaId]);
    } catch (dbErr: any) {
      if (dbErr.code === '42P01') {
        // Table does not exist
        return NextResponse.json({ error: 'ShiftHistory table does not exist. Please run the necessary migrations.' }, { status: 500 });
      }
      throw dbErr;
    }
    // Convert date fields to ISO strings for frontend
    const shiftHistory = result.rows.map((row: any) => ({
      ...row,
      shiftDate: row.shiftDate ? new Date(row.shiftDate).toISOString().split('T')[0] : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));
    return NextResponse.json(shiftHistory);
  } catch (error) {
    console.error('Failed to fetch shift history for gondolaId:', gondolaId, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch shift history' }, { status: 500 });
  }
}
