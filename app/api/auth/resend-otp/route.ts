import { PrismaClient } from '@/lib/generated/prisma';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Always return generic message
      return NextResponse.json({ message: 'If this email exists, an OTP has been resent.' });
    }
    // Invalidate previous OTPs (optional, but good practice)
    await prisma.oTP.updateMany({
      where: {
        userId: user.id,
        verified: false,
        expiresAt: { gt: new Date() },
        type: { in: ['SIGNUP', 'FORGOT_PASSWORD'] },
      },
      data: { expiresAt: new Date() }, // Expire them
    });
    // Generate new OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString().substring(0, 6);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 1); // 1 min expiry
    // Determine OTP type (default to FORGOT_PASSWORD if not found)
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
    return NextResponse.json({ message: 'OTP resent! Please check your email.' });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
