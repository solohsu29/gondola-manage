import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJwt } from '@/app/utils/jwt';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    // Fetch user by id
    const userResult = await pool.query('SELECT * FROM "User" WHERE id = $1', [user.id]);
    const dbUser = userResult.rows[0];
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    // Check current password
    const valid = await bcrypt.compare(currentPassword, dbUser.password);
    if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashed, user.id]);
    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update password' }, { status: 500 });
  }
}
