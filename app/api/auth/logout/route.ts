import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Expire the token cookie (must match cookie settings: Path, SameSite, etc.)
  const res = NextResponse.json({ message: 'Logged out' });
  res.headers.set(
    'Set-Cookie',
    [
      'token=; Path=/; HttpOnly; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax',
    ].join('; ')
  );
  return res;
}
