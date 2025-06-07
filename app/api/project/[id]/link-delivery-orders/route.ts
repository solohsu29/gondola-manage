import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST /api/project/[id]/link-delivery-orders
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  let deliveryOrderIds: string[] = [];
  try {
    const body = await req.json();
    deliveryOrderIds = body.deliveryOrderIds;
    if (!Array.isArray(deliveryOrderIds)) {
      return NextResponse.json({ error: 'Invalid delivery order IDs' }, { status: 400 });
    }
    // 1. Unlink all delivery orders from this project that are NOT in the new list
    await pool.query(
      'UPDATE "DeliveryOrder" SET "projectId" = NULL WHERE "projectId" = $1 AND NOT (id = ANY($2::text[]))',
      [projectId, deliveryOrderIds]
    );
    // 2. Link all delivery orders in the new list to this project
    if (deliveryOrderIds.length > 0) {
      await pool.query(
        'UPDATE "DeliveryOrder" SET "projectId" = $1 WHERE id = ANY($2::text[])',
        [projectId, deliveryOrderIds]
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    let message = 'Unknown error';
    if (error instanceof Error) message = error.message;
    return NextResponse.json({ error: 'Failed to link delivery orders', details: message }, { status: 500 });
  }
}
