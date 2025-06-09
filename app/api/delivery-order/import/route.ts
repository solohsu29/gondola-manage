import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import pool from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    // Parse multipart form
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const manualEntryJson = formData.get('manualEntry') as string;
    const manualEntry = JSON.parse(manualEntryJson);

    // Save file buffer and metadata directly in the database
    const buffer = Buffer.from(await file.arrayBuffer());
    const id = randomUUID();
    const date = manualEntry.date ? manualEntry.date : new Date();
    await pool.query(
      `INSERT INTO "DeliveryOrder"
        (id, number, client, site, date, "orderDate", "deliveryDate", "poReference", status, amount, items, "fileName", "fileType", "fileData", "fileUrl", "projectId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
      [
        id,
        manualEntry.number || '',
        manualEntry.client || '',
        manualEntry.site || '',
        date,
        manualEntry.orderDate ? manualEntry.orderDate : null,
        manualEntry.deliveryDate ? manualEntry.deliveryDate : null,
        manualEntry.poReference || '',
        manualEntry.status || 'pending',
        manualEntry.amount ? manualEntry.amount.toString() : '0',
        manualEntry.items ? parseInt(manualEntry.items) : 0,
        file.name,
        file.type,
        buffer,
        null, // fileUrl can be set to null or a generated API route for download
        manualEntry.projectId || null
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
