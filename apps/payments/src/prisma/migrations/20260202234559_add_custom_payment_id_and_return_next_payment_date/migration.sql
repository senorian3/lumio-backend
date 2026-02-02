/*
  Warnings:

  - Added the required column `customPaymentId` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Made the column `paymentsUrl` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `subscriptionId` on table `Payment` required. This step will fail if there are existing NULL values in that column.
  - Made the column `stripePaymentCreatedAt` on table `Payment` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "customPaymentId" TEXT NOT NULL,
ALTER COLUMN "paymentsUrl" SET NOT NULL,
ALTER COLUMN "subscriptionId" SET NOT NULL,
ALTER COLUMN "stripePaymentCreatedAt" SET NOT NULL;
