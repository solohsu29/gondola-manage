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

    // Compose email content
    let docList = Array.isArray(docsData) && docsData.length > 0
      ? docsData.map((doc: any) => {
          const url = doc.fileUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/document/${doc.id}/serve`;
          return `- ${doc.title || doc.name} (${doc.expiry ? `Expires: ${doc.expiry}` : 'No Expiry'}) [View](${url})`;
        }).join('\n')
      : 'No documents found.';
    const htmlDocList = Array.isArray(docsData) && docsData.length > 0
      ? `<ul>${docsData.map((doc: any) => {
          const url = doc.fileUrl || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/document/${doc.id}/serve`;
          return `<li>${doc.title || doc.name} ${doc.expiry ? `(Expires: ${doc.expiry})` : ''} <a href="${url}" target="_blank">View</a></li>`;
        }).join('')}</ul>`
      : '<p>No documents found.</p>';

    const emailSubject = `Certificate Expiry Alert for Gondola ${gondola.serialNumber || gondolaId}`;
    const emailText = `Certificate expiry alert settings:\n- Frequency: ${frequency}\n- Threshold: ${threshold} days\n\nGondola Details:\nSerial Number: ${gondola.serialNumber}\nLocation: ${gondola.location} ${gondola.locationDetail ? '(' + gondola.locationDetail + ')' : ''}\nStatus: ${gondola.status}\n\nDocuments:\n${docList}`;
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
