import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyJwt } from '@/app/utils/jwt';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  try {
    const { rows } = await pool.query('SELECT * FROM "Profile" WHERE "userId" = $1 LIMIT 1', [user.id]);
    if (!rows[0]) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  const user = verifyJwt(token) as { id: number; email: string } | null;
  if (!user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  const data = await req.json();
  try {
    // Build dynamic update including notificationPreferences and user preferences fields
    let updateQuery = `UPDATE "Profile" SET "firstName" = $1, "lastName" = $2, "phone" = $3, "jobTitle" = $4, "department" = $5, "photoUrl" = $6, "updatedAt" = NOW()`;
    let values = [
      data.firstName ?? '',
      data.lastName ?? '',
      data.phone ?? '',
      data.jobTitle ?? '',
      data.department ?? '',
      data.photoUrl ?? null
    ];
    let idx = 7;
    if (data.notificationPreferences !== undefined) {
      updateQuery += `, "notificationPreferences" = $${idx}`;
      values.push(JSON.stringify(data.notificationPreferences));
      idx++;
    }
    if (data.language !== undefined) {
      updateQuery += `, "language" = $${idx}`;
      values.push(data.language);
      idx++;
    }
    if (data.timezone !== undefined) {
      updateQuery += `, "timezone" = $${idx}`;
      values.push(data.timezone);
      idx++;
    }
    if (data.dateFormat !== undefined) {
      updateQuery += `, "dateFormat" = $${idx}`;
      values.push(data.dateFormat);
      idx++;
    }
    if (data.timeFormat !== undefined) {
      updateQuery += `, "timeFormat" = $${idx}`;
      values.push(data.timeFormat);
      idx++;
    }
    if (data.currency !== undefined) {
      updateQuery += `, "currency" = $${idx}`;
      values.push(data.currency);
      idx++;
    }
    if (data.darkMode !== undefined) {
      updateQuery += `, "darkMode" = $${idx}`;
      values.push(data.darkMode);
      idx++;
    }
    if (data.compactMode !== undefined) {
      updateQuery += `, "compactMode" = $${idx}`;
      values.push(data.compactMode);
      idx++;
    }
    updateQuery += ` WHERE "userId" = $${idx} RETURNING *`;
    values.push(user.id);
    const { rows } = await pool.query(updateQuery, values);
    if (!rows[0]) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
