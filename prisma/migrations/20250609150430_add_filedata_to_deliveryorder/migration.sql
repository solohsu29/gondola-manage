-- AlterTable
ALTER TABLE "DeliveryOrder" ADD COLUMN     "fileData" BYTEA,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileType" TEXT;
