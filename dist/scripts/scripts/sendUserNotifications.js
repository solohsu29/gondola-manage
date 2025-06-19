"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var db_1 = require("../lib/db");
var nodemailer = require("nodemailer");
// Log script start for debugging
function logWithTimestamp(message) {
    console.log("[".concat(new Date().toISOString(), "] ").concat(message));
}
logWithTimestamp('Script started');
// Notification keys and defaults
var NOTIFICATION_KEYS = [
    'emailNotifications',
    'pushNotifications',
    'certificateExpiry',
    'maintenanceReminders',
    'projectUpdates',
    'weeklyReports',
    'projectReminders',
    'projectStatusUpdates'
];
var defaultNotificationValues = {
    emailNotifications: true,
    pushNotifications: true,
    certificateExpiry: true,
    maintenanceReminders: true,
    projectUpdates: false,
    weeklyReports: true,
    projectReminders: true,
    projectStatusUpdates: true
};
function ensureUserNotificationLogTable() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Create the table if it doesn't exist
                return [4 /*yield*/, db_1.default.query("\n    CREATE TABLE IF NOT EXISTS \"UserNotificationLog\" (\n      \"id\" SERIAL PRIMARY KEY,\n      \"userId\" INTEGER NOT NULL,\n      \"notificationType\" TEXT NOT NULL,\n      \"lastSent\" TIMESTAMPTZ,\n      UNIQUE (\"userId\", \"notificationType\")\n    );\n  ")];
                case 1:
                    // Create the table if it doesn't exist
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getLastSent(userId, notificationType) {
    return __awaiter(this, void 0, void 0, function () {
        var rows;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.default.query('SELECT "lastSent" FROM "UserNotificationLog" WHERE "userId" = $1 AND "notificationType" = $2', [userId, notificationType])];
                case 1:
                    rows = (_a.sent()).rows;
                    if (rows.length > 0 && rows[0].lastSent)
                        return [2 /*return*/, new Date(rows[0].lastSent)];
                    return [2 /*return*/, null];
            }
        });
    });
}
function updateLastSent(userId, notificationType, date) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, db_1.default.query('INSERT INTO "UserNotificationLog" ("userId", "notificationType", "lastSent") VALUES ($1, $2, $3)\n      ON CONFLICT ("userId", "notificationType") DO UPDATE SET "lastSent" = EXCLUDED."lastSent"', [userId, notificationType, date])];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function shouldSendEveryFiveMinutes(lastSent, now) {
    if (!lastSent)
        return true;
    // 5 minutes = 300000 ms
    return (now.getTime() - lastSent.getTime()) >= 5 * 60 * 1000;
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var users, today, _loop_1, _i, users_1, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ensureUserNotificationLogTable()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, db_1.default.query('SELECT u.id, u.email, u.name, p."notificationPreferences" FROM "User" u JOIN "Profile" p ON u.id = p."userId" WHERE u.email IS NOT NULL')];
                case 2:
                    users = (_a.sent()).rows;
                    today = new Date();
                    _loop_1 = function (user) {
                        var email, prefs, emailSections, lastSent, docs, sentTime, lastSent, projectsDue, sentTime, lastSent, changedProjects, sentTime, lastSent, gondolas, activeGondolas, certificates, expiringCertificates, pendingInspectionsCount, projects, summary_1, sentTime, transporter, err_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    email = user.email;
                                    prefs = {};
                                    try {
                                        prefs = typeof user.notificationPreferences === 'string'
                                            ? JSON.parse(user.notificationPreferences)
                                            : user.notificationPreferences || {};
                                    }
                                    catch (_c) {
                                        prefs = {};
                                    }
                                    // Merge with defaults
                                    prefs = NOTIFICATION_KEYS.reduce(function (acc, key) {
                                        acc[key] = prefs[key] !== undefined ? prefs[key] : defaultNotificationValues[key];
                                        return acc;
                                    }, {});
                                    // Skip if email notifications are globally off
                                    if (!prefs.emailNotifications)
                                        return [2 /*return*/, "continue"];
                                    emailSections = [];
                                    if (!prefs.certificateExpiry) return [3 /*break*/, 4];
                                    return [4 /*yield*/, getLastSent(user.id, 'certificateExpiry')];
                                case 1:
                                    lastSent = _b.sent();
                                    if (!shouldSendEveryFiveMinutes(lastSent, today)) return [3 /*break*/, 4];
                                    return [4 /*yield*/, db_1.default.query("SELECT d.title, d.expiry, g.\"serialNumber\" FROM \"Document\" d LEFT JOIN \"Gondola\" g ON d.\"gondolaId\"=g.id WHERE (\n            d.category ILIKE '%Certificate%' OR d.type ILIKE '%Certificate%' OR d.title ILIKE '%Certificate%') AND d.expiry IS NOT NULL AND d.expiry::date BETWEEN NOW()::date AND (NOW() + INTERVAL '30 days')::date")];
                                case 2:
                                    docs = (_b.sent()).rows;
                                    if (docs.length > 0) {
                                        emailSections.push('<h3>Certificate Expiry Reminders</h3><ul>' + docs.map(function (doc) { return "<li>".concat(doc.title, " for ").concat(doc.serialNumber || '', " expires on ").concat(doc.expiry, "</li>"); }).join('') + '</ul>');
                                    }
                                    sentTime = new Date();
                                    logWithTimestamp("[certificateExpiry] lastSent before update: ".concat(lastSent));
                                    return [4 /*yield*/, updateLastSent(user.id, 'certificateExpiry', sentTime)];
                                case 3:
                                    _b.sent();
                                    logWithTimestamp("[certificateExpiry] lastSent updated to: ".concat(sentTime));
                                    _b.label = 4;
                                case 4:
                                    if (!prefs.projectReminders) return [3 /*break*/, 8];
                                    return [4 /*yield*/, getLastSent(user.id, 'projectReminders')];
                                case 5:
                                    lastSent = _b.sent();
                                    if (!shouldSendEveryFiveMinutes(lastSent, today)) return [3 /*break*/, 8];
                                    return [4 /*yield*/, db_1.default.query("\n          SELECT \"projectName\", \"client\", \"site\", \"endDate\"\n          FROM \"Project\"\n          WHERE \"endDate\" IS NOT NULL\n            AND \"endDate\"::date BETWEEN NOW()::date AND (NOW() + INTERVAL '7 days')::date\n          ORDER BY \"endDate\" ASC\n        ")];
                                case 6:
                                    projectsDue = (_b.sent()).rows;
                                    if (projectsDue.length > 0) {
                                        emailSections.push('<h3>Project Reminders</h3><ul>' +
                                            projectsDue.map(function (p) {
                                                var endDateStr = '';
                                                if (typeof p.endDate === 'string') {
                                                    endDateStr = p.endDate.split('T')[0];
                                                }
                                                else if (p.endDate instanceof Date) {
                                                    endDateStr = p.endDate.toISOString().split('T')[0];
                                                }
                                                else if (p.endDate) {
                                                    endDateStr = String(p.endDate).split('T')[0];
                                                }
                                                return "<li>Project <b>".concat(p.projectName || p.client, "</b> at <b>").concat(p.site, "</b> is ending on ").concat(endDateStr, "</li>");
                                            }).join('') + '</ul>');
                                    }
                                    sentTime = new Date();
                                    logWithTimestamp("[projectReminders] lastSent before update: ".concat(lastSent));
                                    return [4 /*yield*/, updateLastSent(user.id, 'projectReminders', sentTime)];
                                case 7:
                                    _b.sent();
                                    logWithTimestamp("[projectReminders] lastSent updated to: ".concat(sentTime));
                                    _b.label = 8;
                                case 8:
                                    if (!prefs.projectUpdates) return [3 /*break*/, 12];
                                    return [4 /*yield*/, getLastSent(user.id, 'projectUpdates')];
                                case 9:
                                    lastSent = _b.sent();
                                    if (!shouldSendEveryFiveMinutes(lastSent, today)) return [3 /*break*/, 12];
                                    return [4 /*yield*/, db_1.default.query("\n          SELECT \"projectName\", \"updatedAt\", \"status\"\n          FROM \"Project\"\n          WHERE \"updatedAt\" >= NOW() - INTERVAL '7 days'\n          ORDER BY \"updatedAt\" DESC\n        ")];
                                case 10:
                                    changedProjects = (_b.sent()).rows;
                                    if (changedProjects.length > 0) {
                                        emailSections.push('<h3>Project Updates</h3><ul>' +
                                            changedProjects.map(function (p) {
                                                return "<li>Project <b>".concat(p.projectName, "</b> was updated on ").concat(p.updatedAt, " (Current status: ").concat(p.status, ")</li>");
                                            }).join('') + '</ul>');
                                    }
                                    sentTime = new Date();
                                    logWithTimestamp("[projectUpdates] lastSent before update: ".concat(lastSent));
                                    return [4 /*yield*/, updateLastSent(user.id, 'projectUpdates', sentTime)];
                                case 11:
                                    _b.sent();
                                    logWithTimestamp("[projectUpdates] lastSent updated to: ".concat(sentTime));
                                    _b.label = 12;
                                case 12:
                                    if (!prefs.weeklyReports) return [3 /*break*/, 18];
                                    return [4 /*yield*/, getLastSent(user.id, 'weeklyReports')];
                                case 13:
                                    lastSent = _b.sent();
                                    if (!shouldSendEveryFiveMinutes(lastSent, today)) return [3 /*break*/, 18];
                                    return [4 /*yield*/, db_1.default.query("SELECT * FROM \"Gondola\"")];
                                case 14:
                                    gondolas = (_b.sent()).rows;
                                    activeGondolas = gondolas.filter(function (g) { return typeof g.status === 'string' && g.status.toLowerCase() === 'deployed'; });
                                    return [4 /*yield*/, db_1.default.query("SELECT * FROM \"Document\" WHERE (category ILIKE '%Certificate%' OR type ILIKE '%Certificate%' OR title ILIKE '%Certificate%')")];
                                case 15:
                                    certificates = (_b.sent()).rows;
                                    expiringCertificates = certificates.filter(function (cert) { return typeof cert.status === 'string' && cert.status.toLowerCase().includes('expire'); });
                                    pendingInspectionsCount = certificates.filter(function (cert) { return typeof cert.status === 'string' && cert.status.toLowerCase().includes('pending inspection'); }).length;
                                    return [4 /*yield*/, db_1.default.query("SELECT * FROM \"Project\"")];
                                case 16:
                                    projects = (_b.sent()).rows;
                                    summary_1 = '<h3>Weekly Report</h3>';
                                    summary_1 += "<p><b>Active Gondolas:</b> ".concat(activeGondolas.length, "<br/>");
                                    summary_1 += "<b>Expiring Certificates:</b> ".concat(expiringCertificates.length, "<br/>");
                                    summary_1 += "<b>Pending Inspections:</b> ".concat(pendingInspectionsCount, "<br/>");
                                    summary_1 += "<b>Total Projects:</b> ".concat(projects.length, "</p>");
                                    // Projects Overview
                                    summary_1 += '<h4>Projects Overview</h4><ul>';
                                    projects.slice(0, 5).forEach(function (project, idx) {
                                        summary_1 += "<li>".concat(idx + 1, ". ").concat(project.client, " (").concat(project.site, ") - Status: ").concat(project.status, "</li>");
                                    });
                                    summary_1 += '</ul>';
                                    emailSections.push(summary_1);
                                    sentTime = new Date();
                                    logWithTimestamp("[weeklyReports] lastSent before update: ".concat(lastSent));
                                    return [4 /*yield*/, updateLastSent(user.id, 'weeklyReports', sentTime)];
                                case 17:
                                    _b.sent();
                                    logWithTimestamp("[weeklyReports] lastSent updated to: ".concat(sentTime));
                                    _b.label = 18;
                                case 18:
                                    if (emailSections.length === 0)
                                        return [2 /*return*/, "continue"];
                                    _b.label = 19;
                                case 19:
                                    _b.trys.push([19, 21, , 22]);
                                    transporter = nodemailer.createTransport({
                                        host: process.env.SMTP_HOST || 'smtp.example.com',
                                        port: Number(process.env.SMTP_PORT) || 587,
                                        secure: false,
                                        auth: {
                                            user: process.env.SMTP_USER,
                                            pass: process.env.SMTP_PASS
                                        }
                                    });
                                    return [4 /*yield*/, transporter.sendMail({
                                            from: process.env.SMTP_FROM || process.env.ADMIN_EMAIL || 'admin@example.com',
                                            to: email,
                                            subject: 'Your Notifications',
                                            html: "<h2>Notification Summary</h2>".concat(emailSections.join('<hr/>'))
                                        })];
                                case 20:
                                    _b.sent();
                                    logWithTimestamp("Sent notifications email to ".concat(email));
                                    return [3 /*break*/, 22];
                                case 21:
                                    err_1 = _b.sent();
                                    logWithTimestamp('Failed to send email to ' + email + ': ' + err_1);
                                    return [3 /*break*/, 22];
                                case 22: return [2 /*return*/];
                            }
                        });
                    };
                    _i = 0, users_1 = users;
                    _a.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    return [5 /*yield**/, _loop_1(user)];
                case 4:
                    _a.sent();
                    _a.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/];
            }
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var err_2, adminEmail, transporter, emailErr_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 9]);
                return [4 /*yield*/, main()];
            case 1:
                _a.sent();
                logWithTimestamp('Script finished successfully');
                process.exit(0);
                return [3 /*break*/, 9];
            case 2:
                err_2 = _a.sent();
                logWithTimestamp('Script failed: ' + err_2);
                adminEmail = process.env.ADMIN_EMAIL;
                if (!adminEmail) return [3 /*break*/, 7];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST || 'smtp.example.com',
                    port: Number(process.env.SMTP_PORT) || 587,
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                });
                return [4 /*yield*/, transporter.sendMail({
                        from: process.env.SMTP_FROM || 'noreply@example.com',
                        to: adminEmail,
                        subject: '[ALERT] User Notification Script Failed',
                        html: "<p>The notification script failed at ".concat(new Date().toISOString(), ":</p><pre>").concat(err_2 === null || err_2 === void 0 ? void 0 : err_2.toString(), "</pre>")
                    })];
            case 4:
                _a.sent();
                logWithTimestamp('Sent alert email to admin.');
                return [3 /*break*/, 6];
            case 5:
                emailErr_1 = _a.sent();
                logWithTimestamp('Failed to send admin alert email: ' + emailErr_1);
                return [3 /*break*/, 6];
            case 6: return [3 /*break*/, 8];
            case 7:
                logWithTimestamp('ADMIN_EMAIL not set, cannot send alert email.');
                _a.label = 8;
            case 8:
                process.exit(1);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); })();
