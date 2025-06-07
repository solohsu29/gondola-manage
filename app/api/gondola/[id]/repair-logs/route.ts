import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/repair-logs - list all repair logs for a gondola
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id: gondolaId } = context.params;
    const query = `SELECT id, "gondolaid", date, type, description, "partname", cost, "ischargeable", technician, status FROM "RepairLog" WHERE "gondolaid" = $1 ORDER BY date DESC`;
    let result;
    try {
      result = await pool.query(query, [gondolaId]);
    } catch (dbErr: any) {
      if (dbErr.code === '42P01') {
        // Table does not exist
        return NextResponse.json({ error: 'RepairLog table does not exist. Please run the necessary migrations.' }, { status: 500 });
      }
      throw dbErr;
    }
    // Convert date fields to ISO strings for frontend
    const repairLogs = result.rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : null,
    }));
    return NextResponse.json(repairLogs);
  } catch (error) {
    console.error('Failed to fetch repair logs for gondolaId:', context?.params?.id, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch repair logs' }, { status: 500 });
  }
}

// POST /api/gondola/[id]/repair-logs - add a new repair log for a gondola
export async function POST(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id: gondolaId } = context.params;
    const body = await req.json();
    const { date, type, description, partName, cost, isChargeable, technician, status } = body;
    if (!date || !type || !description || !cost || !technician || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const insertQuery = `INSERT INTO "RepairLog" (id, "gondolaid", date, type, description, "partname", cost, "ischargeable", technician, status) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, "gondolaid", date, type, description, "partname", cost, "ischargeable", technician, status`;
    const values = [
      gondolaId,
      date,
      type,
      description,
      partName,
      cost,
      isChargeable,
      technician,
      status,
    ];
    let result;
    try {
      result = await pool.query(insertQuery, values);
    } catch (dbErr: any) {
      if (dbErr.code === '42P01') {
        // Table does not exist
        return NextResponse.json({ error: 'RepairLog table does not exist. Please run the necessary migrations.' }, { status: 500 });
      }
      throw dbErr;
    }
    const row = result.rows[0];
    row.date = row.date ? new Date(row.date).toISOString().split('T')[0] : null;
    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Failed to add repair log:', error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to add repair log' }, { status: 500 });
  }
}
