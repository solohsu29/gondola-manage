import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Fetch documents where category, type, or title contains 'Certificate', and join with gondola for serialNumber
    const certificates = await prisma.document.findMany({
      where: {
        OR: [
          { category: { contains: 'Certificate', mode: 'insensitive' } },
          { type: { contains: 'Certificate', mode: 'insensitive' } },
          { title: { contains: 'Certificate', mode: 'insensitive' } },
        ],
      },
      include: {
        gondola: {
          select: { serialNumber: true }
        }
      }
    });
    // Map to include serialNumber at top level
    const certificatesWithSerial = certificates.map(doc => ({
      ...doc,
      serialNumber: doc.gondola?.serialNumber || '',
    }));
    return NextResponse.json(certificatesWithSerial);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
