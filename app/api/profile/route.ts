import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../(auth)/authOptions';

const prisma = new PrismaClient();

// GET: Fetch the current user's profile
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  return NextResponse.json(user.profile);
}

// PUT: Update the current user's profile
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { profile: true },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const data = await req.json();
  const updatedProfile = await prisma.profile.update({
    where: { id: user.profile.id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      jobTitle: data.jobTitle,
      department: data.department,
    },
  });

  return NextResponse.json(updatedProfile);
}
