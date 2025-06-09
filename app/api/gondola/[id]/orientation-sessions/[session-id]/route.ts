import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// PUT: update an orientation session for a gondola
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; sessionId: string } }
) {
  const gondolaId = params.id;
  try {
    const body = await req.json();
    const { session_type, date, time, notes,instructor, max_participants, duration, location,sessionId } = body;
    // Combine date and time if both are present
    const fullDate = date && time ? `${date}T${time}` : date;

    // Debug logging
    console.log('PUT /orientation-sessions/:sessionId', { sessionId, gondolaId, body });
    const selectResult = await pool.query(
      `SELECT * FROM "OrientationSession" WHERE id = $1 AND "gondolaId" = $2`,
      [sessionId, gondolaId]
    );
    console.log('SELECT result:', selectResult.rows);

    const { rowCount } = await pool.query(
      `UPDATE "OrientationSession"
       SET session_type = $1, date = $2, notes = $3, instructor = $4, max_participants = $5, duration = $6, location = $7
       WHERE id = $8 AND "gondolaId" = $9`,
      [
        session_type,
        fullDate,
        notes,
       instructor,
        max_participants ?? null,
        duration ?? null,
        location ?? null,
        sessionId,
        gondolaId,
      ]
    );

    if (rowCount === 0) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
