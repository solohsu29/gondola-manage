import { NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Join with Gondola to get serialNumber
    const certificates = await prisma.certificate.findMany({
      include: {
        gondola: {
          select: { serialNumber: true }
        }
      }
    });
    // Map to include serialNumber at top level
    const certificatesWithSerial = certificates.map(cert => ({
      ...cert,
      serialNumber: cert.gondola?.serialNumber || '',
    }));
    return NextResponse.json(certificatesWithSerial);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch certificates' }, { status: 500 });
  }
}
