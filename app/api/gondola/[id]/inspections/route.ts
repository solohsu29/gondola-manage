import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/inspections - list all inspections for a gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: gondolaId } = params;
    const query = `SELECT id, "gondolaId", type, date, inspector, priority, notes, "notifyClient", "createdAt","time" FROM "Inspection" WHERE "gondolaId" = $1 ORDER BY date DESC`;
    const result = await pool.query(query, [gondolaId]);
    // Convert date fields to ISO strings for frontend
    const inspections = result.rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));
    return NextResponse.json(inspections);
  } catch (error) {
    console.error('Failed to fetch inspections for gondolaId:', params?.id, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch inspections' }, { status: 500 });
  }
}
