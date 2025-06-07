-- DropForeignKey
ALTER TABLE "Document" DROP CONSTRAINT "Document_gondolaId_fkey";

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "gondolaId" DROP NOT NULL,
ALTER COLUMN "expiry" DROP NOT NULL,
ALTER COLUMN "status" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
