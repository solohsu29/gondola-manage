import 'dotenv/config';
import pool from '../lib/db';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';

function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}


// Utility to determine if email should be sent today for the subscription
function shouldSendForFrequency(frequency: string, today: Date): boolean {
  if (frequency === 'daily') return true;
  if (frequency === 'weekly') return today.getDay() === 1; // Monday
  if (frequency === 'monthly') return today.getDate() === 1;
  return false;
}

function getSoonExpiringDocs(docsData: any[], threshold: number, today: Date) {
  return docsData.filter((doc: any) => {
    if (!doc.expiry) return false;
    const expiryDate = new Date(doc.expiry);
    if (isNaN(expiryDate.getTime())) return false;
    const diffDays = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= threshold && diffDays >= 0;
  });
}

async function main() {
  const { rows: subs } = await pool.query('SELECT * FROM "CertAlertSubscription"');
  const today = new Date();

  for (const sub of subs) {
    // --- Frequency and lastSent logic ---
    const lastSent = sub.lastsent ? new Date(sub.lastsent) : null;
    let shouldSend = false;
    if (shouldSendForFrequency(sub.frequency, today)) {
      if (!lastSent) {
        shouldSend = true;
      } else if (sub.frequency === 'daily') {
        shouldSend = lastSent.toDateString() !== today.toDateString();
      } else if (sub.frequency === 'weekly') {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Monday
        startOfWeek.setHours(0,0,0,0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23,59,59,999);
        shouldSend = lastSent < startOfWeek || lastSent > endOfWeek;
      } else if (sub.frequency === 'monthly') {
        shouldSend = lastSent.getFullYear() !== today.getFullYear() || lastSent.getMonth() !== today.getMonth();
      }
    }
    if (!shouldSend) continue;
    // Fetch gondola details and documents
    const gondolaRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gondola/${sub.gondolaId}`);
    if (!gondolaRes.ok) continue;
    const gondolaData = await gondolaRes.json() as any;
    const gondola = gondolaData.gondola || gondolaData;

    const docsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/gondola/${sub.gondolaId}/documents`);
    if (!docsRes.ok) continue;
    const docsDataRaw = await docsRes.json();
    const docsData = Array.isArray(docsDataRaw) ? docsDataRaw : [];
    console.log("docsData",docsData)
    const soonExpiringDocs = getSoonExpiringDocs(docsData, sub.threshold, today);
    if (soonExpiringDocs.length === 0) continue;
console.log('soon',soonExpiringDocs)
    // Compose email
    const docList = soonExpiringDocs.map((doc: any) => `- ${doc.type || doc.name || 'Document'}: Expires on ${doc.expiry}`).join('\n');
    const htmlDocList = '<ul>' + soonExpiringDocs.map((doc: any) => `<li><b>${doc.type || doc.name || 'Document'}:</b> Expires on ${doc.expiry}</li>`).join('') + '</ul>';
    const emailSubject = `Certificate Expiry Alert for Gondola ${gondola.serialNumber || sub.gondolaId}`;
    const emailText = `Certificate expiry alert settings:\n- Frequency: ${sub.frequency}\n- Threshold: ${sub.threshold} days\nGondola Details:\nSerial Number: ${gondola.serialNumber}\nLocation: ${gondola.location} ${gondola.locationDetail ? '(' + gondola.locationDetail + ')' : ''}\nStatus: ${gondola.status}\n\nDocuments:\n${docList}`;
    const emailHtml = `<h2>Certificate Expiry Alert</h2><p><strong>Frequency:</strong> ${sub.frequency}<br/><strong>Threshold:</strong> ${sub.threshold} days</p><h3>Gondola Details</h3><ul><li><b>Serial Number:</b> ${gondola.serialNumber}</li><li><b>Location:</b> ${gondola.location} ${gondola.locationDetail ? '(' + gondola.locationDetail + ')' : ''}</li><li><b>Status:</b> ${gondola.status}</li></ul><h3>Documents</h3>${htmlDocList}`;
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
        to: sub.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      });
      logWithTimestamp(`Alert sent to ${sub.email} for gondola ${sub.gondolaId}`);
      // Update lastSent in DB
      const sentTime = new Date();
      logWithTimestamp(`[CertAlertSubscription] lastSent before update: ${sub.lastsent}`);
      await pool.query('UPDATE "CertAlertSubscription" SET "lastSent" = $1 WHERE id = $2', [sentTime, sub.id]);
      logWithTimestamp(`[CertAlertSubscription] lastSent updated to: ${sentTime}`);
    } catch (err) {
      logWithTimestamp('Failed to send email: ' + err);
    }
  }
}

(async () => {
  try {
    await main();
  } catch (err) {
    logWithTimestamp('Script failed: ' + err);
    process.exit(1);
  }
})();
