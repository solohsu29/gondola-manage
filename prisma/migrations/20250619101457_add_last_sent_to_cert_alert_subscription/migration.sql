-- Add lastSent column to CertAlertSubscription
ALTER TABLE "CertAlertSubscription"
ADD COLUMN "lastSent" TIMESTAMPTZ;
