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

    // Save file buffer and metadata in the Document table
    const buffer = Buffer.from(await file.arrayBuffer());
    const documentId = randomUUID();
    const uploadedDate = new Date();
    // Insert document record
    await pool.query(
      `INSERT INTO "Document" (id, name, type, uploaded, "fileData", "fileUrl", title, category, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        documentId,
        file.name,
        file.type,
        uploadedDate,
        buffer,
        null, // fileUrl to be updated after
        manualEntry.poReference || '', // Use PO Reference as title
        'Delivery Order', // Category
        'Valid' // Status
      ]
    );
    const fileUrl = `/api/document/${documentId}/serve`;
    await pool.query('UPDATE "Document" SET "fileUrl" = $1 WHERE id = $2', [fileUrl, documentId]);

    // Now insert the DeliveryOrder, linking the document
    const id = randomUUID();
    const date = manualEntry.date ? manualEntry.date : new Date();
    await pool.query(
      `INSERT INTO "DeliveryOrder"
        (id, number, client, site, date, "orderDate", "deliveryDate", "poReference", status, amount, items, "documentId", "projectId")
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
        manualEntry.items || '',
        documentId,
        manualEntry.projectId || null
      ]
    );

    // Fetch fileName and fileType from Document
    const docResult = await pool.query('SELECT name, type, "fileUrl" FROM "Document" WHERE id = $1', [documentId]);
    const fileName = docResult.rows[0]?.name || null;
    const fileType = docResult.rows[0]?.type || null;
    const fileUrlResult = docResult.rows[0]?.fileUrl || null;

    return NextResponse.json({
      success: true,
      deliveryOrder: {
        id,
        projectId: manualEntry.projectId || null,
        number: manualEntry.number || '',
        date,
        fileUrl: fileUrlResult,
        client: manualEntry.client || '',
        site: manualEntry.site || '',
        orderDate: manualEntry.orderDate ? manualEntry.orderDate : null,
        deliveryDate: manualEntry.deliveryDate ? manualEntry.deliveryDate : null,
        poReference: manualEntry.poReference || '',
        status: manualEntry.status || 'pending',
        amount: manualEntry.amount ? manualEntry.amount.toString() : '0',
        items: manualEntry.items || '',
        documentId,
        fileName,
        fileType
      }
    });
  } catch (error: any) {
    // Handle unique constraint violation for DeliveryOrder.number
    if (error.code === '23505' && error.detail && error.detail.includes('DeliveryOrder_number_key')) {
      return NextResponse.json({ error: 'A delivery order with this number already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
