-- AlterTable
ALTER TABLE "DeliveryOrder" ALTER COLUMN "orderDate" TYPE TEXT USING "orderDate"::text;
ALTER TABLE "DeliveryOrder" ALTER COLUMN "deliveryDate" TYPE TEXT USING "deliveryDate"::text;
