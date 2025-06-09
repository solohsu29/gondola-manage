/*
  Warnings:

  - A unique constraint covering the columns `[documentId]` on the table `DeliveryOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Inspection" DROP CONSTRAINT "Inspection_gondolaId_fkey";

-- AlterTable
ALTER TABLE "Certificate" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "DeliveryOrder" ADD COLUMN     "documentId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Gondola" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN     "time" TEXT,
ALTER COLUMN "gondolaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "projectManagerId" INTEGER,
ADD COLUMN     "projectName" VARCHAR(255),
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "ShiftHistory" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "RepairLog" (
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id" TEXT NOT NULL,
    "gondolaId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "partName" TEXT,
    "cost" DOUBLE PRECISION NOT NULL,
    "isChargeable" BOOLEAN,
    "technician" TEXT NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "RepairLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectManager" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fileData" BYTEA NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectGondola" (
    "projectId" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,

    CONSTRAINT "ProjectGondola_pkey" PRIMARY KEY ("projectId","gondolaId")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "photoData" BYTEA,
    "photoName" TEXT,
    "photoMimeType" TEXT,
    "notificationPreferences" JSONB,
    "language" TEXT,
    "timezone" TEXT,
    "dateFormat" TEXT,
    "timeFormat" TEXT,
    "currency" TEXT,
    "darkMode" BOOLEAN,
    "compactMode" BOOLEAN,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "actionLink" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectManager_email_key" ON "ProjectManager"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_documentId_key" ON "DeliveryOrder"("documentId");

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "ProjectManager"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RepairLog" ADD CONSTRAINT "RepairLog_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGondola" ADD CONSTRAINT "ProjectGondola_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectGondola" ADD CONSTRAINT "ProjectGondola_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
