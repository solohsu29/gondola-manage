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

    // Save file to disk (uploads directory)
    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, file.name);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, buffer);

    // Insert one delivery order into DB, with fileUrl
    const id = randomUUID();
    // Set date: use manualEntry.date if present, else now
    const date = manualEntry.date ? manualEntry.date : new Date();
    await pool.query(
      `INSERT INTO "DeliveryOrder"
        (id, number, client, site, date, "orderDate", "deliveryDate", "poReference", status, amount, items, "fileUrl", "projectId")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
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
        `/uploads/${file.name}`,
        manualEntry.projectId || null
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
