-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "durationType" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(0) NOT NULL,
    "endDate" TIMESTAMP(0) NOT NULL,
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "paymentId" INTEGER NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_paymentId_key" ON "Subscription"("paymentId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
