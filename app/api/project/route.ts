import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/project - create a new project
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      client,
      site,
      created,
      status,
      endDate,
      projectName,
      projectManagerId,
      gondolas, // array of gondola IDs
      deliveryOrders // array of delivery order IDs
    } = body;

    // Insert the new project (now includes projectName and projectManagerId)
    const insertResult = await pool.query(
      `INSERT INTO "Project" (id, client, site, created, status, "endDate", "projectName", "projectManagerId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [id, client, site, created, status, endDate, projectName, projectManagerId]
    );
    const newProject = insertResult.rows[0];

    // Link delivery orders to this project
    if (Array.isArray(deliveryOrders)) {
      for (const doId of deliveryOrders) {
        await pool.query('UPDATE "DeliveryOrder" SET "projectId" = $1 WHERE id = $2', [id, typeof doId === 'string' ? doId : doId.id]);
      }
    }

    // Link gondolas to this project
    if (Array.isArray(gondolas)) {
      for (const gondolaId of gondolas) {
        await pool.query('UPDATE "Gondola" SET "projectId" = $1 WHERE id = $2', [id, typeof gondolaId === 'string' ? gondolaId : gondolaId.id]);
      }
    }

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}

// GET /api/project - fetch all projects with deliveryOrders and gondolas
export async function GET() {
  try {
    // Fetch projects
    const projectResult = await pool.query('SELECT * FROM "Project"');
    const projects = projectResult.rows;

    // Fetch delivery orders for all projects
    const doResult = await pool.query('SELECT * FROM "DeliveryOrder"');
    const deliveryOrders = doResult.rows;

    // Fetch gondolas for all projects
    const gondolaResult = await pool.query('SELECT * FROM "Gondola"');
    const gondolas = gondolaResult.rows;

    // Attach deliveryOrders and gondolas to each project using projectId
    const projectsWithDOsAndGondolas = projects.map(project => ({
      ...project,
      deliveryOrders: deliveryOrders.filter(doItem => doItem.projectId === project.id),
      gondolas: gondolas.filter(g => g.projectId === project.id),
    }));

    return NextResponse.json(projectsWithDOsAndGondolas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
