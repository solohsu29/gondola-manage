/*
  Warnings:

  - A unique constraint covering the columns `[serialNumber]` on the table `Gondola` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "CertAlertSubscription" ALTER COLUMN "lastSent" SET DATA TYPE TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Gondola_serialNumber_key" ON "Gondola"("serialNumber");
