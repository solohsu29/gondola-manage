/*
  Warnings:

  - A unique constraint covering the columns `[number]` on the table `DeliveryOrder` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "DeliveryOrder_number_key" ON "DeliveryOrder"("number");
