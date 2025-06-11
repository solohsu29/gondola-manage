import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Try to order by updatedAt DESC, fallback to orderDate DESC if updatedAt is missing
let result;
try {
  result = await pool.query(`
    SELECT d.*, doc.title as "documentTitle", doc.name as "documentName"
    FROM "DeliveryOrder" d
    LEFT JOIN "Document" doc ON d."documentId" = doc.id
    ORDER BY d."updatedAt" DESC
  `);
} catch (err) {
  // If updatedAt column does not exist, fallback to orderDate
  result = await pool.query(`
    SELECT d.*, doc.title as "documentTitle", doc.name as "documentName"
    FROM "DeliveryOrder" d
    LEFT JOIN "Document" doc ON d."documentId" = doc.id
    ORDER BY d."orderDate" DESC
  `);
}
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch delivery orders' }, { status: 500 });
  }
}
