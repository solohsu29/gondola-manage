-- AlterTable
ALTER TABLE "DeliveryOrder" ALTER COLUMN "items" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "OrientationSession" ALTER COLUMN "id" SET DEFAULT gen_random_uuid(),
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
