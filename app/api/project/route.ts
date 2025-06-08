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

    // Link gondolas to this project using ProjectGondola join table
    if (Array.isArray(gondolas)) {
      for (const gondola of gondolas) {
        const gondolaId = typeof gondola === 'string' ? gondola : gondola.id;
        if (!gondolaId) continue;
        await pool.query('INSERT INTO "ProjectGondola" ("projectId", "gondolaId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, gondolaId]);
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

    // Fetch all project-gondola links from the join table
    const projectGondolaResult = await pool.query('SELECT * FROM "ProjectGondola"');
    const projectGondolaLinks = projectGondolaResult.rows;

    // Attach deliveryOrders and gondolas (via join table) to each project
    const projectsWithDOsAndGondolas = projects.map(project => ({
      ...project,
      deliveryOrders: deliveryOrders.filter(doItem => doItem.projectId === project.id),
      gondolas: projectGondolaLinks
        .filter(link => link.projectId === project.id)
        .map(link => gondolas.find(g => g.id === link.gondolaId))
        .filter(Boolean),
    }));

    return NextResponse.json(projectsWithDOsAndGondolas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
