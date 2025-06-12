import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE /api/delivery-order/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const result = await pool.query('DELETE FROM "DeliveryOrder" WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete delivery order', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}

// PUT /api/delivery-order/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  const body = await req.json();
  // Only allow updating certain fields
  const allowedFields = ['number', 'client', 'site', 'orderDate', 'deliveryDate', 'poReference', 'amount', 'status'];
  const updates = [];
  const values = [];
  let idx = 1;
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      if (key === 'orderDate' || key === 'deliveryDate') {
        // Store only the YYYY-MM-DD part
        let dateStr = body[key];
        if (typeof dateStr === 'string' && dateStr.length >= 10) {
          dateStr = dateStr.slice(0, 10);
        }
        updates.push(`"${key}" = $${idx}`);
        values.push(dateStr);
      } else {
        updates.push(`"${key}" = $${idx}`);
        values.push(body[key]);
      }
      idx++;
    }
  }
  if (updates.length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }
  try {
    const result = await pool.query(
      `UPDATE "DeliveryOrder" SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      [...values, id]
    );
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Delivery order not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update delivery order', details: error instanceof Error ? error.message : error }, { status: 500 });
  }
}
