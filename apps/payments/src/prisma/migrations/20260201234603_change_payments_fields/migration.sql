/*
  Warnings:

  - Made the column `subscriptionType` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "stripePaymentCreatedAt" TIMESTAMP(3),
ALTER COLUMN "createdAt" DROP DEFAULT,
ALTER COLUMN "updatedAt" DROP NOT NULL,
ALTER COLUMN "subscriptionType" SET NOT NULL;
