import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJwt } from '@/app/utils/jwt';

// GET /api/notifications - Get notifications for the authenticated user
export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  try {
    // Example: Fetch notifications for the user. You should have a Notification table in your db.
    const { rows } = await pool.query('SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [user.id]);
    // Convert date strings to ISO (or Date object on frontend)
    const notifications = rows.map((n: any) => ({ ...n, date: n.date || n.createdAt }));
    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
