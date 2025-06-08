import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// POST /api/gondola/[id]/schedule-inspection
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  const gondolaId = context.params.id;
  try {
    const body = await req.json();
    const {
      inspectionType,
      inspectionDate,
      inspectionTime,
      inspector,
      priority,
      notes,
      notifyClient
    } = body;

    const inspectionId = uuidv4();
    const scheduledDateTime = new Date(`${inspectionDate}T${inspectionTime}`);
    const createdAt = new Date();
    // Insert into Inspection table (assuming such a table exists)
    await pool.query(
      'INSERT INTO "Inspection" (id, "gondolaId", type, date, time, inspector, priority, notes, "notifyClient", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        inspectionId,
        gondolaId,
        inspectionType,
        scheduledDateTime,
        inspectionTime, // store original string
        inspector,
        priority || 'normal',
        notes,
        notifyClient,
        createdAt
      ]
    );
    return NextResponse.json({ success: true, inspectionId });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ error: 'Failed to schedule inspection', details: message }, { status: 500 });
  }
}
