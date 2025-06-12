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
    // Fetch user notifications from Notification table
    const { rows } = await pool.query('SELECT * FROM "Notification" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [user.id]);
    const dbNotifications = rows.map((n: any) => ({
      ...n,
      date: n.date || n.createdAt,
      actionLink: n.actionLink || null,
    }));

    // Fetch expiring certificates for calculated notifications
    const certsResult = await pool.query(`
      SELECT d.id, d.title, d.expiry, d."gondolaId", g."serialNumber"
      FROM "Document" d
      LEFT JOIN "Gondola" g ON d."gondolaId" = g.id
      WHERE (
        d.category ILIKE '%Certificate%' OR d.type ILIKE '%Certificate%' OR d.title ILIKE '%Certificate%'
      )
      AND d.expiry IS NOT NULL
      AND d.expiry BETWEEN NOW() AND NOW() + INTERVAL '30 days'
    `);

    const certNotifications = certsResult.rows.map((cert: any) => {
  const gondolaIdentifier = cert.serialNumber || cert.gondolaId || "";

  return {
    id: `cert-${cert.id}`,
    type: 'warning',
    message: gondolaIdentifier? `${cert.title} for ${gondolaIdentifier} expires in 30 days` : `${cert.title} expires in 30 days` ,
    date: cert.expiry,
    read: false,
    actionLink: `/gondolas/${gondolaIdentifier}`,
  };
});

    // Combine and sort notifications by date descending
    const notifications = [...dbNotifications, ...certNotifications].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return NextResponse.json({ notifications });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
