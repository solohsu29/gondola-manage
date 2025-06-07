import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id] - fetch single gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    const query = `
      SELECT g.*, p."projectManagerId", u.name as "projectManagerName", u.email as "projectManagerEmail"
      FROM "Gondola" g
      LEFT JOIN "Project" p ON g."projectId" = p.id
      LEFT JOIN "User" u ON p."projectManagerId" = u.id
      WHERE g.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Gondola not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch gondola' }, { status: 500 });
  }
}

// PUT /api/gondola/[id] - update gondola
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  let body: any = {};
  try {
    const { id } = await params;
    body = await req.json();
    const {
      serialNumber,
      location,
      locationDetail,
      status,
      lastInspection,
      nextInspection
    } = body;
    const result = await pool.query(
      `UPDATE "Gondola" SET "serialNumber"=$1, "location"=$2, "locationDetail"=$3, "status"=$4, "lastInspection"=$5, "nextInspection"=$6 WHERE id=$7 RETURNING *`,
      [serialNumber, location, locationDetail, status, lastInspection, nextInspection, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Gondola not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update gondola:', error, '\nRequest body:', JSON.stringify(body));
    return NextResponse.json({ error: 'Failed to update gondola', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

// DELETE /api/gondola/[id] - delete gondola
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    // Manually delete all related records due to ON DELETE RESTRICT on foreign keys
    await pool.query('DELETE FROM "Inspection" WHERE "gondolaId" = $1', [id]);
    await pool.query('DELETE FROM "Certificate" WHERE "gondolaId" = $1', [id]);
    await pool.query('DELETE FROM "ShiftHistory" WHERE "gondolaId" = $1', [id]);
    await pool.query('UPDATE "Document" SET "gondolaId" = NULL WHERE "gondolaId" = $1', [id]); // ON DELETE SET NULL for Document

    const result = await pool.query('DELETE FROM "Gondola" WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Gondola not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete gondola:', error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to delete gondola', details: errMsg }, { status: 500 });
  }
}
