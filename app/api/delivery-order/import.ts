import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    await prisma.deliveryOrder.create({
      data: {
        number: manualEntry.number || '',
        client: manualEntry.client || '',
        site: manualEntry.site || '',
        orderDate: manualEntry.orderDate ? new Date(manualEntry.orderDate) : null,
        deliveryDate: manualEntry.deliveryDate ? new Date(manualEntry.deliveryDate) : null,
        poReference: manualEntry.poReference || '',
        amount: manualEntry.amount ? parseFloat(manualEntry.amount) : null,
        fileUrl: `/uploads/${file.name}`,
        // Add more fields as needed
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
