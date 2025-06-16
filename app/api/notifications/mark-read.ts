import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJwt } from '@/app/utils/jwt';

// POST /api/notifications/mark-read
export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

  try {
    const { ids } = await req.json(); // ids: string[]
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No notification IDs provided' }, { status: 400 });
    }
    // Only update notifications that belong to this user
    await pool.query(
      `UPDATE "Notification" SET read = true WHERE "userId" = $1 AND id = ANY($2::uuid[])`,
      [user.id, ids]
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Failed to mark notifications as read', err);
    return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 });
  }
}
