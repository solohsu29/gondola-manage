import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// Get a single project by ID with deliveryOrders and gondolas
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id;
  try {
    // Fetch project
    const projectResult = await pool.query('SELECT * FROM "Project" WHERE id = $1', [id]);
    if (projectResult.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    const project = projectResult.rows[0];

    // Fetch delivery orders for this project
    const doResult = await pool.query('SELECT * FROM "DeliveryOrder" WHERE "projectId" = $1', [id]);
    const deliveryOrders = doResult.rows;

    // Fetch gondolas for this project
    const gondolaResult = await pool.query('SELECT * FROM "Gondola" WHERE "projectId" = $1', [id]);
    const gondolas = gondolaResult.rows;

    const projectWithDOsAndGondolas = {
      ...project,
      deliveryOrders,
      gondolas,
    };
    return NextResponse.json(projectWithDOsAndGondolas);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

// Update a project by ID
export async function PUT(req: NextRequest, context: { params: { id: string } }) {
  const id = context.params.id;
  const body = await req.json();

  // Build dynamic SQL for partial update
  const allowedFields = ['client', 'site', 'created', 'status', 'endDate', 'projectName', 'projectManagerId'];
  const updates = [];
  const values = [];
  let idx = 1;
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updates.push(`"${key}" = $${idx}`);
      values.push(body[key]);
      idx++;
    }
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  values.push(id);
  const query = `UPDATE "Project" SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`;
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    // After updating the project, update related gondolas
    if (Array.isArray(body.gondolas)) {
      // Unlink all gondolas from this project first
      await pool.query('UPDATE "Gondola" SET "projectId" = NULL WHERE "projectId" = $1', [id]);
      // Link selected gondolas
      for (const gondola of body.gondolas) {
        const gondolaId = typeof gondola === 'string' ? gondola : gondola.id;
        await pool.query('UPDATE "Gondola" SET "projectId" = $1 WHERE id = $2', [id, gondolaId]);
      }
    }
    // Update related delivery orders
    if (Array.isArray(body.deliveryOrders)) {
      await pool.query('UPDATE "DeliveryOrder" SET "projectId" = NULL WHERE "projectId" = $1', [id]);
      for (const doItem of body.deliveryOrders) {
        const doId = typeof doItem === 'string' ? doItem : doItem.id;
        await pool.query('UPDATE "DeliveryOrder" SET "projectId" = $1 WHERE id = $2', [id, doId]);
      }
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update project', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
