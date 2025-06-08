import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/rental-details - fetch rental details for a gondola
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id: gondolaId } = context.params;
    // Fetch gondola details by id (no project join)
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
    const gondolaResult = await pool.query(gondolaQuery, [gondolaId]);
    const gondola = gondolaResult.rows[0] || null;

    // Convert date fields to ISO strings for frontend
    if (gondola) {
      if (gondola.lastInspection) gondola.lastInspection = new Date(gondola.lastInspection).toISOString();
      if (gondola.nextInspection) gondola.nextInspection = new Date(gondola.nextInspection).toISOString();
    }

    // Fetch all related projects via ProjectGondola (many-to-many)
    const projectIdsResult = await pool.query(
      `SELECT pg."projectId" FROM "ProjectGondola" pg WHERE pg."gondolaId" = $1`,
      [gondolaId]
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
      [gondolaId]
    );
    const inspections = inspectionsResult.rows.map((row: any) => ({
      ...row,
      date: row.date ? new Date(row.date).toISOString() : null,
      createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : null,
    }));

    return NextResponse.json({ gondola, projects, inspections });
  } catch (error) {
    console.error('Failed to fetch rental details for gondolaId:', context?.params?.id, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch rental details' }, { status: 500 });
  }
}
