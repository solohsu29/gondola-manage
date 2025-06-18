-- CreateTable
CREATE TABLE "CertAlertSubscription" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL,
    "frequency" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertAlertSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CertAlertSubscription_gondolaId_email_key" ON "CertAlertSubscription"("gondolaId", "email");
