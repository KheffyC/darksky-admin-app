-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "section" TEXT,
    "season" TEXT NOT NULL,
    "tuitionAmount" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "contractSigned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "stripePaymentId" TEXT,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnmatchedPayment" (
    "id" TEXT NOT NULL,
    "stripePaymentId" TEXT NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "cardLast4" TEXT,
    "customerName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnmatchedPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_email_key" ON "Member"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UnmatchedPayment_stripePaymentId_key" ON "UnmatchedPayment"("stripePaymentId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
