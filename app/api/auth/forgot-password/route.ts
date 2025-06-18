import { PrismaClient } from '@/lib/generated/prisma';
import { NextResponse } from 'next/server';


const prisma = new PrismaClient();

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Always return generic message
      return NextResponse.json({ message: 'If this email exists, an OTP has been sent.' });
    }
    // Generate OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 1); // 1 min expiry
    await prisma.oTP.create({
      data: {
        code,
        type: 'FORGOT_PASSWORD',
        expiresAt,
        userId: user.id,
      },
    });
    // Send OTP email
    const { sendOtpEmail } = await import('../../../utils/email');
    await sendOtpEmail({ to: email, otp: code });
    return NextResponse.json({ message: 'If this email exists, an OTP has been sent.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
