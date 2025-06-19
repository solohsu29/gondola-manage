import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import nodemailer from 'nodemailer';

function shouldSendForFrequency(frequency: string, lastSent: Date | null, now: Date): boolean {
  if (frequency === 'daily') {
    return !lastSent || lastSent.toDateString() !== now.toDateString();
  } else if (frequency === 'weekly') {
    // Only send on Monday and if not sent this week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0,0,0,0);
    return now.getDay() === 1 && (!lastSent || lastSent < startOfWeek);
  } else if (frequency === 'monthly') {
    // Only send on 1st of month and if not sent this month
    return now.getDate() === 1 && (!lastSent || lastSent.getMonth() !== now.getMonth() || lastSent.getFullYear() !== now.getFullYear());
  }
  return true; // fallback
}

export async function POST(req: NextRequest) {
  try {
    const { gondolaId, email, frequency, threshold, subscriptionId } = await req.json();
    // Fetch CertAlertSubscription for lastSent
    let lastSent: Date | null = null;
    let subId = subscriptionId;
    if (!subId && gondolaId && email) {
      // Try to find the subscription
      const { rows } = await pool.query('SELECT id, "lastSent" FROM "CertAlertSubscription" WHERE "gondolaId" = $1 AND email = $2', [gondolaId, email]);
      if (rows.length > 0) {
        subId = rows[0].id;
        lastSent = rows[0].lastSent ? new Date(rows[0].lastSent) : null;
      }
    }
    const now = new Date();
    const canSend = shouldSendForFrequency(frequency, lastSent, now);
    if (!canSend) {
      return NextResponse.json({ success: false, message: 'Not time to send based on frequency/lastSent.' });
    }
    // Fetch gondola details
    const gondolaRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gondola/${gondolaId}`);
    if (!gondolaRes.ok) throw new Error('Failed to fetch gondola details');
    const gondolaData = await gondolaRes.json();
    const gondola = gondolaData.gondola || gondolaData;

    // Fetch gondola documents
    const docsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gondola/${gondolaId}/documents`);
    const docsData = docsRes.ok ? await docsRes.json() : [];

    // --- ALERT LOGIC ---
    // Only send if any document expiry is within threshold days from today
    // Frequency: 'daily', 'weekly', 'monthly'
    // In a real system, this logic should be run by a scheduled job (cron/background worker)
    const today = new Date();
    const thresholdDays = Number(threshold) || 0;
    let shouldSend = false;
    let soonExpiringDocs = [];
    if (Array.isArray(docsData)) {
      soonExpiringDocs = docsData.filter((doc: any) => {
        if (!doc.expiry) return false;
        const expiryDate = new Date(doc.expiry);
        if (isNaN(expiryDate.getTime())) return false;
        const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays <= thresholdDays && diffDays >= 0;
      });
    }
    if (soonExpiringDocs.length > 0) {
      // Frequency logic (simulate schedule; in real use, run by cron or background job)
      if (frequency === 'daily') {
        shouldSend = true;
      } else if (frequency === 'weekly') {
        // Send only on a specific day of week, e.g., Monday
        if (today.getDay() === 1) shouldSend = true;
      } else if (frequency === 'monthly') {
        // Send only on the 1st of the month
        if (today.getDate() === 1) shouldSend = true;
      }
    }
    if (!shouldSend) {
      return NextResponse.json({
        success: false,
        message: 'No documents expiring within threshold or not scheduled to send today.'
      });
    }
    // --- END ALERT LOGIC ---

    // Compose email content for soon expiring docs only
    let docList = soonExpiringDocs.length > 0
      ? soonExpiringDocs.map((doc: any) => {
          const url = doc.fileUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/document/${doc.id}/serve`;
          return `- ${doc.title || doc.name} (${doc.expiry ? `Expires: ${doc.expiry}` : 'No Expiry'}) [View](${url})`;
        }).join('\n')
      : 'No documents found.';
    const htmlDocList = soonExpiringDocs.length > 0
      ? `<ul>${soonExpiringDocs.map((doc: any) => {
          const url = doc.fileUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/document/${doc.id}/serve`;
          return `<li>${doc.title || doc.name} ${doc.expiry ? `(Expires: ${doc.expiry})` : ''} <a href="${url}" target="_blank">View</a></li>`;
        }).join('')}</ul>`
      : '<p>No documents found.</p>';

    const emailSubject = `Certificate Expiry Alert for Gondola ${gondola.serialNumber || gondolaId}`;
    const emailText = `Certificate expiry alert settings:\n- Frequency: ${frequency}\n- Threshold: ${threshold} days\nGondola Details:\nSerial Number: ${gondola.serialNumber}\nLocation: ${gondola.location} ${gondola.locationDetail ? '(' + gondola.locationDetail + ')' : ''}\nStatus: ${gondola.status}\n\nDocuments:\n${docList}`;
    const emailHtml = `<h2>Certificate Expiry Alert</h2><p><strong>Frequency:</strong> ${frequency}<br/><strong>Threshold:</strong> ${threshold} days</p><h3>Gondola Details</h3><ul><li><b>Serial Number:</b> ${gondola.serialNumber}</li><li><b>Location:</b> ${gondola.location} ${gondola.locationDetail ? '(' + gondola.locationDetail + ')' : ''}</li><li><b>Status:</b> ${gondola.status}</li></ul><h3>Documents</h3>${htmlDocList}`;

    // Send email using nodemailer (configure SMTP in production)
    let success = false;
    let errorMsg = '';
    try {
      // Configure your SMTP transport here
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER || 'test@example.com',
          pass: process.env.SMTP_PASS || 'password',
        },
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'gondola-alerts@example.com',
        to: email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      success = true;
      // Update lastSent in CertAlertSubscription
      if (subId) {
        const sentTime = new Date();
        await pool.query('UPDATE "CertAlertSubscription" SET "lastSent" = $1 WHERE id = $2', [sentTime, subId]);
        console.log(`[CertAlertSubscription] lastSent updated to:`, sentTime, 'for id', subId);
      }
    } catch (err: any) {
      errorMsg = err.message;
      console.error('Failed to send email:', err);
    }
    if (!success) {
      return NextResponse.json({ error: 'Failed to send email', details: errorMsg }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send cert alert:', error);
    return NextResponse.json({ error: 'Failed to send cert alert' }, { status: 500 });
  }
}
