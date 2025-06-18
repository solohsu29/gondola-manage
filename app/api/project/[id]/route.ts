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

    // Fetch gondolas for this project using explicit join table
    const gondolaResult = await pool.query(`
      SELECT g.* FROM "Gondola" g
      JOIN "ProjectGondola" pg ON g.id = pg."gondolaId"
      WHERE pg."projectId" = $1
    `, [id]);
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
  const allowedFields = ['client', 'site', 'created', 'status','startDate', 'endDate', 'projectName', 'manager'];
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
      // Remove all existing many-to-many links for this project
      await pool.query('DELETE FROM "ProjectGondola" WHERE "projectId" = $1', [id]);
      // Link selected gondolas via the join table
      for (const gondola of body.gondolas) {
        const gondolaId = typeof gondola === 'string' ? gondola : gondola.id;
        if (!gondolaId) {
          console.warn('Skipping empty gondola ID for project', id);
          continue;
        }
        // Check project exists
        const projectCheck = await pool.query('SELECT 1 FROM "Project" WHERE id = $1', [id]);
        if (projectCheck.rowCount === 0) {
          console.warn('Project does not exist:', id);
          continue;
        }
        // Check gondola exists
        const gondolaCheck = await pool.query('SELECT 1 FROM "Gondola" WHERE id = $1', [gondolaId]);
        if (gondolaCheck.rowCount === 0) {
          console.warn('Gondola does not exist:', gondolaId);
          continue;
        }
   
        await pool.query('INSERT INTO "ProjectGondola" ("projectId", "gondolaId") VALUES ($1, $2) ON CONFLICT DO NOTHING', [id, gondolaId]);
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

// DELETE /api/project/[id] - delete a project by id
export async function DELETE(req: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    // Check if project exists
    const projectCheck = await pool.query('SELECT id FROM "Project" WHERE id = $1', [id]);
    if (projectCheck.rowCount === 0) {
      return NextResponse.json({ error: `Project with ID ${id} not found.` }, { status: 404 });
    }
    // Remove all join table links first
    await pool.query('DELETE FROM "ProjectGondola" WHERE "projectId" = $1', [id]);
    // Now delete the project
    await pool.query('DELETE FROM "Project" WHERE id = $1', [id]);
    return NextResponse.json({ message: 'Project deleted successfully', id });
  } catch (error) {
    let message = 'Unknown error occurred during project deletion.';
    if (error instanceof Error) {
      message = error.message;
    }
    console.error('Project delete error:', error);
    return NextResponse.json({ error: 'Failed to delete project.', details: message }, { status: 500 });
  }
}