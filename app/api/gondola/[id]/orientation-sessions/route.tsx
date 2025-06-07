import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET: fetch all orientation sessions for a gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const gondolaId = params.id;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM orientation_sessions WHERE gondola_id = $1 ORDER BY date DESC`,
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
    const { session_type, date, notes, conducted_by, maxParticipants, duration, location } = body;
    const { rows } = await pool.query(
      `INSERT INTO orientation_sessions (gondola_id, session_type, date, notes, conducted_by, "maxParticipants", duration, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [gondolaId, session_type, date, notes, conducted_by, maxParticipants ?? null, duration ?? null, location ?? null]
    );
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
