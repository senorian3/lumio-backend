-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "autoRenewal" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "cancelledAt" TIMESTAMP(3);
