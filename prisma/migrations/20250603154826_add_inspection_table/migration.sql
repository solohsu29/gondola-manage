-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "inspector" TEXT NOT NULL,
    "priority" TEXT,
    "notes" TEXT,
    "notifyClient" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
