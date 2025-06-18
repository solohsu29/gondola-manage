import { NextRequest, NextResponse } from 'next/server';

import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { gondolaId, email, frequency, threshold } = await req.json();
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
