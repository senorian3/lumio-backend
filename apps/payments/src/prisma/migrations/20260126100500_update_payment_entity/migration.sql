-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "nextPaymentDate" TIMESTAMP(3),
ADD COLUMN     "periodEnd" TIMESTAMP(3),
ADD COLUMN     "periodStart" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionType" TEXT;
