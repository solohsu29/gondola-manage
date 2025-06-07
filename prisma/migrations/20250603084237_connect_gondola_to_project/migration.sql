/*
  Warnings:

  - You are about to drop the column `gondolas` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Gondola" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "gondolas";

-- AddForeignKey
ALTER TABLE "Gondola" ADD CONSTRAINT "Gondola_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
