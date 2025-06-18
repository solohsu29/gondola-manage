import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@/lib/generated/prisma';

const prisma = new PrismaClient();

// Create or update a certificate alert subscription
export async function POST(req: NextRequest) {
  try {
    const { gondolaId, email, threshold, frequency } = await req.json();
    if (!gondolaId || !email || !threshold || !frequency) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Prisma upsert using unique composite key (gondolaId, email)
    await prisma.certAlertSubscription.upsert({
      where: { gondolaId_email: { gondolaId, email } },
      update: { threshold: Number(threshold), frequency, updatedAt: new Date() },
      create: { gondolaId, email, threshold: Number(threshold), frequency },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save cert alert subscription:', error);
    return NextResponse.json({ error: 'Failed to save cert alert subscription' }, { status: 500 });
  }
}

