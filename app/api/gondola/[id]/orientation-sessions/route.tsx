import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: fetch all orientation sessions for a gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gondolaId = params.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM "OrientationSession" WHERE "gondolaId" = $1 ORDER BY date DESC`,
      [gondolaId]
    );
    return NextResponse.json(rows);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: add a new orientation session for a gondola
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gondolaId = params.id;
  try {
    const body = await req.json();
    const { session_type, date, notes, instructor, max_participants, duration, location } = body;
    const { rows } = await pool.query(
      `INSERT INTO "OrientationSession" ("gondolaId", "session_type", date, notes, "instructor", "max_participants", duration, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [gondolaId, session_type, date, notes, instructor, max_participants ?? null, duration ?? null, location ?? null]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
