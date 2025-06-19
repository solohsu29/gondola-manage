import 'dotenv/config';
import pool from '../lib/db';
import * as nodemailer from 'nodemailer';

// Log script start for debugging
function logWithTimestamp(message: string) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}
logWithTimestamp('Script started');

// Notification keys and defaults
const NOTIFICATION_KEYS = [
  'emailNotifications',
  'pushNotifications',
  'certificateExpiry',
  'maintenanceReminders',
  'projectUpdates',
  'weeklyReports',
  'projectReminders',
  'projectStatusUpdates'
];
const defaultNotificationValues: Record<string, boolean> = {
  emailNotifications: true,
  pushNotifications: true,
  certificateExpiry: true,
  maintenanceReminders: true,
  projectUpdates: false,
  weeklyReports: true,
  projectReminders: true,
  projectStatusUpdates: true
};

async function ensureUserNotificationLogTable() {
  // Create the table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "UserNotificationLog" (
      "id" SERIAL PRIMARY KEY,
      "userId" INTEGER NOT NULL,
      "notificationType" TEXT NOT NULL,
      "lastSent" TIMESTAMPTZ,
      UNIQUE ("userId", "notificationType")
    );
  `);
}

async function getLastSent(userId: number, notificationType: string): Promise<Date | null> {
  const { rows } = await pool.query(
    'SELECT "lastSent" FROM "UserNotificationLog" WHERE "userId" = $1 AND "notificationType" = $2',
    [userId, notificationType]
  );
  if (rows.length > 0 && rows[0].lastSent) return new Date(rows[0].lastSent);
  return null;
}

async function updateLastSent(userId: number, notificationType: string, date: Date) {
  await pool.query(
    'INSERT INTO "UserNotificationLog" ("userId", "notificationType", "lastSent") VALUES ($1, $2, $3)\n      ON CONFLICT ("userId", "notificationType") DO UPDATE SET "lastSent" = EXCLUDED."lastSent"',
    [userId, notificationType, date]
  );
}

function shouldSendEveryFiveMinutes(lastSent: Date | null, now: Date): boolean {
  if (!lastSent) return true;
  // 5 minutes = 300000 ms
  return (now.getTime() - lastSent.getTime()) >= 5 * 60 * 1000;
}

async function main() {
  await ensureUserNotificationLogTable();
  // 1. Fetch all users and their notification preferences
  const { rows: users } = await pool.query(
    'SELECT u.id, u.email, u.name, p."notificationPreferences" FROM "User" u JOIN "Profile" p ON u.id = p."userId" WHERE u.email IS NOT NULL'
  );
  const today = new Date();

  for (const user of users) {
    const email = user.email;
    let prefs: Record<string, boolean> = {};
    try {
      prefs = typeof user.notificationPreferences === 'string'
        ? JSON.parse(user.notificationPreferences)
        : user.notificationPreferences || {};
    } catch {
      prefs = {};
    }
    // Merge with defaults
    prefs = NOTIFICATION_KEYS.reduce((acc, key) => {
      acc[key] = prefs[key] !== undefined ? prefs[key] : defaultNotificationValues[key];
      return acc;
    }, {} as Record<string, boolean>);

    // Skip if email notifications are globally off
    if (!prefs.emailNotifications) continue;

    let emailSections: string[] = [];
    // 2. Certificate Expiry
    if (prefs.certificateExpiry) {
      const lastSent = await getLastSent(user.id, 'certificateExpiry');
      if (shouldSendEveryFiveMinutes(lastSent, today)) {
        const { rows: docs } = await pool.query(
          `SELECT d.title, d.expiry, g."serialNumber" FROM "Document" d LEFT JOIN "Gondola" g ON d."gondolaId"=g.id WHERE (
            d.category ILIKE '%Certificate%' OR d.type ILIKE '%Certificate%' OR d.title ILIKE '%Certificate%') AND d.expiry IS NOT NULL AND d.expiry::date BETWEEN NOW()::date AND (NOW() + INTERVAL '30 days')::date`
        );
        if (docs.length > 0) {
          emailSections.push('<h3>Certificate Expiry Reminders</h3><ul>' + docs.map((doc: any) => `<li>${doc.title} for ${doc.serialNumber || ''} expires on ${doc.expiry}</li>`).join('') + '</ul>');
        }
        const sentTime = new Date();
        logWithTimestamp(`[certificateExpiry] lastSent before update: ${lastSent}`);
        await updateLastSent(user.id, 'certificateExpiry', sentTime);
        logWithTimestamp(`[certificateExpiry] lastSent updated to: ${sentTime}`);
      }
    }
    // 3. Project Reminders
    if (prefs.projectReminders) {
      const lastSent = await getLastSent(user.id, 'projectReminders');
      if (shouldSendEveryFiveMinutes(lastSent, today)) {
        // Notify about projects ending in the next 7 days
        const { rows: projectsDue } = await pool.query(`
          SELECT "projectName", "client", "site", "endDate"
          FROM "Project"
          WHERE "endDate" IS NOT NULL
            AND "endDate"::date BETWEEN NOW()::date AND (NOW() + INTERVAL '7 days')::date
          ORDER BY "endDate" ASC
        `);
        if (projectsDue.length > 0) {
          emailSections.push(
            '<h3>Project Reminders</h3><ul>' +
            projectsDue.map((p: any) => {
              let endDateStr = '';
              if (typeof p.endDate === 'string') {
                endDateStr = p.endDate.split('T')[0];
              } else if (p.endDate instanceof Date) {
                endDateStr = p.endDate.toISOString().split('T')[0];
              } else if (p.endDate) {
                endDateStr = String(p.endDate).split('T')[0];
              }
              return `<li>Project <b>${p.projectName || p.client}</b> at <b>${p.site}</b> is ending on ${endDateStr}</li>`;
            }).join('') + '</ul>'
          );
        }
        const sentTime = new Date();
        logWithTimestamp(`[projectReminders] lastSent before update: ${lastSent}`);
        await updateLastSent(user.id, 'projectReminders', sentTime);
        logWithTimestamp(`[projectReminders] lastSent updated to: ${sentTime}`);
      }
    }
    // 4. Project Updates
    if (prefs.projectUpdates) {
      const lastSent = await getLastSent(user.id, 'projectUpdates');
      if (shouldSendEveryFiveMinutes(lastSent, today)) {
        const { rows: changedProjects } = await pool.query(`
          SELECT "projectName", "updatedAt", "status"
          FROM "Project"
          WHERE "updatedAt" >= NOW() - INTERVAL '7 days'
          ORDER BY "updatedAt" DESC
        `);
        if (changedProjects.length > 0) {
          emailSections.push(
            '<h3>Project Updates</h3><ul>' +
            changedProjects.map((p: any) =>
              `<li>Project <b>${p.projectName}</b> was updated on ${p.updatedAt} (Current status: ${p.status})</li>`
            ).join('') + '</ul>'
          );
        }
        const sentTime = new Date();
        logWithTimestamp(`[projectUpdates] lastSent before update: ${lastSent}`);
        await updateLastSent(user.id, 'projectUpdates', sentTime);
        logWithTimestamp(`[projectUpdates] lastSent updated to: ${sentTime}`);
      }
    }
    // 5. Weekly Reports
    if (prefs.weeklyReports) {
      const lastSent = await getLastSent(user.id, 'weeklyReports');
      if (shouldSendEveryFiveMinutes(lastSent, today)) {
        // Active Gondolas
        const { rows: gondolas } = await pool.query(`SELECT * FROM "Gondola"`);
        const activeGondolas = gondolas.filter((g: any) => typeof g.status === 'string' && g.status.toLowerCase() === 'deployed');
        // Expiring Certificates
        const { rows: certificates } = await pool.query(`SELECT * FROM "Document" WHERE (category ILIKE '%Certificate%' OR type ILIKE '%Certificate%' OR title ILIKE '%Certificate%')`);
        const expiringCertificates = certificates.filter((cert: any) => typeof cert.status === 'string' && cert.status.toLowerCase().includes('expire'));
        // Pending Inspections (stub: count all docs with status 'pending inspection')
        const pendingInspectionsCount = certificates.filter((cert: any) => typeof cert.status === 'string' && cert.status.toLowerCase().includes('pending inspection')).length;
        // Total Projects
        const { rows: projects } = await pool.query(`SELECT * FROM "Project"`);
        // Compose summary
        let summary = '<h3>Weekly Report</h3>';
        summary += `<p><b>Active Gondolas:</b> ${activeGondolas.length}<br/>`;
        summary += `<b>Expiring Certificates:</b> ${expiringCertificates.length}<br/>`;
        summary += `<b>Pending Inspections:</b> ${pendingInspectionsCount}<br/>`;
        summary += `<b>Total Projects:</b> ${projects.length}</p>`;
        // Projects Overview
        summary += '<h4>Projects Overview</h4><ul>';
        projects.slice(0, 5).forEach((project: any, idx: number) => {
          summary += `<li>${idx + 1}. ${project.client} (${project.site}) - Status: ${project.status}</li>`;
        });
        summary += '</ul>';
        emailSections.push(summary);
        const sentTime = new Date();
        logWithTimestamp(`[weeklyReports] lastSent before update: ${lastSent}`);
        await updateLastSent(user.id, 'weeklyReports', sentTime);
        logWithTimestamp(`[weeklyReports] lastSent updated to: ${sentTime}`);
      }
    }
    if (emailSections.length === 0) continue;

    // 6. Send email
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'admin@example.com',
        to: email,
        subject: 'Your Notifications',
        html: `<h2>Notification Summary</h2>${emailSections.join('<hr/>')}`
      });
      logWithTimestamp(`Sent notifications email to ${email}`);
    } catch (err) {
      logWithTimestamp('Failed to send email to ' + email + ': ' + err);
    }
  }
}

(async () => {
  try {
    await main();
    logWithTimestamp('Script finished successfully');
    process.exit(0);
  } catch (err) {
    logWithTimestamp('Script failed: ' + err);
    // Error alerting: send email to admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.example.com',
          port: Number(process.env.SMTP_PORT) || 587,
          secure: false,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || 'noreply@example.com',
          to: adminEmail,
          subject: '[ALERT] User Notification Script Failed',
          html: `<p>The notification script failed at ${new Date().toISOString()}:</p><pre>${err?.toString()}</pre>`
        });
        logWithTimestamp('Sent alert email to admin.');
      } catch (emailErr) {
        logWithTimestamp('Failed to send admin alert email: ' + emailErr);
      }
    } else {
      logWithTimestamp('ADMIN_EMAIL not set, cannot send alert email.');
    }
    process.exit(1);
  }
})();
