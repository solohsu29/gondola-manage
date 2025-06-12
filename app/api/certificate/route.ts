import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: Request) {
  try {
    const query = `
      SELECT d.id, d.title, d.expiry, d."gondolaId", d.category, d.type, d.status, g."serialNumber"
      FROM "Document" d
      LEFT JOIN "Gondola" g ON d."gondolaId" = g.id
      WHERE (
        d.category ILIKE '%Certificate%' OR
        d.type ILIKE '%Certificate%' OR
        d.title ILIKE '%Certificate%'
      )
      ORDER BY d."expiry" ASC NULLS LAST
    `;
    const result = await pool.query(query);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Certificate API error:', error);
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}