-- DropForeignKey
ALTER TABLE "DeliveryOrder" DROP CONSTRAINT "DeliveryOrder_projectId_fkey";

-- AlterTable
ALTER TABLE "DeliveryOrder" ALTER COLUMN "projectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
