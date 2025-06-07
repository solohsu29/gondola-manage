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
    const { email, password, rememberMe } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
    // Login successful
    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: rememberMe ? '30d' : '7d' }
    );
    // Set cookie
    const cookieOptions = [
      `token=${token}`,
      'Path=/',
      'HttpOnly',
      rememberMe ? `Max-Age=${60 * 60 * 24 * 30}` : '', // 30 days in seconds
      'SameSite=Lax'
    ].filter(Boolean).join('; ');
    const res = NextResponse.json({ message: 'Login successful.' });
    res.headers.set('Set-Cookie', cookieOptions);
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
