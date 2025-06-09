-- CreateTable
CREATE TABLE "OrientationSession" (
    "id" TEXT NOT NULL,
    "gondolaId" TEXT NOT NULL,
    "session_type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "instructor" TEXT NOT NULL,
    "max_participants" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrientationSession_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "OrientationSession" ADD CONSTRAINT "OrientationSession_gondolaId_fkey" FOREIGN KEY ("gondolaId") REFERENCES "Gondola"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
