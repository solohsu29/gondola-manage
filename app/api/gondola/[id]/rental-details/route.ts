import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET /api/gondola/[id]/rental-details - fetch rental details for a gondola
export async function GET(req: NextRequest, context: { params: { id: string } }) {
  try {
    const { id: gondolaId } = context.params;
    // Fetch gondola rental details from Gondola table (with project manager info)
    const rentalQuery = `
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
        g."projectId",
        p."projectName" as "projectName",
        p."created" as "startDate",
        p."endDate" as "endDate",
        p."client" as "clientName",
        p."projectManagerId",
        u.name as "projectManagerName",
        u.email as "projectManagerEmail"
      FROM "Gondola" g
      LEFT JOIN "Project" p ON g."projectId" = p.id
      LEFT JOIN "User" u ON p."projectManagerId" = u.id
      WHERE g.id = $1
    `;
    const billingQuery = `SELECT * FROM "BillingHistory" WHERE "gondolaId" = $1 ORDER BY "startDate" DESC`;

    const rentalResult = await pool.query(rentalQuery, [gondolaId]);
    const billingResult = await pool.query(billingQuery, [gondolaId]);

    const rentalDetail = rentalResult.rows[0] || null;
    const billingHistory = billingResult.rows || [];

    // Convert date fields to ISO strings for frontend
    if (rentalDetail) {
      if (rentalDetail.lastInspection) rentalDetail.lastInspection = new Date(rentalDetail.lastInspection).toISOString();
      if (rentalDetail.nextInspection) rentalDetail.nextInspection = new Date(rentalDetail.nextInspection).toISOString();
    }
    billingHistory.forEach((row: any) => {
      if (row.startDate) row.startDate = new Date(row.startDate).toISOString().split('T')[0];
      if (row.endDate) row.endDate = new Date(row.endDate).toISOString().split('T')[0];
      if (row.paidDate) row.paidDate = new Date(row.paidDate).toISOString().split('T')[0];
      if (row.invoiceDate) row.invoiceDate = new Date(row.invoiceDate).toISOString().split('T')[0];
    });

    return NextResponse.json({ rentalDetail, billingHistory });
  } catch (error) {
    console.error('Failed to fetch rental details for gondolaId:', context?.params?.id, error);
    return NextResponse.json({ error: (error as Error).message || 'Failed to fetch rental details' }, { status: 500 });
  }
}
