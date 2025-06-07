import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@/lib/generated/prisma';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

function generateOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });
    // Generate OTP
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 10); // 10 min expiry
    await prisma.oTP.create({
      data: {
        code,
        type: 'SIGNUP',
        expiresAt,
        userId: user.id,
      },
    });
    // Send OTP via email
    try {
      const { sendOtpEmail } = await import('../../../utils/email');
      await sendOtpEmail({ to: email, otp: code });
    } catch (emailErr) {
      // Optionally log emailErr for debugging, but don't expose to client
      console.error('Error sending signup OTP email:', emailErr);
    }
    // Issue JWT and set as cookie (30d expiry)
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '30d' }
    );
    const cookieOptions = [
      `token=${token}`,
      'Path=/',
      'HttpOnly',
      `Max-Age=${60 * 60 * 24 * 30}`,
      'SameSite=Lax'
    ].join('; ');
    const res = NextResponse.json({ message: 'User created. Please verify OTP.' });
    res.headers.set('Set-Cookie', cookieOptions);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
