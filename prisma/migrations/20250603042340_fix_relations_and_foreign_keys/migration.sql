-- CreateTable
CREATE TABLE "DeliveryOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "client" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "poReference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "items" INTEGER NOT NULL,

    CONSTRAINT "DeliveryOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "site" TEXT NOT NULL,
    "gondolas" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "endDate" TIMESTAMP(3),

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Gondola" (
    "id" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "locationDetail" TEXT NOT NULL,
    "lastInspection" TIMESTAMP(3) NOT NULL,
    "nextInspection" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "photoName" TEXT,
    "photoData" BYTEA,

    CONSTRAINT "Gondola_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uploaded" TIMESTAMP(3) NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "filePath" TEXT,
    "fileData" BYTEA,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftHistory" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "fromLocationDetail" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "toLocationDetail" TEXT NOT NULL,
    "shiftDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "shiftedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeliveryOrder" ADD CONSTRAINT "DeliveryOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftHistory" ADD CONSTRAINT "ShiftHistory_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
