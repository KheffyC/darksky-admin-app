-- CreateTable
CREATE TABLE "TuitionEditLog" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "oldAmount" INTEGER NOT NULL,
    "newAmount" INTEGER NOT NULL,
    "editedBy" TEXT NOT NULL,
    "editedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TuitionEditLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TuitionEditLog" ADD CONSTRAINT "TuitionEditLog_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
