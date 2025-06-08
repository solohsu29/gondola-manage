import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id] - fetch single gondola
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    // Fetch gondola (no project join, just the gondola)
    const gondolaQuery = `
      SELECT 
        g.id,
        g."serialNumber",
        g."location",
        g."locationDetail",
        g.status,
        g."lastInspection",
        g."nextInspection",
        g."photoData",
        g."photoName",
        g."projectId"
      FROM "Gondola" g
      WHERE g.id = $1
    `;
    const gondolaResult = await pool.query(gondolaQuery, [id]);
    const gondola = gondolaResult.rows[0] || null;
    if (!gondola) {
      return NextResponse.json({ error: 'Gondola not found' }, { status: 404 });
    }
    // Convert date fields to ISO strings for frontend
    if (gondola.lastInspection) gondola.lastInspection = new Date(gondola.lastInspection).toISOString();
    if (gondola.nextInspection) gondola.nextInspection = new Date(gondola.nextInspection).toISOString();

    // Fetch all related projects via ProjectGondola (many-to-many)
    const projectIdsResult = await pool.query(
      `SELECT pg."projectId" FROM "ProjectGondola" pg WHERE pg."gondolaId" = $1`,
      [id]
    );
    const projectIds = projectIdsResult.rows.map((row: any) => row.projectId);
    let projects = [];
    if (projectIds.length > 0) {
      const projectsResult = await pool.query(
        `SELECT * FROM "Project" WHERE id = ANY($1)`,
        [projectIds]
      );
      projects = projectsResult.rows;
    }

    // Fetch all inspections for this gondola
    const inspectionsResult = await pool.query(
      `SELECT id, "gondolaId", type, date, inspector, priority, notes, "notifyClient", "createdAt", "time" FROM "Inspection" WHERE "gondolaId" = $1 ORDER BY date DESC`,
      [id]
    );
    const inspections = inspectionsResult.rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ gondola, projects, inspections });
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
    await pool.query('DELETE FROM "ProjectGondola" WHERE "gondolaId" = $1', [id]);
    await pool.query('DELETE FROM "Photo" WHERE "gondolaId" = $1', [id]);

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
