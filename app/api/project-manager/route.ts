import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/project-manager - fetch all project managers
export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM "ProjectManager" ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch project managers' }, { status: 500 });
  }
}

// POST /api/project-manager - create a new project manager
export async function POST(req: NextRequest) {
  try {
    const { name, email, phone } = await req.json();
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    const result = await pool.query(
      'INSERT INTO "ProjectManager" (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project manager' }, { status: 500 });
  }
}
