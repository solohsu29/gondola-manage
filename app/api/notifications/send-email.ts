import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

// POST /api/notifications/send-email
// Body: { userId: number, notificationType: string }
export async function POST(req: NextRequest) {
  try {
    const { userId, notificationType } = await req.json();
    if (!userId || !notificationType) {
      return NextResponse.json({ error: 'Missing userId or notificationType' }, { status: 400 });
    }

    // Get lastSent from UserNotificationLog
    let lastSent: Date | null = null;
    const { rows } = await pool.query('SELECT "lastSent" FROM "UserNotificationLog" WHERE "userId" = $1 AND "notificationType" = $2', [userId, notificationType]);
    if (rows.length > 0 && rows[0].lastSent) lastSent = new Date(rows[0].lastSent);

    // Frequency: every 5 minutes for demo/testing
    const now = new Date();
    let canSend = false;
    if (!lastSent || (now.getTime() - lastSent.getTime()) >= 5 * 60 * 1000) {
      canSend = true;
    }
    if (!canSend) {
      return NextResponse.json({ success: false, message: 'Not time to send based on lastSent (5 min rule).' });
    }

    // Fetch user email
    const userRes = await pool.query('SELECT email, name FROM "User" WHERE id = $1', [userId]);
    if (!userRes.rows.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const { email, name } = userRes.rows[0];

    // Compose email (simple demo)
    const subject = `Notification: ${notificationType}`;
    const text = `Hello ${name},\nThis is your notification for ${notificationType}.`;
    const html = `<p>Hello ${name},</p><p>This is your notification for <b>${notificationType}</b>.</p>`;

    // Send email
    let success = false, errorMsg = '';
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: email,
        subject,
        text,
        html,
      });
      success = true;
      // Update lastSent
      const sentTime = new Date();
      await pool.query('INSERT INTO "UserNotificationLog" ("userId", "notificationType", "lastSent") VALUES ($1, $2, $3) ON CONFLICT ("userId", "notificationType") DO UPDATE SET "lastSent" = EXCLUDED."lastSent"', [userId, notificationType, sentTime]);
      console.log(`[UserNotificationLog] lastSent updated to:`, sentTime, 'for user', userId, 'type', notificationType);
    } catch (err: any) {
      errorMsg = err.message;
      console.error('Failed to send notification email:', err);
    }
    if (!success) {
      return NextResponse.json({ error: 'Failed to send email', details: errorMsg }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return NextResponse.json({ error: 'Failed to send notification email' }, { status: 500 });
  }
}
